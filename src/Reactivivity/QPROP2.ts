import {DPropAlgorithm} from "./DPropAlgorithm";
import {mutator, Signal, SignalFunction, SignalObject} from "./signal";
import {SignalPool} from "./signalPool";
import {IsolateContainer} from "../serialisation";
import {PubSubTag} from "../PubSub/SubTag";
import {FarRef} from "../spiders";
import {PropagationValue} from "./QPROP";

class SourceIsolate{
    sources

    constructor(sources){
        this[IsolateContainer.checkIsolateFuncKey] = true
        this.sources = sources
    }
}

export class QPROPSourceSignal extends SignalObject{
    parentVals

    @mutator
    change(parentVals){
        this.parentVals = parentVals
    }
}

export class PropagationValue2{
    from        : PubSubTag
    value       : Signal
    sClocks     : Map<string,number>
    fClock      : number

    constructor(from,value,sClocks,fClock){
        this[IsolateContainer.checkIsolateFuncKey] = true
        this.from           = from
        this.value          = value
        this.sClocks        = sClocks
        this.fClock         = fClock
    }

    asString(){
        return "< " + this.from.tagVal + " , " + JSON.stringify([...this.sClocks]) + " , " + this.fClock + " >"
    }

    serMap(){
        this.sClocks = JSON.stringify([...this.sClocks]) as any
    }

    deSerMap(){
        this.sClocks = new Map(JSON.parse(this.sClocks as any))
    }

}

export class DependencyChange{
    fromType    : PubSubTag
    toType      : PubSubTag

    constructor(fromType : PubSubTag,toType : PubSubTag){
        this[IsolateContainer.checkIsolateFuncKey] = true
        this.fromType   = fromType
        this.toType     = toType
    }
}

export class QPROP2Node implements DPropAlgorithm{
    signalPool                  : SignalPool
    ownType                     : PubSubTag
    parentTypes                 : Array<PubSubTag>
    childTypes                  : Array<PubSubTag>
    parentRefs                  : Array<FarRef>
    childRefs                   : Array<FarRef>
    sourcesReceived             : number
    startsReceived              : number
    lastProp                    : PropagationValue2
    lastMatch                   : Array<PropagationValue2>
    clock                       : number
    I                           : Map<string,Array<PropagationValue2>>
    S                           : Map<string,Array<PubSubTag>>
    ready                       : boolean
    readyListeners              : Array<Function>
    inChange                    : boolean
    changeDoneListeners         : Array<Function>
    brittle                     : Map<string,Array<PropagationValue2>>
    //Pub-Sub
    allChildListeners           : Array<Function>
    allParentListeners          : Array<Function>
    publishedSignalId           : string
    hostActor
    dependencyChangeTag
    ownSignal
    publishedSignal

    constructor(ownType : PubSubTag,parentTypes : Array<PubSubTag>,childTypes : Array<PubSubTag>,hostActor,dependencyChangeTag){
        this.hostActor          = hostActor
        this.ownType            = ownType
        this.parentTypes        = parentTypes
        this.childTypes         = childTypes
        this.ownSignal          = new QPROPSourceSignal()
        this.dependencyChangeTag = dependencyChangeTag
        this.init()
    }

    init(){
        (Array.prototype as any).flatMap = function(lambda) {
            return Array.prototype.concat.apply([], this.map(lambda));
        };
        this.childRefs              = []
        this.parentRefs             = []
        this.sourcesReceived        = 0
        this.startsReceived         = 0
        this.clock                  = 0
        this.allChildListeners      = []
        this.allParentListeners     = []
        this.I                      = new Map()
        this.S                      = new Map()
        this.ready                  = false
        this.readyListeners         = []
        this.inChange               = false
        this.changeDoneListeners    = []
        this.brittle                = new Map()
        this.lastProp               = new PropagationValue2(this.ownType,null,new Map(),this.clock)
        if(this.amSource()){
            //this.lastProp.value = this.invokeStart()
            this.lastProp.sClocks.set(this.ownType.tagVal,this.clock)
        }
        this.childTypes.forEach((childType : PubSubTag)=>{
            this.hostActor.subscribe(childType).once((childRef : FarRef)=>{
                this.childRefs.push(childRef)
                if(this.amSource() && this.gotAllChildren()){
                    this.childRefs.forEach((ref)=>{
                        ref.getSources([this.ownType],this.lastProp)
                    })
                }
                if(this.gotAllChildren()){
                    this.flushChildMessages()
                }
            })
        })
        this.parentTypes.forEach((parentType : PubSubTag)=>{
            this.hostActor.subscribe(parentType).once((parentRef : FarRef)=>{
                this.parentRefs.push(parentRef)
                if(this.gotAllParents()){
                    this.flushParentMessages()
                }
            })
        })
        this.hostActor.publish(this,this.ownType)
        this.hostActor.subscribe(this.dependencyChangeTag).each((change : DependencyChange)=>{
            //console.log("Dependency addition detected")
            if(change.toType.tagVal == this.ownType.tagVal && !this.contains(this.parentTypes,change.fromType)){
                this.addDependency(change.fromType)
            }
        })
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

    flushReady(){
        this.readyListeners.forEach((readyList)=>{
            readyList()
        })
    }

    nextChange(){
        if(this.changeDoneListeners.length > 0){
            let perform = this.changeDoneListeners.splice(0,1)[0]
            perform()
        }
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

    getSourcesFor(parentType : string){
        let ret = []
        this.S.forEach((parents : Array<PubSubTag>,source : string)=>{
            let p : any = parents.map((parent)=>{return parent.tagVal})
            if(p.includes(parentType)){
                ret.push(source)
            }
        })
        return ret
    }

    getMatchArgs(allArgs : Array<Array<PropagationValue2>>){
        return this.oneOf(allArgs,(args : Array<PropagationValue2>)=>{
            let okSourceClock = true
            this.oneOf(args,(argDP1 : PropagationValue2)=>{
                this.oneOf(args,(argDP2 : PropagationValue2)=>{
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

    addToI(parent : string,prop : PropagationValue2 | Array<PropagationValue2>){
        if(this.I.has(parent)){
            let prevProps = this.I.get(parent)
            this.I.set(parent,prevProps.concat(prop))
        }
        else{
            this.I.set(parent,[prop as PropagationValue2])
        }
    }

    contains(typeArray : Array<PubSubTag>,targettype : PubSubTag){
        return typeArray.filter((type : PubSubTag)=>{
            return type.tagVal == targettype.tagVal
        }).length > 0
    }

    ////////////////////////////////////////
    // Calls made by other QPROP nodes    //
    ////////////////////////////////////////

    getSources(sources : Array<PubSubTag>,initProp : PropagationValue2){
        let fromParent          = initProp.from
        this.I.set(fromParent.tagVal,[initProp])
        this.sourcesReceived    += 1
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
                let tag = this.hostActor.newPSTag(source)
                allSources.push(tag)
                sourceClocks.set(source,0)
            })
            this.lastProp.sClocks                       = sourceClocks
            if(this.amSink()){
                let send = ()=>{
                    this.parentRefs.forEach((ref : FarRef)=>{
                        ref.getStart()
                    })
                }
                this.sendToAllParents(send)
                this.ready = true
                this.flushReady()
            }
            else{
                let send = ()=>{
                    this.childRefs.forEach((ref : FarRef)=>{
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
            console.log(this.ownType.tagVal + " got all starts ! ")
            let send = ()=>{
                this.parentRefs.forEach((ref : FarRef)=>{
                    ref.getStart()
                })
            }
            this.sendToAllParents(send)
            this.ready = true
            this.flushReady()
        }
    }

    prePropagation(prop : PropagationValue2){
        prop.deSerMap()
        if(!this.inChange){
            let from        = prop.from.tagVal
            if(this.brittle.size == 0){
                this.addToI(from,prop)
                return this.newPropagation(prop)
            }
            else if(this.brittle.has(from)){
                let prevProps = this.brittle.get(from)
                this.brittle.set(from,prevProps.concat(prop))
            }
            else{
                this.addToI(from,prop)
                let sources = this.getSourcesFor(from)
                let cont    = true
                sources.forEach((source : string)=>{
                    let parents         = this.S.get(source)
                    let brittleCousins  = parents.filter((parent : PubSubTag)=>{return this.brittle.has(parent.tagVal)})
                    brittleCousins.forEach((br : PubSubTag)=>{
                        cont = cont && (this.brittle.get(br.tagVal).length == 0)
                    })
                })
                if(cont){
                    return this.newPropagation(prop)
                }
            }
            this.brittle.forEach((brittleProps : Array<PropagationValue2>,br : string)=>{
                let sources = this.getSourcesFor(br)
                let ok      = true
                sources.forEach((source : string)=>{
                    let preds = this.S.get(source)
                    let check = preds.filter((pred : PubSubTag)=>{
                        if(pred.tagVal == br){
                            return false
                        }
                        else{
                            if(this.brittle.has(br)){
                                if(this.brittle.get(br).length > 0){
                                    let predFirst   = this.I.get(pred.tagVal)[0]
                                    let brFirst     = this.brittle.get(br)[0]
                                    return  (predFirst.sClocks.get(source) - brFirst.sClocks.get(source)) > 1
                                }
                                else{
                                    return false
                                }
                            }
                            else{
                                return false
                            }
                        }
                    })
                    ok = ok && check.length == 0
                })
                if(ok){
                    if(this.I.has(br)){
                        this.addToI(br,this.brittle.get(br))
                    }
                    else{
                        this.I.set(br,this.brittle.get(br))
                    }
                    this.brittle.delete(br)
                    return this.newPropagation(prop)
                }
            })
        }
        else{
            this.changeDoneListeners.push(()=>{
                this.prePropagation(prop)
            })
        }
    }

    newPropagation(prop : PropagationValue2){
        let from        = prop.from.tagVal
        let is          = []
        this.I.forEach((vals : Array<PropagationValue2>,parent : string)=>{
            if(parent != from){
                is.push(vals)
            }
        })
        is.push([prop])
        //Find cross product of new propagation value and all other values
        let allArgs     = this.getAllArgs(is)
        let matches     = this.getMatchArgs(allArgs)
        /*if(matches.length > 0){
            let match       = matches[matches.length-1]
            this.lastMatch  = match;
            let values      = match.map((arg : PropagationValue2)=>{
                return arg.value
            })
            //This will start propagation of local change. The exported signal will invoke the propagate method (which will send
            this.ownSignal.change(values)
        }*/
        matches.forEach((match)=>{
            this.lastMatch  = match;
            let values      = match.map((arg : PropagationValue2)=>{
                return arg.value
            })
            //This will start propagation of local change. The exported signal will invoke the propagate method (which will send
            this.ownSignal.change(values)
        })
        if(this.lastMatch){
            this.lastMatch.forEach((pv : PropagationValue2)=>{
                let vals = this.I.get(pv.from.tagVal)
                vals = vals.filter((pvv : PropagationValue2)=>{return pvv.fClock >= pv.fClock})
                this.I.set(pv.from.tagVal,vals)
            })
        }
    }

    getSignal(signal){
        //Dummy neeed to trigger underlying deserialisation of SpiderS.js
    }


    ////////////////////////////////////////
    // QPROPD API                         //
    ////////////////////////////////////////

    newChild(childType : PubSubTag,childRef : FarRef) : Promise<Array<any>>{
        this.childTypes.push(childType)
        this.childRefs.push(childRef)
        this.startsReceived++
        childRef.getSignal(this.publishedSignal)
        if(this.amSource()){
            return [this.lastProp,[this.ownType.tagVal]] as any
        }
        else{
            return [this.lastProp,Array.from(this.S.keys())] as any
        }
    }

    addDependency(toParent : PubSubTag){
        if(this.inChange){
            this.changeDoneListeners.push(()=>{
                this.addDependency(toParent)
            })
        }
        else{
            this.inChange = true
            this.hostActor.subscribe(toParent).once((newParentRef : FarRef)=>{
                newParentRef.newChild(this.ownType,this).then(([lastProp,sources])=>{
                    let knownSources = sources.filter((source : string)=>{return this.S.has(source)})
                    if(knownSources.length == 0){
                        this.addToI(toParent.tagVal,lastProp)
                    }
                    this.addSources(toParent,sources).then(()=>{
                        this.parentTypes.push(toParent)
                        this.parentRefs.push(newParentRef)
                        this.I.set(toParent.tagVal,[])
                        this.inChange = false
                        this.nextChange()
                    })
                })
            })
        }
    }

    addSources(from : PubSubTag,sources : Array<string>) : Promise<any>{
        sources.forEach((source : string)=>{
            if(this.S.has(source)){
                this.S.get(source).push(from)
                this.brittle.set(from.tagVal,[])
            }
            else{
                this.S.set(source,[from])
            }
        })
        let childPromises = this.childRefs.map((child : FarRef)=>{return child.addSources(this.ownType,sources)})
        return Promise.all(childPromises)
    }

    publishSignal(signal){
        let publish = () => {
            this.publishedSignal = signal
            this.childRefs.forEach((childRef : FarRef)=>{
                childRef.getSignal(signal)
            })
        }
        if(this.childRefs.length == this.childTypes.length){
            publish()
        }
        else{
            this.readyListeners.push(publish)
        }
        if(this.startsReceived != this.childTypes.length){
            signal.holder.onChangeListener = () => {
                this.propagate(signal.holder,[])
            }
        }
    }




    propagate(signal: Signal, toIds: Array<string>) {
        let newVal = signal.value
        if(newVal instanceof SignalFunction){
            newVal = newVal.lastVal
        }
        let sendToAll = ()=>{
            this.clock++
            let clocks      = new Map()
            if(this.parentTypes.length == 0){
                clocks.set(this.ownType.tagVal,this.clock)
                this.lastProp   = new PropagationValue2(this.ownType,newVal,clocks,this.clock)
                this.lastProp.serMap()
                this.childRefs.forEach((childRef : FarRef)=>{
                    childRef.prePropagation(this.lastProp)
                })
                this.lastProp.deSerMap()
            }
            else{
                this.lastMatch.forEach((pv : PropagationValue2)=>{
                    pv.sClocks.forEach((clockVal,source)=>{
                        clocks.set(source,clockVal)
                    })
                })
                this.lastProp   = new PropagationValue2(this.ownType,newVal,clocks,this.clock)
                this.lastProp.serMap()
                this.childRefs.forEach((childRef : FarRef)=>{
                    childRef.prePropagation(this.lastProp)
                })
                this.lastProp.deSerMap()
            }
        }
        if(this.startsReceived == this.childTypes.length){
            sendToAll()
        }
        else{
            this.readyListeners.push(sendToAll)
        }
    }

    propagationReceived(fromId: string, signalId: string, value: any) {
        //Not needed
    }

    setSignalPool(signalPool: SignalPool) {
        this.signalPool = signalPool
    }

}