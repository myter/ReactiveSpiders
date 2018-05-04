import {PubSubTag, SpiderIsolate} from "spiders.js";
import {Signal} from "../Signal";

export class PropagationValue extends SpiderIsolate{
    from        : PubSubTag
    value       : Signal
    sClocks     : Map<string,number>
    fClock      : number
    isOptimised : boolean

    constructor(from,value,sClocks,fClock,isOptimised = false){
        super()
        this.from           = from
        this.value          = value
        this.sClocks        = sClocks
        this.fClock         = fClock
        this.isOptimised    = isOptimised
    }

    asString(){
        return "< " + this.from.tagVal + " , " + this.value.toString() + " , " + this.sClocks + " , " + this.fClock + " >"
    }

    toArray(){
        return [this.from.tagVal,this.value,JSON.stringify([...this.sClocks]),this.fClock,this.isOptimised]
    }
}