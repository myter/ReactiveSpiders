import {Actor, FarRef, PSClient, PubSubTag} from "spiders.js";
import {DijkstraScholten} from "./DijkstraScholten";
import {DependencyChangePulse} from "./DependencyChangePulse";
import {SIDUPActor} from "./SIDUPActor";

export class SIDUPAdmitter extends Actor{
    Dijkstra
    DependencyChangePulse
    ownType         : PubSubTag
    termination     : DijkstraScholten
    waitingChanges  : Array<Function>
    sinks           : number
    sources         : number
    sourceRefs      : Array<FarRef<SIDUPActor>>
    sinksReady      : number
    sinksStarted    : number
    readyResolvers  : Array<Function>
    sourceResolvers : Array<Function>
    idleListener    : Function
    changeListener  : Function
    admitListener   : Function
    psServerAdd     : string
    psServerPort    : number
    psClient        : PSClient

    constructor(ownType : PubSubTag,sources: number,sinks : number,psServerAddress : string = "127.0.0.1",psServerPort : number = 8000){
        super()
        this.ownType                = ownType
        this.Dijkstra               = DijkstraScholten
        this.DependencyChangePulse  = DependencyChangePulse
        this.waitingChanges         = []
        this.sinks                  = sinks
        this.sources                = sources
        this.sourceRefs             = []
        this.sinksReady             = 0
        this.sinksStarted           = 0
        this.readyResolvers         = []
        this.sourceResolvers        = []
        this.psServerAdd            = psServerAddress
        this.psServerPort           = psServerPort
    }

    init(){
        this.termination    = new this.Dijkstra(()=>{this.returnedToIdle()})
        this.psClient       = this.libs.setupPSClient(this.psServerAdd,this.psServerPort)
        this.psClient.publish(this,this.ownType)
        this.idleListener   = () => {}
        this.changeListener = () => {}
        this.admitListener  = () => {}
    }

    returnedToIdle(){
        this.idleListener()
        if(this.waitingChanges.length > 0){
            let toResolve = this.waitingChanges[0]
            this.waitingChanges = this.waitingChanges.slice(1,this.waitingChanges.length)
            toResolve("ok")
            this.termination.newChildMessage()
        }

    }

    sourceChanged(withValue){
        this.admitListener()
        if(this.termination.isIdle() && this.sinksStarted == this.sinks){
            this.termination.newChildMessage()
            if(this.changeListener){
                return this.changeListener(withValue)
            }
            else{
                return "ok"
            }
        }
        else{
            return new Promise((resolve)=>{
                let f = ()=>{
                    if(this.changeListener){
                        resolve(this.changeListener(withValue))
                    }
                    else{
                        resolve("ok")
                    }
                }
                this.waitingChanges.push(f)
            })
        }
    }

    ack(){
        this.termination.newAckMessage()
    }

    sinkReady(){
        this.sinksReady++
        if(this.sinksReady == this.sinks){
            console.log("graph has been constructed")
            this.readyResolvers.forEach((resolver)=>{
                resolver("ok")
            })
            this.readyResolvers = []
        }
    }

    sinkStarted(){
        this.sinksStarted++
        if(this.sinksStarted == this.sinks){
            console.log("Graph started")
            //There might already be changes buffered
            this.returnedToIdle()
        }
    }

    sourceRegister(sourceRef : FarRef<SIDUPActor>){
        this.sourceRefs.push(sourceRef)
        if(this.sourceRefs.length == this.sources){
            this.sourceResolvers.forEach((resolver : Function)=>{
                resolver()
            })
        }
    }

    graphReady(){
        if(this.sinksReady == this.sinks){
            return "ok"
        }
        else{
            return new Promise((resolve)=>{
                this.readyResolvers.push(resolve)
            })
        }
    }

    addDependency(fromType : PubSubTag,toType : PubSubTag){
        let initiateChange = () => {
            this.sourceRefs.forEach((sourceRef : FarRef<SIDUPActor>)=>{
                this.termination.newChildMessage()
                sourceRef.addDependency(this as any,new this.DependencyChangePulse(fromType,toType))
            })
        }
        if(this.termination.isIdle() && this.sinksStarted == this.sinks){
            initiateChange()
        }
        else{
            this.waitingChanges.push(initiateChange)
        }
    }
}