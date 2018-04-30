import {ReactiveActor} from "../ReactiveActor";
import {FarRef, PSClient, PubSubTag, SpiderIsolate} from "spiders.js";
import {DistGlitchPrevention} from "../DistGlitchPrevention";
import {ReactiveMirror} from "../ReactiveMirror";
import {DerivedSignal, Signal} from "../Signal";
import {PropagationValue} from "./PropagationValue";

export class QPROP extends SpiderIsolate implements DistGlitchPrevention{
    actorMirror : ReactiveMirror

    setMirror(actorMirror: ReactiveMirror) {
        this.actorMirror = actorMirror
    }

    registerSourceSignal(signal: Signal) {}

    registerDerivedSignal(signal: DerivedSignal) {}

    localSignalChanged(signal: Signal) {
        (this.actorMirror.base.behaviourObject as any).internalSignalChanged(signal)
    }

    remoteSignalChanged(signal: Signal) {}

    signalSent(signal: Signal, target: FarRef<any>) {}

    signalReceived(signal: Signal, from: FarRef<any>) {}

}

export class QPROPActor extends ReactiveActor{
    //Spiders.js related
    thisDir
    PropagationValue            : {new(from : PubSubTag,value : Signal,sClocks : Map<string,number>,fClock : number): PropagationValue}
    //General node Info
    ownType                     : PubSubTag
    parentTypes                 : Array<PubSubTag>
    childTypes                  : Array<PubSubTag>
    parentRefs                  : Array<FarRef<QPROPActor>>
    childRefs                   : Array<FarRef<QPROPActor>>
    sourcesReceived             : number
    startsReceived              : number
    lastProp                    : PropagationValue
    lastMatch                   : Array<PropagationValue>
    clock                       : number
    I                           : Map<string,Array<PropagationValue>>
    S                           : Map<string,Array<PubSubTag>>
    inputSignals                : Map<string,Signal>
    ready                       : boolean
    readyListeners              : Array<Function>
    //Pub-Sub
    psClient                    : PSClient
    serverAddress               : string
    serverPort                  : number
    allChildListeners           : Array<Function>
    allParentListeners          : Array<Function>
    publishedSignalId           : string

    constructor(ownType : PubSubTag,parentTypes : Array<PubSubTag>,childTypes : Array<PubSubTag>,psServerAddress = "127.0.0.1",psServerPort = 8000){
        super(new ReactiveMirror(new QPROP()))
        this.thisDir            = __dirname
        this.ownType            = ownType
        this.parentTypes        = parentTypes
        this.childTypes         = childTypes
        this.serverAddress      = psServerAddress
        this.serverPort         = psServerPort
    }

    init(){
        (Array.prototype as any).flatMap = function(lambda) {
            return Array.prototype.concat.apply([], this.map(lambda));
        };
        this.PropagationValue   = require(this.thisDir+"/PropagationValue").PropagationValue
        this.childRefs          = []
        this.parentRefs         = []
        this.sourcesReceived    = 0
        this.startsReceived     = 0
        this.clock              = 0
        this.allChildListeners  = []
        this.allParentListeners = []
        this.I                  = new Map()
        this.S                  = new Map()
        this.inputSignals       = new Map()
        this.ready              = false
        this.readyListeners     = []
        this.psClient           = this.libs.setupPSClient(this.serverAddress,this.serverPort)
        this.lastProp           = new this.PropagationValue(this.ownType,null,new Map(),this.clock)
        if(this.amSource()){
            this.lastProp.value = this.invokeStart()
        }
        this.childTypes.forEach((childType : PubSubTag)=>{
            this.psClient.subscribe(childType).once((childRef : FarRef<QPROPActor>)=>{
                this.childRefs.push(childRef)
                if(this.amSource()){
                    this.lastProp.sClocks.set(this.ownType.tagVal,this.clock)
                    childRef.getSources([this.ownType],this.lastProp)
                }
                if(this.gotAllChildren()){
                    this.flushChildMessages()
                }
            })
        })
        this.parentTypes.forEach((parentType : PubSubTag)=>{
            this.psClient.subscribe(parentType).once((parentRef : FarRef<QPROPActor>)=>{
                this.parentRefs.push(parentRef)
                if(this.gotAllParents()){
                    this.flushParentMessages()
                }
            })
        })
        this.psClient.publish(this,this.ownType)
    }

    ////////////////////////////////////////
    // Helper Functions                   //
    ////////////////////////////////////////

    amSource(){
        return this.parentTypes.length == 0
    }

    amSink(){
        return this.childTypes.length == 0
    }

    gotAllSources(){
        return this.sourcesReceived == this.parentTypes.length
    }

    gotAllStarts(){
        return this.startsReceived == this.childTypes.length
    }

    gotAllChildren(){
        return this.childRefs.length == this.childTypes.length
    }

    gotAllParents(){
        return this.parentRefs.length == this.parentTypes.length
    }

    sendToAllChildren(sendFunc : Function){
        if(this.gotAllChildren()){
            sendFunc()
        }
        else{
            this.allChildListeners.push(sendFunc)
        }
    }

    flushChildMessages(){
        this.allChildListeners.forEach((sendFunc)=>{
            sendFunc()
        })
    }

    sendToAllParents(sendFunc : Function){
        if(this.gotAllParents()){
            sendFunc()
        }
        else{
            this.allParentListeners.push(sendFunc)
        }
    }

    flushParentMessages(){
        this.allParentListeners.forEach((sendFunc)=>{
            sendFunc()
        })
    }

    invokeStart(){
        let args = []
        //Make sure args are provided in the same order as the parents are specified
        this.parentTypes.forEach((parentType : PubSubTag,index : number)=>{
            args[index] = this.inputSignals.get(parentType.tagVal)
        });
        let returnSig = (this as any).start(...args)
        this.publishedSignalId = returnSig.id
        return returnSig
    }

    flushReady(){
        this.readyListeners.forEach((readyList)=>{
            readyList()
        })
    }

    //xs >>= k = join $ fmap k xs
    //xs :: [a]k  ::  a->[b]

    // oneOf :: M a -> a -> M b -> M b
    oneOf(xs,k) {
        return xs.flatMap(k);
    }

    guard( x ) {
        if(x) {
            return [null];
        } else {
            return [];
        }
    }

    getAllArgs(tables){
        let loop = (index,args)=>{
            if(index < tables.length){
                return this.oneOf(tables[index],(arg)=>{
                    return loop(index+1,args.concat(arg))
                })
            }
            else{
                return [args]
            }
        }
        return loop(0,[])
    }

    getCommonSources(parentType1 : PubSubTag,parentType2 : PubSubTag) : Array<string>{
        let ret = []
        this.S.forEach((parents : Array<PubSubTag>,source : string)=>{
            let p : any= parents.map((parent)=>{return parent.tagVal})
            if(p.includes(parentType1.tagVal) && p.includes(parentType2.tagVal)){
                ret.push(source)
            }
        })
        return ret
    }

    getMatchArgs(allArgs : Array<Array<PropagationValue>>){
        return this.oneOf(allArgs,(args : Array<PropagationValue>)=>{
            let okSourceClock = true
            this.oneOf(args,(argDP1 : PropagationValue)=>{
                this.oneOf(args,(argDP2 : PropagationValue)=>{
                    this.oneOf(this.guard(!(argDP1.from.equals(argDP2.from))),()=>{
                        let common = this.getCommonSources(argDP1.from,argDP2.from)
                        common.forEach((commonSource : string)=>{
                            okSourceClock = okSourceClock && (argDP1.sClocks.get(commonSource) == argDP2.sClocks.get(commonSource))
                        })
                    })
                })
            })
            return this.oneOf(this.guard(okSourceClock),()=>{
                return [args]
            })
        })
    }


    ////////////////////////////////////////
    // Calls made by other QPROP nodes    //
    ////////////////////////////////////////

    getSources(sources : Array<PubSubTag>,initProp : PropagationValue){
        let fromParent          = initProp.from
        this.I.set(fromParent.tagVal,[initProp])
        this.sourcesReceived    += 1
        this.inputSignals.set(fromParent.tagVal,initProp.value);
        (this.libs.reflectOnActor() as ReactiveMirror).newSource(initProp.value)
        sources.forEach((source : PubSubTag)=>{
            if(this.S.has(source.tagVal)){
                this.S.get(source.tagVal).push(fromParent)
            }
            else{
                this.S.set(source.tagVal,[fromParent])
            }
        })
        if(this.gotAllSources()){
            let allSources      : Array<PubSubTag>      = []
            let sourceClocks    : Map<string,number>    = new Map()
            this.S.forEach((_,source : string)=>{
                let tag = new this.libs.PubSubTag(source)
                allSources.push(tag)
                sourceClocks.set(source,0)
            })
            this.lastProp.value                         = this.invokeStart()
            this.lastProp.sClocks                       = sourceClocks
            if(this.amSink()){
                let send = ()=>{
                    this.parentRefs.forEach((ref : FarRef<QPROPActor>)=>{
                        ref.getStart()
                    })
                }
                this.sendToAllParents(send)
                this.ready = true
                this.flushReady()
            }
            else{
                let send = ()=>{
                    this.childRefs.forEach((ref : FarRef<QPROPActor>)=>{
                        ref.getSources(allSources,this.lastProp)
                    })
                }
                this.sendToAllChildren(send)
            }
        }
    }

    getStart(){
        this.startsReceived += 1
        if(this.gotAllStarts()){
            let send = ()=>{
                this.parentRefs.forEach((ref : FarRef<QPROPActor>)=>{
                    ref.getStart()
                })
            }
            this.sendToAllParents(send)
            this.ready = true
            this.flushReady()
        }
    }

    newPropagation(prop : PropagationValue){
        let from        = prop.from.tagVal
        let prevProps   = this.I.get(from)
        this.I.set(from,prevProps.concat(prop))
        let is          = []
        this.I.forEach((vals : Array<PropagationValue>,parent : string)=>{
            if(parent != from){
                is.push(vals)
            }
        })
        is.push([prop])
        //Find cross product of new propagation value and all other values
        let allArgs     = this.getAllArgs(is)
        let matches     = this.getMatchArgs(allArgs)
        matches.forEach((match : Array<PropagationValue>)=>{
            this.lastMatch  = match;
            let values      = match.map((arg : PropagationValue)=>{return arg.value});
            (this.libs.reflectOnActor() as ReactiveMirror).sourcesChanged(values)
        })
        if(this.lastMatch){
            this.lastMatch.forEach((pv : PropagationValue)=>{
                let vals = this.I.get(pv.from.tagVal)
                vals = vals.filter((pvv : PropagationValue)=>{return pvv.fClock >= pv.fClock})
                this.I.set(pv.from.tagVal,vals)
            })
        }
    }

    //////////////////////////////////////////
    // Calls made by dist glitch prevention //
    //////////////////////////////////////////


    //Internal propagation starts in "newPropagation", the reactive mirror catches the end of the internal propagation and invokes this method which will ensure that distributed propagation continues
    internalSignalChanged(signal : Signal){
        if(signal.id == this.publishedSignalId){
            if(this.ready){
                this.clock++
                let clocks      = new Map()
                if(this.amSource()){
                    clocks.set(this.ownType.tagVal,this.clock)
                }
                else{
                    this.lastMatch.forEach((pv : PropagationValue)=>{
                        pv.sClocks.forEach((clockVal,source)=>{
                            clocks.set(source,clockVal)
                        })
                    })
                }
                this.lastProp   = new this.PropagationValue(this.ownType,signal,clocks,this.clock)
                this.sendToAllChildren(()=>{
                    this.childRefs.forEach((child : FarRef<QPROPActor>)=>{
                        child.newPropagation(this.lastProp)
                    })
                })
            }
            else{
                let sigClone = this.libs.clone(signal)
                this.readyListeners.push(()=>{
                    this.internalSignalChanged(sigClone as any)
                })
            }
        }
    }

}