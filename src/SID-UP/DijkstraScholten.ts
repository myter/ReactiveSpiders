import {FarRef} from "spiders.js";

export class DijkstraScholten{
    //Deficit on incoming dependencies
    c           : number
    //Deficit on outgoing edges
    d           : number
    //incoming edges
    incoming    : Array<FarRef>
    //idle state
    idle        : number
    //processing state
    processing  : number
    state       : number
    //listener to catch event of termination (used by admitter)
    listener    : Function

    constructor(listener = ()=>{}){
        this.c          = 0
        this.d          = 0
        this.incoming   = []
        this.idle       = 0
        this.processing = 1
        this.state      = this.idle
        this.listener   = listener
    }

    newParentMessage(parentRef : FarRef){
        this.state = this.processing
        this.d++
        this.incoming.push(parentRef)
    }

    newChildMessage(){
        this.state = this.processing
        this.c++
    }

    newAckMessage(){
        this.c--
        if(this.c == 0){
            this.sendAcks()
        }
    }

    nodeTerminated(){
        this.sendAcks()
    }

    sendAcks(){
        this.incoming.forEach((parentRef : FarRef)=>{
            this.d--
            parentRef.ack()
        })
        if(this.d == 0){
            this.state      = this.idle
            this.incoming   = []
            this.listener()
        }
    }

    isIdle(){
        return this.state == this.idle
    }
}