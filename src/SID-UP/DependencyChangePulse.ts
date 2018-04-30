import {PubSubTag, SpiderIsolate} from "spiders.js";

export class DependencyChangePulse extends SpiderIsolate{
    fromType    : PubSubTag
    toType      : PubSubTag

    constructor(fromType : PubSubTag,toType : PubSubTag){
        super()
        this.fromType                               = fromType
        this.toType                                 = toType
    }
}