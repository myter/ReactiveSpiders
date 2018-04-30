import {DistGlitchPrevention} from "./DistGlitchPrevention";
import {DerivedSignal, Signal} from "./Signal";
import {_REMOTE_CHANGE_, ReactiveMirror} from "./ReactiveMirror";
import {FarRef, SpiderIsolate} from "spiders.js";

export class NoDistGlitch extends SpiderIsolate implements DistGlitchPrevention {
    remoteSignalCopies : Map<string,[Signal,Array<FarRef<any>>]>
    actorMirror        : ReactiveMirror
    _REMOTE_CHANGE_    : string

    constructor(){
        super()
        this.remoteSignalCopies = new Map()
        this._REMOTE_CHANGE_    = _REMOTE_CHANGE_
    }

    setMirror(actorMirror : ReactiveMirror){
        this.actorMirror = actorMirror
    }

    registerSourceSignal(signal : Signal){}

    registerDerivedSignal(signal : DerivedSignal){}

    localSignalChanged(signal: Signal) {
        if(this.remoteSignalCopies.has(signal.id)){
            this.remoteSignalCopies.forEach(([sig,owners])=>{
                owners.forEach((owner)=>{
                    //Avoid copying over the actor mirror
                    let mirr     = signal.actorMirror
                    delete signal.actorMirror
                    owner[this._REMOTE_CHANGE_](signal)
                    signal.actorMirror  = mirr
                })
            })
        }
    }

    remoteSignalChanged(signal : Signal){
        signal.actorMirror = this.actorMirror
        this.actorMirror.sourceChanged(signal)
    }

    signalSent(signal: Signal, target: FarRef<any>) {
        if(!this.remoteSignalCopies.has(signal.id)){
            this.remoteSignalCopies.set(signal.id,[signal,[]])
        }
        this.remoteSignalCopies.get(signal.id)[1].push(target)
    }

    signalReceived(signal : Signal,from : FarRef<any>){
        this.actorMirror.localGraph.newSource(signal)
    }
}