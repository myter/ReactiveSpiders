import {PubSubTag, SpiderIsolate} from "spiders.js";
import {Signal} from "../Signal";

export class PropagationValue extends SpiderIsolate{
    from    : PubSubTag
    value   : Signal
    sClocks : Map<string,number>
    fClock  : number

    constructor(from,value,sClocks,fClock){
        super()
        this.from       = from
        this.value      = value
        this.sClocks    = sClocks
        this.fClock     = fClock
    }

    asString(){
        return "< " + this.from.tagVal + " , " + this.value.toString() + " , " + this.sClocks + " , " + this.fClock + " >"
    }
}