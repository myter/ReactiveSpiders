import {Actor,  FarRef, PSClient, PubSubTag, SpiderIsolate} from "spiders.js";
import {DistGlitchPrevention} from "../DistGlitchPrevention";
import {ReactiveMirror} from "../ReactiveMirror";
import {DerivedSignal, Signal} from "../Signal";
import {DijkstraScholten} from "./DijkstraScholten";
import {NodePulse} from "./NodePulse";
import {PulseState} from "./PulseState";
import {Mirror} from "./Mirror";
import {ReactiveActor} from "../ReactiveActor";
import {DependencyChangePulse} from "./DependencyChangePulse";
import {SIDUPAdmitter} from "./SIDUPAdmitter";



//Purely used to capture changing of a local signal
//All the rest is implemented ad-hoc by SIDUP
export class SIDUP extends SpiderIsolate implements DistGlitchPrevention{
    actorMirror        : ReactiveMirror

    setMirror(actorMirror: ReactiveMirror) {
        this.actorMirror = actorMirror
    }

    registerSourceSignal(signal: Signal) {}

    registerDerivedSignal(signal: DerivedSignal){}

    localSignalChanged(signal: Signal) {
        (this.actorMirror.base.behaviourObject as any).internalSignalChanged(signal)
    }

    remoteSignalChanged(signal: Signal) {}

    signalSent(signal: Signal, target: FarRef<SIDUPActor>) {}

    signalReceived(signal: Signal, from: FarRef<SIDUPActor>) {}

}


export class SIDUPActor extends ReactiveActor{
    //Imported definitions
    DijkstraScholten
    NodePulse
    PulseState
    Mirror
    //Termination
    termination         : DijkstraScholten
    //Topology
    ownType             : PubSubTag
    admitterType        : PubSubTag
    parentTypes         : Array<PubSubTag>
    childrenTypes       : Array<PubSubTag>
    isSink              : boolean
    parentRefs          : Array<FarRef<SIDUPActor>>
    childrenRefs        : Array<FarRef<SIDUPActor>>
    admitterRef         : FarRef<SIDUPAdmitter>
    //Pub/Sub
    psServerAddress     : string
    psServerPort        : number
    psClient            : PSClient
    //Graph init
    setsReceived        : number
    reachables          : Array<string>
    parentReachables    : Map<string,Array<string>>
    waitingResolvers    : Array<Function>
    admittListeners     : Array<Function>
    //Propagation
    ownPulse            : PulseState
    lastVal             : Signal
    lastTriggerPulse    : NodePulse
    publishedSignalId   : string
    mirrors             : Map<string,Mirror>
    inputSignals        : Map<string,Signal>
    //Dynamic changes
    inChange            : boolean

    constructor(ownType : PubSubTag,admitterType : PubSubTag,parents : Array<PubSubTag>,isSink = false,psServerAddress = "127.0.0.1",psServerPort = 8000){
        super(new ReactiveMirror(new SIDUP()))
        this.DijkstraScholten   = DijkstraScholten
        this.NodePulse          = NodePulse
        this.PulseState         = PulseState
        this.Mirror             = Mirror
        this.ownType            = ownType
        this.admitterType       = admitterType
        this.parentTypes        = parents
        this.isSink             = isSink
    }

    init(){
        this.termination        = new this.DijkstraScholten()
        this.psClient           = this.libs.setupPSClient(this.psServerAddress,this.psServerPort)
        this.parentRefs         = []
        this.childrenTypes      = []
        this.childrenRefs       = []
        this.setsReceived       = 0
        this.reachables         = []
        this.parentReachables   = new Map()
        this.waitingResolvers   = []
        this.admittListeners    = []
        this.mirrors            = new Map()
        this.inputSignals       = new Map()
        this.ownPulse           = new this.PulseState()
        this.inChange           = false
        this.psClient.publish(this,this.ownType)
        this.psClient.subscribe(this.admitterType).each((admitterRef : FarRef<SIDUPAdmitter>)=>{
            this.admitterRef = admitterRef
            if(this.parentTypes.length == 0){
                admitterRef.sourceRegister(this)
            }
            this.admittListeners.forEach((listener)=>{
                listener()
            })
        })
        if(this.parentTypes.length == 0){
            this.reachables.push(this.ownType.tagVal)
        }
        this.parentTypes.forEach((parentType : PubSubTag)=>{
            this.mirrors.set(parentType.tagVal,new this.Mirror(parentType,this.PulseState))
            this.psClient.subscribe(parentType).each((parentRef : FarRef<SIDUPActor>)=>{
                this.parentRefs.push(parentRef);
                (parentRef.getReachable(this,this.ownType) as any).then((reachables : Array<string>)=>{
                    this.setsReceived++
                    reachables.forEach((reachable : string)=>{
                        if(!(this.reachables as any).includes(reachable)){
                            this.reachables.push(reachable)
                        }
                    })
                    this.parentReachables.set(parentType.tagVal,reachables)
                    if(this.setsReceived == this.parentTypes.length){
                        this.waitingResolvers.forEach((resolver)=>{
                            resolver(this.reachables)
                        })
                        if(this.isSink){
                            this.sendToAdmitter(()=>{
                                this.admitterRef.sinkReady()
                            })
                        }
                    }
                })
            })
        })
    }

    sendToAdmitter(sendFunc : Function){
        if(this.admitterRef){
            sendFunc()
        }
        else{
            this.admittListeners.push(sendFunc)
        }
    }

    reset(){
        this.ownPulse.setPending()
        this.parentTypes.forEach((parentType : PubSubTag)=>{
            let mirror = this.mirrors.get(parentType.tagVal)
            mirror.pulseValue.setPending()
        })
    }

    ////////////////////////////////////////
    // Calls made by actors extending this//
    ////////////////////////////////////////

    publishSignal(signal : Signal){
        //Need to be sure that our list of children is complete, which is only the case of the graph is completely constructed
        let publish = () => {
            this.childrenRefs.forEach((childRef : FarRef<SIDUPActor>)=>{
                childRef.receiveSignal(signal,this.ownType)
            })
        }
        let checkAdmitter = ()=>{
            (this.admitterRef.graphReady() as any).then(()=>{
                publish()
            })
        }
        this.sendToAdmitter(checkAdmitter)
        this.publishedSignalId = signal.id
    }

    ////////////////////////////////////////
    // Calls made by other SIDUP actors   //
    ////////////////////////////////////////

    receiveSignal(signal : Signal,from : PubSubTag){
        if(!this.inputSignals.has(from.tagVal)){
            this.inputSignals.set(from.tagVal,signal);
            this.mirrors.get(from.tagVal).steadyValue = signal;
            (this.libs.reflectOnActor() as ReactiveMirror).newSource(signal)
        }
        if(this.inputSignals.size == this.parentTypes.length && Reflect.has(this,"start")){
            let args = []
            //Make sure args are provided in the same order as the parents are specified
            this.parentTypes.forEach((parentType : PubSubTag,index : number)=>{
                args[index] = this.inputSignals.get(parentType.tagVal)
            });
            (this as any).start(...args)
        }
        if(this.isSink && this.inputSignals.size == this.parentTypes.length){
            this.sendToAdmitter(()=>{
                this.admitterRef.sinkStarted()
            })
        }
    }

    ack(){
        this.termination.newAckMessage()
    }

    getType(){
        return this.ownType
    }

    getReachable(childRef : FarRef<SIDUPActor>,childType : PubSubTag){
        this.childrenTypes.push(childType)
        this.childrenRefs.push(childRef)
        if(this.setsReceived == this.parentTypes.length){
            return this.reachables
        }
        else{
            return new Promise((resolve)=>{
                this.waitingResolvers.push(resolve)
            })
        }
    }

    newPulse(senderType : PubSubTag,senderRef : FarRef<SIDUPActor>,pulse : NodePulse){
        this.termination.newParentMessage(senderRef)
        let senderMirror            = this.mirrors.get(senderType.tagVal)
        senderMirror.steadyValue    = pulse.value
        senderMirror.pulseValue     = pulse.pulseState
        let propagate               = true
        this.parentTypes.forEach((parenType : PubSubTag)=>{
            let parentMirror = this.mirrors.get(parenType.tagVal)
            if(parentMirror.pulseValue.isPending()){
                let parentReachables    = this.parentReachables.get(parenType.tagVal)
                let commonSources       = parentReachables.filter((parentReachable : string)=>{
                    return (pulse.sourcesChanged as any).includes(parentReachable)
                })
                if(commonSources.length > 0){
                    propagate = false
                }
            }
        })
        if(propagate){
            let anyChanged  = false
            let values      = []
            this.parentTypes.forEach((parentType : PubSubTag)=>{
                let mirror = this.mirrors.get(parentType.tagVal)
                values.push(mirror.steadyValue)
                if(mirror.pulseValue.isChanged()){
                    anyChanged = true
                }
            })
            //No need to send actual pulse here. By changing the internal signal the "propagate" method will eventually be triggered
            this.lastTriggerPulse = pulse
            if(anyChanged){
                this.ownPulse.setChanged();
               (this.libs.reflectOnActor() as ReactiveMirror).sourcesChanged(values)
            }
            else{
                this.ownPulse.setUnchanged()
                //No need to let local graph propagate (given that there are no changes, propagate NO_CHANGE to all distributed children
                this.propagateNoChange()
            }
            this.reset()
            if(this.childrenRefs.length == 0){
                this.termination.nodeTerminated()
            }
        }
    }

    updateReachable(isNewParent : boolean,senderRef : FarRef<SIDUPActor>,senderType : PubSubTag,reachables : Array<string>,parentSignal?){
        this.termination.newParentMessage(senderRef)
        if(isNewParent){
            if(this.parentReachables.has(senderType.tagVal)){
                throw new Error("New parent already exists")
            }
            else{
                this.mirrors.set(senderType.tagVal,new this.Mirror(senderType,this.PulseState))
                this.parentTypes.push(senderType)
                this.parentRefs.push(senderRef)
                this.parentReachables.set(senderType.tagVal,reachables)
                this.inputSignals.forEach((iSignal)=>{
                    let deps = (this.libs.reflectOnActor() as ReactiveMirror).localGraph.getDependants(iSignal.id)
                    deps.forEach((dependant : Signal)=>{
                        (this.libs.reflectOnActor() as ReactiveMirror).localGraph.newSource(parentSignal);
                        (this.libs.reflectOnActor() as ReactiveMirror).localGraph.addDependency(dependant.id,parentSignal.id)
                    })
                })
                this.inputSignals.set(senderType.tagVal,parentSignal)
            }
        }
        else{
            let previousReachables : any = this.parentReachables.get(senderType.tagVal)
            reachables.forEach((reachable : string)=>{
                if(!previousReachables.includes(reachable)){
                    previousReachables.push(reachable)
                }
            })
        }
        reachables.forEach((reachable : string)=>{
            if(!(this.reachables as any).includes(reachable)){
                this.reachables.push(reachable)
            }
        })
        this.childrenRefs.forEach((childRef : FarRef<SIDUPActor>)=>{
            this.termination.newChildMessage()
            childRef.updateReachable(false,this,this.ownType,this.reachables)
        })
        if(this.childrenRefs.length == 0){
            this.termination.nodeTerminated()
        }
    }

    addDependency(sender : FarRef<SIDUPActor>,changePulse : DependencyChangePulse){
        this.termination.newParentMessage(sender)
        let from    = changePulse.fromType.tagVal
        let to      = changePulse.toType.tagVal
        if(from == this.ownType.tagVal && !this.inChange){
            let childTypes : any = this.childrenTypes.map((childType : PubSubTag)=>{
                return childType.tagVal
            })
            if(childTypes.includes(to)){
                throw new Error("Adding dependency which already exists")
            }
            else{
                this.childrenTypes.push(changePulse.toType)
                this.inChange = true
                this.psClient.subscribe(changePulse.toType).once((newChildRef : FarRef<SIDUPActor>)=>{
                    this.childrenRefs.push(newChildRef)
                    this.termination.newChildMessage()
                    newChildRef.updateReachable(true,this,this.ownType,this.reachables,this.lastVal)
                })
            }
        }
        else if(!this.inChange){
            this.inChange = true
            this.childrenRefs.forEach((childRef : FarRef<SIDUPActor>)=>{
                this.termination.newChildMessage()
                childRef.addDependency(this,changePulse)
            })
        }
        if(this.childrenRefs.length == 0 && !(to == this.ownType.tagVal)){
            this.termination.nodeTerminated()
        }
    }

    //////////////////////////////////////////
    // Calls made by dist glitch prevention //
    //////////////////////////////////////////

    //No change can only be called for non-source nodes
    propagateNoChange(){
        let pulse
        if(this.parentTypes.length == 0){
            pulse = new this.NodePulse(this.ownPulse,[this.ownType.tagVal],this.lastVal)
        }
        else{
            pulse = new this.NodePulse(this.ownPulse,this.lastTriggerPulse.sourcesChanged,this.lastVal)
        }
        this.ownPulse.setUnchanged()
        this.childrenRefs.forEach((childRef : FarRef<SIDUPActor>)=>{
            this.termination.newChildMessage()
            childRef.newPulse(this.ownType,this,pulse)
        })
        this.reset()
    }

    propagateChange(signal : Signal){
        let propagateToChildren = (isDistSource,newVal = signal) => {
            let newPulse
            if(isDistSource){
                this.lastVal        = this.libs.clone(signal) as Signal
                this.ownPulse.setChanged()
                newPulse            = new this.NodePulse(this.ownPulse,[this.ownType.tagVal],newVal)
            }
            else{
                this.lastVal        = this.libs.clone(signal) as Signal
                this.ownPulse.setChanged()
                newPulse            = new this.NodePulse(this.ownPulse,this.lastTriggerPulse.sourcesChanged,newVal)
            }
            this.childrenRefs.forEach((childRef : FarRef<SIDUPActor>)=>{
                this.termination.newChildMessage()
                childRef.newPulse(this.ownType,this,newPulse)
            })
        }
        //Check whether this node is at the start of the distributed dependency graph
        //In which case it first needs to ask "permission" to propagate from the admitter
        if(this.parentTypes.length == 0){
            let askAdmitter = () => {
                this.admitterRef.sourceChanged(signal).then((ret)=>{
                    //This code is only triggered after accept from admitter
                    this.termination.newParentMessage(this.admitterRef)
                    if(ret == "ok"){
                        propagateToChildren(true)

                    }
                    else{
                        propagateToChildren(true,ret)
                    }
                })
            }
            this.sendToAdmitter(askAdmitter)
        }
        else{
            propagateToChildren(false)
        }
    }

    internalSignalChanged(signal : Signal){
        if(signal.id == this.publishedSignalId){
            if(this.lastVal){
                if(signal.equals(this.lastVal)){
                    this.propagateNoChange()
                }
                else{
                    this.propagateChange(signal)
                }
            }
            else{
                this.propagateChange(signal)
            }
        }
    }

    //Used for debugging purposes
    debug(){
        console.log("<!!!> Info for: " + this.ownType.tagVal + " <!!!>")
        console.log("Reachable by: " + this.reachables)
        console.log("Parents: " + this.parentTypes.map((type)=>{return type.tagVal}))
        console.log("Children: " + this.childrenTypes.map((type)=>{return type.tagVal}))
    }
}