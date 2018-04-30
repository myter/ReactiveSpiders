import {PubSubTag} from "spiders.js";
import {PulseState} from "./PulseState";

export class Mirror{
    ownerType   : PubSubTag
    steadyValue : any
    pulseValue  : PulseState

    constructor(ownerType,PState){
        this.ownerType                              = ownerType
        this.pulseValue                             = new PState()
    }
}