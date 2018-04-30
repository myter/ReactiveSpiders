import {FarRef, SpiderActorMirror, SpiderIsolate} from "spiders.js";
import {DerivedSignal, Signal} from "./Signal";
import {DistGlitchPrevention} from "./DistGlitchPrevention";
export var _REMOTE_CHANGE_ = "_REMOTE_CHANGE_"

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

export class ReactiveMirror extends SpiderActorMirror{
    localGraph              : LocalDependencyGraph
    DerivedSignal
    distGlitchPrev          : DistGlitchPrevention
    _REMOTE_CHANGE_         : string

    constructor(distGlitchPreventer : DistGlitchPrevention){
        super()
        this.localGraph           = new LocalDependencyGraph()
        this.DerivedSignal        = DerivedSignal
        this.distGlitchPrev       = distGlitchPreventer
        this._REMOTE_CHANGE_      = _REMOTE_CHANGE_
    }

    /////////////////////////////////////////////////////////
    // Local Reactivity                                    //
    /////////////////////////////////////////////////////////

    private lift(f){
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

    private liftApp(f,sig){
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
        this.distGlitchPrev.localSignalChanged(node)
        this.localGraph.getDependants(node.id).forEach((dep : Signal)=>{
            this.updateNode(dep as DerivedSignal)
        })
    }

    newSource(signal : Signal){
        this.localGraph.newSource(signal)
    }

    sourceChanged(source : Signal){
        this.localGraph.updateSource(source)
        this.distGlitchPrev.localSignalChanged(source)
        this.localGraph.getDependants(source.id).forEach((dep : Signal)=>{
            this.updateNode(dep as DerivedSignal)
        })
    }

    sourcesChanged(sources : Array<Signal>){
        this.localGraph.updateSources(sources)
        sources.forEach(this.distGlitchPrev.localSignalChanged)
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

    /////////////////////////////////////////////////////////
    // Methods overwritten from default actor mirror       //
    /////////////////////////////////////////////////////////

    initialise(stdLib,appActor,parentRef){
        stdLib.lift     = this.lift.bind(this)
        stdLib.liftApp  = this.liftApp.bind(this)
        this.distGlitchPrev.setMirror(this)
        super.initialise(stdLib,appActor,parentRef)
    }

    sendInvocation(target : FarRef<any>,methodName : string,args : Array<any>,...rest){
        if(methodName != this._REMOTE_CHANGE_){
            let signals = this.containsSignal(args)
            signals.forEach((signal : Signal)=>{
                this.distGlitchPrev.signalSent(signal,target)
            })
        }
        return super.sendInvocation(target,methodName,args,...rest)
    }

    receiveInvocation(sender : FarRef<any>,targetObject : Object,methodName : string,args : Array<any>,...rest){
        if(methodName == this._REMOTE_CHANGE_){
            this.distGlitchPrev.remoteSignalChanged(args[0])
        }
        else{
            let signals = this.containsSignal(args)
            if(signals.length > 0){
                signals.forEach((signal : Signal)=>{
                    this.distGlitchPrev.signalReceived(signal,sender)
                })
            }
            return super.receiveInvocation(sender,targetObject,methodName,args,...rest)
        }
    }
}