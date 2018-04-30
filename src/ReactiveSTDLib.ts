import {Signal} from "./Signal";
import {ActorSTDLib} from "spiders.js";
import {ReactiveMirror} from "./ReactiveMirror";

export interface ReactiveSTDLib extends ActorSTDLib {
    lift(func : Function)
    liftApp(func : Function,sig : Signal)
    reflectOnActor() : ReactiveMirror
}