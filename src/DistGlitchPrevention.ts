import {DerivedSignal, Signal} from "./Signal";
import {FarRef} from "spiders.js";
import {ReactiveMirror} from "./ReactiveMirror";

export interface DistGlitchPrevention{
    setMirror(actorMirror : ReactiveMirror)
    registerSourceSignal(signal : Signal)
    registerDerivedSignal(signal : DerivedSignal)
    localSignalChanged(signal : Signal)
    remoteSignalChanged(signal : Signal)
    signalSent(signal : Signal,target : FarRef<any>)
    signalReceived(signal : Signal,from : FarRef<any>)
}