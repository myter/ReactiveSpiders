import {Application} from "spiders.js";
import {ReactiveMirror} from "./ReactiveMirror";
import {ReactiveSTDLib} from "./ReactiveSTDLib";
import {NoDistGlitch} from "./NoDistGlitch";

export class ReactiveApplication extends Application{
    libs : ReactiveSTDLib

    constructor(){
        super(new ReactiveMirror(new NoDistGlitch()))
    }
}