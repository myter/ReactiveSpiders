import {SpiderIsolate} from "spiders.js";

export class PulseState extends SpiderIsolate{
    pending     : number
    unchanged   : number
    changed     : number
    state       : number

    constructor(){
        super()
        this.pending    = 0
        this.unchanged  = 1
        this.changed    = 2
        this.state      = this.pending
    }

    isPending(){
        return this.state == this.pending
    }

    isUnchanged(){
        return this.state == this.unchanged
    }

    isChanged(){
        return this.state == this.changed
    }

    setPending(){
        this.state = this.pending
    }

    setUnchanged(){
        this.state = this.unchanged
    }

    setChanged(){
        this.state = this.changed
    }
}