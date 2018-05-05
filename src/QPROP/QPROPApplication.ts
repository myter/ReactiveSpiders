import {ReactiveActor} from "../ReactiveActor";
import {Actor, Application, FarRef, PSClient, PubSubTag, SpiderActorMirror, SpiderIsolate} from "spiders.js";
import {DistGlitchPrevention} from "../DistGlitchPrevention";
import {_REMOTE_CHANGE_, ReactiveMirror} from "../ReactiveMirror";
import {DerivedSignal, Signal} from "../Signal";
import {PropagationValue} from "./PropagationValue";
import {GlitchAlgorithm} from "../GlitchAlgorithm";

class LocalDependencyGraph extends SpiderIsolate{
    nodes           : Map<string,Signal>
    sources         : Array<string>
    dependencies    : Map<string,Array<string>>
    parents         : Map<string,Array<string>>

    constructor(){
        super()
        this.nodes          = new Map()
        this.sources        = []
        this.dependencies   = new Map()
        this.parents        = new Map()
    }

    newSource(source : Signal){
        this.sources.push(source.id)
        this.nodes.set(source.id,source)
        this.dependencies.set(source.id,[])
        this.parents.set(source.id,[])
    }

    updateSource(source : Signal){
        this.nodes.set(source.id,source)
    }

    updateSources(sources : Array<Signal>){
        sources.forEach(this.updateSource.bind(this))
    }

    newNode(node : DerivedSignal){
        this.nodes.set(node.id,node)
        this.dependencies.set(node.id,[])
        this.parents.set(node.id,[])
    }

    addDependency(fromId : string,toId : string){
        this.dependencies.get(toId).push(fromId)
        this.parents.get(fromId).push(toId)
    }

    getDependants(forId : string) : Array<Signal>{
        if(!this.dependencies.has(forId)){
            return []
        }
        else{
            return this.dependencies.get(forId).map((depId : string)=>{
                return this.nodes.get(depId)
            })

        }
    }

    getParents(forId : string) : Array<Signal>{
        return this.parents.get(forId).map((pId : string)=>{
            return this.nodes.get(pId)
        })
    }
}

export class QPROPApplication{
    //Spiders.js related
    thisDir
    PropagationValue            : {new(from : PubSubTag,value : Signal,sClocks : Map<string,number>,fClock : number,isOptimised? : boolean): PropagationValue}
    //General node Info
    ownType                     : PubSubTag
    parentTypes                 : Array<PubSubTag>
    childTypes                  : Array<PubSubTag>
    parentRefs                  : Array<FarRef<QPROPApplication>>
    childRefs                   : Array<FarRef<QPROPApplication>>
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
    inChange                    : boolean
    changeDoneListeners         : Array<Function>
    brittle                     : Map<string,Array<PropagationValue>>
    //Pub-Sub
    psClient                    : PSClient
    serverAddress               : string
    serverPort                  : number
    allChildListeners           : Array<Function>
    allParentListeners          : Array<Function>
    publishedSignalId           : string
    host                        : Application

    constructor(host,ownType : PubSubTag,parentTypes : Array<PubSubTag>,childTypes : Array<PubSubTag>,myAddress,myPort,psServerAddress = "127.0.0.1",psServerPort = 8000){
        this.host               = host
        this.thisDir            = __dirname
        this.ownType            = ownType
        this.parentTypes        = parentTypes
        this.childTypes         = childTypes
        this.serverAddress      = psServerAddress
        this.serverPort         = psServerPort
        this.PropagationValue   = PropagationValue
        this.localGraph           = new LocalDependencyGraph()
        this.DerivedSignal        = DerivedSignal
        this._REMOTE_CHANGE_      = _REMOTE_CHANGE_
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
        this.inputSignals           = new Map()
        this.ready                  = false
        this.readyListeners         = []
        this.inChange               = false
        this.changeDoneListeners    = []
        this.brittle                = new Map()
        this.psClient               = this.host.libs.setupPSClient(this.serverAddress,this.serverPort)
        this.lastProp               = new this.PropagationValue(this.ownType,null,new Map(),this.clock)
        if(this.amSource()){
            this.lastProp.value = this.invokeStart()
        }
        this.childTypes.forEach((childType : PubSubTag)=>{
            this.psClient.subscribe(childType).each((childRef : FarRef<QPROPApplication>)=>{
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
            this.psClient.subscribe(parentType).each((parentRef : FarRef<QPROPApplication>)=>{
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

    fromPropValArray(propValArr){
        return new this.PropagationValue(new this.host.libs.PubSubTag(propValArr[0]),propValArr[1],new Map(JSON.parse(propValArr[2])),propValArr[3],propValArr[4])
    }

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
        let returnSig = (this.host as any).start(...args)
        this.publishedSignalId = returnSig.id
        return returnSig
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

    addToI(parent : string,prop : PropagationValue | Array<PropagationValue>){
        if(this.I.has(parent)){
            let prevProps = this.I.get(parent)
            this.I.set(parent,prevProps.concat(prop))
        }
        else{
            this.I.set(parent,[prop as PropagationValue])
        }
    }

    ////////////////////////////////////////
    // Calls made by other QPROP nodes    //
    ////////////////////////////////////////

    getSources(sources : Array<PubSubTag>,initProp : PropagationValue){
        let fromParent          = initProp.from
        this.I.set(fromParent.tagVal,[initProp])
        this.sourcesReceived    += 1
        this.inputSignals.set(fromParent.tagVal,initProp.value);
        this.newSource(initProp.value)
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
                let tag = new this.host.libs.PubSubTag(source)
                allSources.push(tag)
                sourceClocks.set(source,0)
            })
            this.lastProp.value                         = this.invokeStart()
            this.lastProp.sClocks                       = sourceClocks
            if(this.amSink()){
                let send = ()=>{
                    this.parentRefs.forEach((ref : FarRef<QPROPApplication>)=>{
                        ref.getStart()
                    })
                }
                this.sendToAllParents(send)
                this.ready = true
                this.flushReady()
            }
            else{
                let send = ()=>{
                    this.childRefs.forEach((ref : FarRef<QPROPApplication>)=>{
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
                this.parentRefs.forEach((ref : FarRef<QPROPApplication>)=>{
                    ref.getStart()
                })
            }
            this.sendToAllParents(send)
            this.ready = true
            this.flushReady()
        }
    }

    prePropagation(propArr : Array<any>){
        let prop        = this.fromPropValArray(propArr)
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
        this.brittle.forEach((brittleProps : Array<PropagationValue>,br : string)=>{
            let sources = this.getSourcesFor(br)
            sources.forEach((source : string)=>{
                let preds = this.S.get(source)
                let check = preds.filter((pred : PubSubTag)=>{
                    if(pred.tagVal == br){
                        return false
                    }
                    else{
                        let predFirst   = this.I.get(pred.tagVal)[0]
                        let brFirst     = this.brittle.get(br)[0]
                        return  (predFirst.sClocks.get(source) - brFirst.sClocks.get(source)) > 1
                    }
                })
                if(check.length == 0){
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
        })
    }

    newPropagation(prop : PropagationValue){
        let from        = prop.from.tagVal
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
            let values      = match.map((arg : PropagationValue)=>{
                if(arg.isOptimised){
                    let sig = this.inputSignals.get(arg.from.tagVal);
                    (sig as any).setState(arg.value);
                    return sig
                }
                else{
                    return arg.value
                }
            });
            this.sourcesChanged(values)
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
                    this.childRefs.forEach((child : FarRef<QPROPApplication>)=>{
                        child.prePropagation(this.lastProp.toArray())
                    })
                })
            }
            else{
                let sigClone = this.host.libs.clone(signal)
                this.readyListeners.push(()=>{
                    this.internalSignalChanged(sigClone as any)
                })
            }
        }
    }

    ////////////////////////////////////////
    // QPROPD API                         //
    ////////////////////////////////////////

    newChild(childType : PubSubTag,childRef : FarRef<QPROPApplication>) : Promise<Array<any>>{
        this.childTypes.push(childType)
        this.childRefs.push(childRef)
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
            this.psClient.subscribe(toParent).once((newParentRef : FarRef<QPROPApplication>)=>{
                newParentRef.newChild(this.ownType,this).then(([lastProp,sources])=>{
                    let knownSources = sources.filter((source : string)=>{return this.S.has(source)})
                    if(knownSources.length == 0){
                        this.addToI(toParent.tagVal,lastProp)
                    }
                    this.addSources(toParent,sources).then(()=>{
                        this.parentTypes.push(toParent)
                        this.parentRefs.push(newParentRef)
                        this.I.set(toParent.tagVal,[])
                        this.inputSignals.forEach((iSignal)=>{
                            let deps = this.localGraph.getDependants(iSignal.id)
                            deps.forEach((dependant : Signal)=>{
                                this.localGraph.newSource(lastProp.value);
                                this.localGraph.addDependency(dependant.id,lastProp.value.id)
                            })
                        })
                        this.inputSignals.set(toParent.tagVal,lastProp.value)
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
        let childPromises = this.childRefs.map((child : FarRef<QPROPApplication>)=>{return child.addSources(this.ownType,sources)})
        return Promise.all(childPromises)
    }



    //TODO TEMP STUFF FOR OPTI

    localGraph              : LocalDependencyGraph
    DerivedSignal
    _REMOTE_CHANGE_         : string

    /////////////////////////////////////////////////////////
    // Local Reactivity                                    //
    /////////////////////////////////////////////////////////

    lift(f){
        return (... args)=>{
            let returnSig = new this.DerivedSignal(f,this)
            this.localGraph.newNode(returnSig)
            args.forEach((arg,index)=>{
                if(arg.isSignal){
                    this.localGraph.addDependency(returnSig.id,arg.id)
                }
                else{
                    //TODO
                }
            })
            return returnSig
        }
    }

    liftApp(f,sig){
        return this.lift(f)(sig)
    }

    private containsSignal(args : Array<any>) : Array<Signal>{
        return args.filter((arg,i)=>{
            //Need to explicitly return true or false in filter (i.e. undefined not considered as false)
            //Also, checking for == true, am I stupid ? Yes and no, could be that arg is a far ref in which case arg.isSignal returns a promise which apparently is true-ish ?
            if(arg){
                if(arg.isSignal == true){
                    return true
                }
                else{
                    return false
                }
            }
            else{
                return false
            }
        })
    }

    private updateNode(node : DerivedSignal){
        let parentValues = this.localGraph.getParents(node.id).map((parent : Signal)=>{
            if(parent.isDerived){
                return (parent as DerivedSignal).lastVal
            }
            else{
                return parent
            }
        })
        node.update(parentValues)
        this.internalSignalChanged(node)
        this.localGraph.getDependants(node.id).forEach((dep : Signal)=>{
            this.updateNode(dep as DerivedSignal)
        })
    }

    newSource(signal : Signal){
        this.localGraph.newSource(signal)
    }

    sourceChanged(source : Signal){
        this.localGraph.updateSource(source)
        this.internalSignalChanged(source)
        this.localGraph.getDependants(source.id).forEach((dep : Signal)=>{
            this.updateNode(dep as DerivedSignal)
        })
    }

    sourcesChanged(sources : Array<Signal>){
        this.localGraph.updateSources(sources)
        sources.forEach(this.internalSignalChanged.bind(this))
        let depIds  = []
        let deps    = []
        sources.forEach((source)=>{
            let toAdd = this.localGraph.getDependants(source.id)
            toAdd.forEach((dep : Signal)=>{
                if(!((depIds as any).includes(dep.id))){
                    deps.push(dep)
                    depIds.push(dep.id)
                }
            })
        })
        deps.forEach((dep)=>{
            this.updateNode(dep as DerivedSignal)
        })
    }
}
