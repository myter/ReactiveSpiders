import {Actor} from "spiders.js";
import {ReactiveMirror} from "./ReactiveMirror";
import {ReactiveSTDLib} from "./ReactiveSTDLib";
import {NoDistGlitch} from "./NoDistGlitch";

export class ReactiveActor extends Actor{
    libs : ReactiveSTDLib

    constructor(mirror : ReactiveMirror = new ReactiveMirror(new NoDistGlitch())){
        super(mirror)
    }
}