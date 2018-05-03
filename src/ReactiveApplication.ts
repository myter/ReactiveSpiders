import {Application} from "spiders.js";
import {ReactiveMirror} from "./ReactiveMirror";
import {ReactiveSTDLib} from "./ReactiveSTDLib";
import {NoDistGlitch} from "./NoDistGlitch";

export class ReactiveApplication extends Application{
    libs : ReactiveSTDLib

    constructor(mirror : ReactiveMirror = new ReactiveMirror(new NoDistGlitch()),address,port){
        super(mirror,address,port)
    }
}