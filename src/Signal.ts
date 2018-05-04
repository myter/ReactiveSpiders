import {bundleScope, LexScope, makeMethodAnnotation, SpiderIsolate, SpiderIsolateMirror} from "spiders.js";
import {ReactiveMirror} from "./ReactiveMirror";

export var mutating = makeMethodAnnotation(()=>{},"mutating")
class SignalMirror extends SpiderIsolateMirror{

    isMutatingMethod(methodName){
        if(this.isAnnotated(methodName)){
            return this.getAnnotationTag(methodName) == "mutating"
        }
        else{
            return false
        }
    }

    invoke(methodName : string,args : Array<any>){
        let ret = super.invoke(methodName,args)
        if(this.isMutatingMethod(methodName)){
            let sig = this.base as Signal
            sig.actorMirror.sourceChanged(sig)
        }
        return ret
    }
}

export abstract class Signal extends SpiderIsolate{
    id                  : string
    actorMirror         : ReactiveMirror
    isSignal            : boolean
    isDerived           : boolean

    constructor(actorMirror : ReactiveMirror){
        super(new SignalMirror())
        this.id                     = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
            return v.toString(16);
        })
        this.actorMirror            = actorMirror
        this.actorMirror.newSource(this)
        this.isSignal               = true
        this.isDerived              = false
    }

    abstract equals(otherSignal : Signal)
}

export abstract class DerivedSignal extends Signal{
    lastVal
    exp

    constructor(exp : Function,actorMirror : ReactiveMirror){
        super(actorMirror)
        this.exp                = exp
        this.isDerived          = true
    }

    update(parentValues){
        this.lastVal = this.exp(...parentValues)
    }

    equals(otherDerived : DerivedSignal){
        return this.lastVal == otherDerived.lastVal
    }

    getState(){
        return this.lastVal
    }

    setState(newState){
        this.lastVal = newState
    }
}

let scope = new LexScope()
scope.addElement("SignalMirror",SignalMirror)
bundleScope(Signal,scope)
