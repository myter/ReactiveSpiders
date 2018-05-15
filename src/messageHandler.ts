import {
    Message, _FIELD_ACCESS_, FieldAccessMessage,
    ResolvePromiseMessage, _RESOLVE_PROMISE_, _METHOD_INVOC_, MethodInvocationMessage, _REJECT_PROMISE_,
    RejectPromiseMessage, _INSTALL_BEHAVIOUR_, InstallBehaviourMessage, _OPEN_PORT_, OpenPortMessage, _CONNECT_REMOTE_,
    ConnectRemoteMessage, ResolveConnectionMessage, _RESOLVE_CONNECTION_, RouteMessage, _ROUTE_, _GSP_ROUND_,
    GSPRoundMessage, _GSP_SYNC_, GSPSyncMessage, _GSP_REGISTER_, GSPRegisterMessage, RegisterExternalSignalMessage,
    _REGISTER_EXTERNAL_SIGNAL_, ExternalSignalChangeMessage, _EXTERNAL_SIGNAL_CHANGE_, ExternalSignalDeleteMessage,
    _EXTERNAL_SIGNAL_DELETE_
} from "./messages";
import {ServerSocketManager} from "./sockets";
import {PromisePool} from "./PromisePool";
import {ObjectPool} from "./objectPool";
import {
    ValueContainer, serialise, deserialise, reconstructObject, ClientFarRefContainer,
    reconstructBehaviour, reconstructStatic
} from "./serialisation";
import {ServerFarReference, FarReference, ClientFarReference} from "./farRef";
import {CommMedium} from "./commMedium";
import {ChannelManager} from "./ChannelManager";
import {Socket} from "net";
import {GSP} from "./Replication/GSP";
import {Signal} from "./Reactivivity/signal";
import {SignalPool} from "./Reactivivity/signalPool";
import {ActorEnvironment} from "./ActorEnvironment";
/**
 * Created by flo on 20/12/2016.
 */
var utils       = require('./utils')

export class MessageHandler{
    environment : ActorEnvironment

    constructor(environment : ActorEnvironment){
        this.environment = environment
    }

    private sendReturnServer(actorId : string,actorAddress : string,actorPort : number,msg : Message){
        let commMedium = this.environment.commMedium
        if(!(commMedium.hasConnection(actorId))){
            commMedium.openConnection(actorId,actorAddress,actorPort)
        }
        commMedium.sendMessage(actorId,msg)
    }

    private sendReturnClient(actorId : string,originalMsg : Message,returnMsg : Message){
        let thisRef     = this.environment.thisRef
        let commMedium  = this.environment.commMedium
        if(thisRef instanceof ClientFarReference){
            //Message to which actor is replying came from a different client host, send routing message to contact server actor
            if((thisRef as ClientFarReference).mainId != originalMsg.senderMainId){
                this.sendReturnServer(originalMsg.contactId,originalMsg.contactAddress,originalMsg.contactPort,new RouteMessage(this.environment.thisRef,actorId,returnMsg))
            }
            else{
                commMedium.sendMessage(actorId,returnMsg)
            }
        }
        else{
            commMedium.sendMessage(actorId,returnMsg)
        }
    }

    //Only received as first message by a web worker (i.e. newly spawned client side actor)
    private handleInstall(msg : InstallBehaviourMessage,ports : Array<MessagePort>){
        var thisId                      = msg.actorId
        var mainId                      = msg.mainId
        this.environment.thisRef        = new ClientFarReference(ObjectPool._BEH_OBJ_ID,thisId,mainId,this.environment)
        this.environment.gspInstance    = new GSP(thisId,this.environment)
        var behaviourObject             = reconstructBehaviour({},msg.vars,msg.methods,this.environment)
        reconstructStatic(behaviourObject,msg.staticProperties,this.environment)
        var otherActorIds               = msg.otherActorIds
        this.environment.objectPool     = new ObjectPool(behaviourObject)
        var parentRef                   = new ClientFarReference(ObjectPool._BEH_OBJ_ID,mainId,mainId,this.environment)
        let channelManag                = this.environment.commMedium as ChannelManager
        this.environment.signalPool     = new SignalPool(this.environment)
        var mainPort                = ports[0]
        channelManag.newConnection(mainId,mainPort)
        otherActorIds.forEach((id,index)=>{
            //Ports at position 0 contains main channel (i.e. channel used to communicate with application actor)
            channelManag.newConnection(id,ports[index + 1])
        })
        utils.installSTDLib(false,parentRef,behaviourObject,this.environment)
    }

    private handleOpenPort(msg : OpenPortMessage,port : MessagePort){
        var channelManager = (this.environment.commMedium as ChannelManager)
        channelManager.newConnection(msg.actorId,port)
    }

    private handleFieldAccess(msg : FieldAccessMessage){
        var targetObject    = this.environment.objectPool.getObject(msg.objectId)
        var fieldVal        = Reflect.get(targetObject,msg.fieldName)
        //Due to JS' crappy meta API actor might receive field access as part of a method invocation (see farRef implementation)
        if(typeof fieldVal != 'function'){
            var serialised  = serialise(fieldVal,msg.senderId,this.environment)
            var message     = new ResolvePromiseMessage(this.environment.thisRef,msg.promiseId,serialised)
            if(msg.senderType == Message.serverSenderType){
                this.sendReturnServer(msg.senderId,msg.senderAddress,msg.senderPort,message)
            }
            else{
                this.sendReturnClient(msg.senderId,msg,message)
            }
        }
    }

    private handleMethodInvocation(msg : MethodInvocationMessage){
        var targetObject                        = this.environment.objectPool.getObject(msg.objectId)
        var methodName                          = msg.methodName
        var args                                = msg.args
        var deserialisedArgs                    = args.map((arg) => {
            return deserialise(arg,this.environment)
        })
        var retVal
        try{
            retVal = targetObject[methodName].apply(targetObject,deserialisedArgs)
            //retVal = targetObject[methodName](...deserialisedArgs)
            var serialised : ValueContainer         = serialise(retVal,msg.senderId,this.environment)
            var message    : Message                = new ResolvePromiseMessage(this.environment.thisRef,msg.promiseId,serialised)
            if(msg.senderType == Message.serverSenderType){
                this.sendReturnServer(msg.senderId,msg.senderAddress,msg.senderPort,message)
            }
            else{
                this.sendReturnClient(msg.senderId,msg,message)
            }
        }
        catch(reason){
            console.log("Went wrong for : " + methodName)
            var serialised : ValueContainer         = serialise(reason,msg.senderId,this.environment)
            message                             = new RejectPromiseMessage(this.environment.thisRef,msg.promiseId,serialised)
            if(msg.senderType == Message.serverSenderType){
                this.sendReturnServer(msg.senderId,msg.senderAddress,msg.senderPort,message)
            }
            else{
                this.sendReturnClient(msg.senderId,msg,message)
            }
        }

    }

    private handlePromiseResolve(msg : ResolvePromiseMessage){
        let promisePool = this.environment.promisePool
        var deSerialised = deserialise(msg.value,this.environment)
        if(msg.foreign){
            promisePool.resolveForeignPromise(msg.promiseId,msg.senderId,deSerialised)
        }
        else{
            promisePool.resolvePromise(msg.promiseId,deSerialised)
        }
    }

    private handlePromiseReject(msg : RejectPromiseMessage){
        let promisePool = this.environment.promisePool
        var deSerialised  = deserialise(msg.reason,this.environment)
        if(msg.foreign){
            promisePool.rejectForeignPromise(msg.promiseId,msg.senderId,deSerialised)
        }
        else{
            promisePool.rejectPromise(msg.promiseId,deSerialised)
        }
    }

    //Can only be received by a server actor
    private handleConnectRemote(msg : ConnectRemoteMessage,clientSocket : Socket){
        var resolveMessage = new ResolveConnectionMessage(this.environment.thisRef,msg.promiseId,msg.connectionId)
        if(msg.senderType == Message.serverSenderType){
            this.sendReturnServer(msg.senderId,msg.senderAddress,msg.senderPort,resolveMessage)
        }
        else{
            var socketManager = this.environment.commMedium as ServerSocketManager
            socketManager.addNewClient(msg.senderId,clientSocket)
            this.sendReturnClient(msg.senderId,msg,resolveMessage)
        }
    }

    private handleResolveConnection(msg : ResolveConnectionMessage){
        this.environment.commMedium.resolvePendingConnection(msg.senderId,msg.connectionId)
        var farRef = new ServerFarReference(ObjectPool._BEH_OBJ_ID,msg.senderId,msg.senderAddress,msg.senderPort,this.environment)
        this.environment.promisePool.resolvePromise(msg.promiseId,farRef.proxyify())
    }

    private handleRoute(msg : RouteMessage){
        //TODO temp fix , works but should be refactored
        if(msg.message.typeTag == _METHOD_INVOC_){
            var args = (msg.message as MethodInvocationMessage).args
            args.forEach((valContainer : ValueContainer)=>{
                if(valContainer.type == ValueContainer.clientFarRefType){
                    var container = valContainer as ClientFarRefContainer
                    if(container.contactId == null){
                        let thisRef                 = this.environment.thisRef
                        container.contactId         = thisRef.ownerId
                        container.contactAddress    = (thisRef as ServerFarReference).ownerAddress
                        container.contactPort       = (thisRef as ServerFarReference).ownerPort
                    }
                }
            })
        }
        this.environment.commMedium.sendMessage(msg.targetId,msg.message)
    }

    private handleGSPRound(msg : GSPRoundMessage){
        this.environment.gspInstance.roundReceived(msg.round,msg.senderId)
    }

    private handleGSPSync(msg : GSPSyncMessage){
        this.environment.gspInstance.receiveSync(msg.requesterId,msg.repliqId)
    }

    private handleGSPRegister(msg : GSPRegisterMessage){
        let commMedium = this.environment.commMedium
        if(!commMedium.hasConnection(msg.holderId)){
            commMedium.openConnection(msg.holderId,msg.holderAddress,msg.holderPort)
        }
        this.environment.gspInstance.registerReplicaHolder(msg.replicaId,msg.holderId,msg.roundNr)
    }

    private handleRegisterExternalSignal(msg : RegisterExternalSignalMessage){
        let commMedium = this.environment.commMedium
        if(!commMedium.hasConnection(msg.requesterId)){
            commMedium.openConnection(msg.requesterId,msg.requesterAddress,msg.requesterPort)
        }
        //console.log("External listener added for signal: " + msg.signalId + " from : " + msg.requesterId)
        this.environment.signalPool.registerExternalListener(msg.signalId,msg.requesterId)
    }

    private handleExternalSignalChange(msg : ExternalSignalChangeMessage){
        //console.log("External signal changed received")
        let newVal = deserialise(msg.newVal,this.environment)
        this.environment.signalPool.externalChangeReceived(msg.senderId,msg.signalId,newVal)
        //this.environment.signalPool.sourceChanged(msg.signalId,newVal)
    }

    private handleExternalSignalDelete(msg : ExternalSignalDeleteMessage){
        this.environment.signalPool.garbageCollect(msg.signalId)
    }

    //Ports are needed for client side actor communication and cannot be serialised together with message objects (is always empty for server-side code)
    //Client socket is provided by server-side implementation and is used whenever a client connects remotely to a server actor
    dispatch(msg : Message,ports : Array<MessagePort> = [],clientSocket : Socket = null) : void {
        switch(msg.typeTag){
            case _INSTALL_BEHAVIOUR_:
                this.handleInstall(msg as InstallBehaviourMessage,ports)
                break
            case _OPEN_PORT_:
                this.handleOpenPort(msg as OpenPortMessage,ports[0])
                break
            case _FIELD_ACCESS_:
                this.handleFieldAccess(msg as FieldAccessMessage)
                break
            case _METHOD_INVOC_:
                this.handleMethodInvocation(msg as MethodInvocationMessage)
                break
            case _RESOLVE_PROMISE_:
                this.handlePromiseResolve(msg as ResolvePromiseMessage)
                break
            case _REJECT_PROMISE_:
                this.handlePromiseReject(msg as RejectPromiseMessage)
                break
            case _CONNECT_REMOTE_:
                this.handleConnectRemote(msg as ConnectRemoteMessage,clientSocket)
                break
            case _RESOLVE_CONNECTION_:
                this.handleResolveConnection(msg as ResolveConnectionMessage)
                break
            case _ROUTE_:
                this.handleRoute(msg as RouteMessage)
                break
            case _GSP_ROUND_:
                this.handleGSPRound(msg as GSPRoundMessage)
                break
            case _GSP_SYNC_:
                this.handleGSPSync(msg as GSPSyncMessage)
                break
            case _GSP_REGISTER_:
                this.handleGSPRegister(msg as GSPRegisterMessage)
                break
            case _REGISTER_EXTERNAL_SIGNAL_:
                this.handleRegisterExternalSignal(msg as RegisterExternalSignalMessage)
                break
            case _EXTERNAL_SIGNAL_CHANGE_:
                this.handleExternalSignalChange(msg as ExternalSignalChangeMessage)
                break
            case _EXTERNAL_SIGNAL_DELETE_:
                this.handleExternalSignalDelete(msg as ExternalSignalDeleteMessage)
                break
            default:
                throw "Unknown message in actor : " + msg.toString()
        }
    }
}