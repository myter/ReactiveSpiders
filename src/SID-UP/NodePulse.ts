import {SpiderIsolate} from "spiders.js";
import {PulseState} from "./PulseState";

export class NodePulse extends SpiderIsolate{
    pulseState      : PulseState
    sourcesChanged  : Array<string>
    value           : any

    constructor(pulseState : PulseState,sourcesChanged : Array<string>,value : any){
        super()
        this.pulseState     = pulseState
        this.sourcesChanged = sourcesChanged
        this.value          = value
    }
}