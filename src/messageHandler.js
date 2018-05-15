Object.defineProperty(exports, "__esModule", { value: true });
const messages_1 = require("./messages");
const objectPool_1 = require("./objectPool");
const serialisation_1 = require("./serialisation");
const farRef_1 = require("./farRef");
const GSP_1 = require("./Replication/GSP");
const signalPool_1 = require("./Reactivivity/signalPool");
/**
 * Created by flo on 20/12/2016.
 */
var utils = require('./utils');
class MessageHandler {
    constructor(environment) {
        this.environment = environment;
    }
    sendReturnServer(actorId, actorAddress, actorPort, msg) {
        let commMedium = this.environment.commMedium;
        if (!(commMedium.hasConnection(actorId))) {
            commMedium.openConnection(actorId, actorAddress, actorPort);
        }
        commMedium.sendMessage(actorId, msg);
    }
    sendReturnClient(actorId, originalMsg, returnMsg) {
        let thisRef = this.environment.thisRef;
        let commMedium = this.environment.commMedium;
        if (thisRef instanceof farRef_1.ClientFarReference) {
            //Message to which actor is replying came from a different client host, send routing message to contact server actor
            if (thisRef.mainId != originalMsg.senderMainId) {
                this.sendReturnServer(originalMsg.contactId, originalMsg.contactAddress, originalMsg.contactPort, new messages_1.RouteMessage(this.environment.thisRef, actorId, returnMsg));
            }
            else {
                commMedium.sendMessage(actorId, returnMsg);
            }
        }
        else {
            commMedium.sendMessage(actorId, returnMsg);
        }
    }
    //Only received as first message by a web worker (i.e. newly spawned client side actor)
    handleInstall(msg, ports) {
        var thisId = msg.actorId;
        var mainId = msg.mainId;
        this.environment.thisRef = new farRef_1.ClientFarReference(objectPool_1.ObjectPool._BEH_OBJ_ID, thisId, mainId, this.environment);
        this.environment.gspInstance = new GSP_1.GSP(thisId, this.environment);
        var behaviourObject = serialisation_1.reconstructBehaviour({}, msg.vars, msg.methods, this.environment);
        serialisation_1.reconstructStatic(behaviourObject, msg.staticProperties, this.environment);
        var otherActorIds = msg.otherActorIds;
        this.environment.objectPool = new objectPool_1.ObjectPool(behaviourObject);
        var parentRef = new farRef_1.ClientFarReference(objectPool_1.ObjectPool._BEH_OBJ_ID, mainId, mainId, this.environment);
        let channelManag = this.environment.commMedium;
        this.environment.signalPool = new signalPool_1.SignalPool(this.environment);
        var mainPort = ports[0];
        channelManag.newConnection(mainId, mainPort);
        otherActorIds.forEach((id, index) => {
            //Ports at position 0 contains main channel (i.e. channel used to communicate with application actor)
            channelManag.newConnection(id, ports[index + 1]);
        });
        utils.installSTDLib(false, parentRef, behaviourObject, this.environment);
    }
    handleOpenPort(msg, port) {
        var channelManager = this.environment.commMedium;
        channelManager.newConnection(msg.actorId, port);
    }
    handleFieldAccess(msg) {
        var targetObject = this.environment.objectPool.getObject(msg.objectId);
        var fieldVal = Reflect.get(targetObject, msg.fieldName);
        //Due to JS' crappy meta API actor might receive field access as part of a method invocation (see farRef implementation)
        if (typeof fieldVal != 'function') {
            var serialised = serialisation_1.serialise(fieldVal, msg.senderId, this.environment);
            var message = new messages_1.ResolvePromiseMessage(this.environment.thisRef, msg.promiseId, serialised);
            if (msg.senderType == messages_1.Message.serverSenderType) {
                this.sendReturnServer(msg.senderId, msg.senderAddress, msg.senderPort, message);
            }
            else {
                this.sendReturnClient(msg.senderId, msg, message);
            }
        }
    }
    handleMethodInvocation(msg) {
        var targetObject = this.environment.objectPool.getObject(msg.objectId);
        var methodName = msg.methodName;
        var args = msg.args;
        var deserialisedArgs = args.map((arg) => {
            return serialisation_1.deserialise(arg, this.environment);
        });
        var retVal;
        try {
            retVal = targetObject[methodName].apply(targetObject, deserialisedArgs);
            //retVal = targetObject[methodName](...deserialisedArgs)
            var serialised = serialisation_1.serialise(retVal, msg.senderId, this.environment);
            var message = new messages_1.ResolvePromiseMessage(this.environment.thisRef, msg.promiseId, serialised);
            if (msg.senderType == messages_1.Message.serverSenderType) {
                this.sendReturnServer(msg.senderId, msg.senderAddress, msg.senderPort, message);
            }
            else {
                this.sendReturnClient(msg.senderId, msg, message);
            }
        }
        catch (reason) {
            console.log("Went wrong for : " + methodName);
            var serialised = serialisation_1.serialise(reason, msg.senderId, this.environment);
            message = new messages_1.RejectPromiseMessage(this.environment.thisRef, msg.promiseId, serialised);
            if (msg.senderType == messages_1.Message.serverSenderType) {
                this.sendReturnServer(msg.senderId, msg.senderAddress, msg.senderPort, message);
            }
            else {
                this.sendReturnClient(msg.senderId, msg, message);
            }
        }
    }
    handlePromiseResolve(msg) {
        let promisePool = this.environment.promisePool;
        var deSerialised = serialisation_1.deserialise(msg.value, this.environment);
        if (msg.foreign) {
            promisePool.resolveForeignPromise(msg.promiseId, msg.senderId, deSerialised);
        }
        else {
            promisePool.resolvePromise(msg.promiseId, deSerialised);
        }
    }
    handlePromiseReject(msg) {
        let promisePool = this.environment.promisePool;
        var deSerialised = serialisation_1.deserialise(msg.reason, this.environment);
        if (msg.foreign) {
            promisePool.rejectForeignPromise(msg.promiseId, msg.senderId, deSerialised);
        }
        else {
            promisePool.rejectPromise(msg.promiseId, deSerialised);
        }
    }
    //Can only be received by a server actor
    handleConnectRemote(msg, clientSocket) {
        var resolveMessage = new messages_1.ResolveConnectionMessage(this.environment.thisRef, msg.promiseId, msg.connectionId);
        if (msg.senderType == messages_1.Message.serverSenderType) {
            this.sendReturnServer(msg.senderId, msg.senderAddress, msg.senderPort, resolveMessage);
        }
        else {
            var socketManager = this.environment.commMedium;
            socketManager.addNewClient(msg.senderId, clientSocket);
            this.sendReturnClient(msg.senderId, msg, resolveMessage);
        }
    }
    handleResolveConnection(msg) {
        this.environment.commMedium.resolvePendingConnection(msg.senderId, msg.connectionId);
        var farRef = new farRef_1.ServerFarReference(objectPool_1.ObjectPool._BEH_OBJ_ID, msg.senderId, msg.senderAddress, msg.senderPort, this.environment);
        this.environment.promisePool.resolvePromise(msg.promiseId, farRef.proxyify());
    }
    handleRoute(msg) {
        //TODO temp fix , works but should be refactored
        if (msg.message.typeTag == messages_1._METHOD_INVOC_) {
            var args = msg.message.args;
            args.forEach((valContainer) => {
                if (valContainer.type == serialisation_1.ValueContainer.clientFarRefType) {
                    var container = valContainer;
                    if (container.contactId == null) {
                        let thisRef = this.environment.thisRef;
                        container.contactId = thisRef.ownerId;
                        container.contactAddress = thisRef.ownerAddress;
                        container.contactPort = thisRef.ownerPort;
                    }
                }
            });
        }
        this.environment.commMedium.sendMessage(msg.targetId, msg.message);
    }
    handleGSPRound(msg) {
        this.environment.gspInstance.roundReceived(msg.round, msg.senderId);
    }
    handleGSPSync(msg) {
        this.environment.gspInstance.receiveSync(msg.requesterId, msg.repliqId);
    }
    handleGSPRegister(msg) {
        let commMedium = this.environment.commMedium;
        if (!commMedium.hasConnection(msg.holderId)) {
            commMedium.openConnection(msg.holderId, msg.holderAddress, msg.holderPort);
        }
        this.environment.gspInstance.registerReplicaHolder(msg.replicaId, msg.holderId, msg.roundNr);
    }
    handleRegisterExternalSignal(msg) {
        let commMedium = this.environment.commMedium;
        if (!commMedium.hasConnection(msg.requesterId)) {
            commMedium.openConnection(msg.requesterId, msg.requesterAddress, msg.requesterPort);
        }
        //console.log("External listener added for signal: " + msg.signalId + " from : " + msg.requesterId)
        this.environment.signalPool.registerExternalListener(msg.signalId, msg.requesterId);
    }
    handleExternalSignalChange(msg) {
        //console.log("External signal changed received")
        let newVal = serialisation_1.deserialise(msg.newVal, this.environment);
        this.environment.signalPool.externalChangeReceived(msg.senderId, msg.signalId, newVal);
        //this.environment.signalPool.sourceChanged(msg.signalId,newVal)
    }
    handleExternalSignalDelete(msg) {
        this.environment.signalPool.garbageCollect(msg.signalId);
    }
    //Ports are needed for client side actor communication and cannot be serialised together with message objects (is always empty for server-side code)
    //Client socket is provided by server-side implementation and is used whenever a client connects remotely to a server actor
    dispatch(msg, ports = [], clientSocket = null) {
        switch (msg.typeTag) {
            case messages_1._INSTALL_BEHAVIOUR_:
                this.handleInstall(msg, ports);
                break;
            case messages_1._OPEN_PORT_:
                this.handleOpenPort(msg, ports[0]);
                break;
            case messages_1._FIELD_ACCESS_:
                this.handleFieldAccess(msg);
                break;
            case messages_1._METHOD_INVOC_:
                this.handleMethodInvocation(msg);
                break;
            case messages_1._RESOLVE_PROMISE_:
                this.handlePromiseResolve(msg);
                break;
            case messages_1._REJECT_PROMISE_:
                this.handlePromiseReject(msg);
                break;
            case messages_1._CONNECT_REMOTE_:
                this.handleConnectRemote(msg, clientSocket);
                break;
            case messages_1._RESOLVE_CONNECTION_:
                this.handleResolveConnection(msg);
                break;
            case messages_1._ROUTE_:
                this.handleRoute(msg);
                break;
            case messages_1._GSP_ROUND_:
                this.handleGSPRound(msg);
                break;
            case messages_1._GSP_SYNC_:
                this.handleGSPSync(msg);
                break;
            case messages_1._GSP_REGISTER_:
                this.handleGSPRegister(msg);
                break;
            case messages_1._REGISTER_EXTERNAL_SIGNAL_:
                this.handleRegisterExternalSignal(msg);
                break;
            case messages_1._EXTERNAL_SIGNAL_CHANGE_:
                this.handleExternalSignalChange(msg);
                break;
            case messages_1._EXTERNAL_SIGNAL_DELETE_:
                this.handleExternalSignalDelete(msg);
                break;
            default:
                throw "Unknown message in actor : " + msg.toString();
        }
    }
}
exports.MessageHandler = MessageHandler;
//# sourceMappingURL=messageHandler.js.map