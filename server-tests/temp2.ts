import {ServiceMonitor} from "../src/MicroService/ServiceMonitor";
import {SpiderLib} from "../src/spiders";
import {MicroService} from "../src/MicroService/MicroService";
import {PubSubTag} from "../src/PubSub/SubTag";
var spiders : SpiderLib = require("../src/spiders")
let monitor = new ServiceMonitor("127.0.0.1",8000)
class TestSignal extends spiders.Signal{
    value

    constructor(){
        super()
        this.value = 1
    }

    @spiders.mutator
    inc(){
        ++this.value
    }
}

var SourceTag   = new PubSubTag("Source")
var Source2Tag  = new PubSubTag("Source2")
var ATag        = new PubSubTag("A")
var BTag        = new PubSubTag("B")
var SinkTag     = new PubSubTag("Sink")
var SuperTag    = new PubSubTag("Super")

class Source extends MicroService{
    TestSignal
    t
    SourceTag
    SinkTag

    constructor(){
        super()
        this.TestSignal = TestSignal
        this.SourceTag = SourceTag
        this.SinkTag = SinkTag
    }

    start(subSignal){
        this.t = this.newSignal(this.TestSignal)
        this.publishSignal(this.t)
        this.update()
    }

    update(){
        setTimeout(()=>{
            this.t.inc()
            this.update()
        },2000)
    }
}

class Source2 extends MicroService{
    TestSignal
    t
    Source2Tag
    SinkTag

    constructor(){
        super()
        this.TestSignal = TestSignal
        this.Source2Tag = Source2Tag
        this.SinkTag = BTag
    }

    start(subSignal){
        this.t = this.newSignal(this.TestSignal)
        this.publishSignal(this.t)
        this.update()
    }

    update(){
        setTimeout(()=>{
            this.t.inc()
            this.update()
        },3000)
    }
}

class A extends MicroService{
    start(subSignal){
        let r = this.lift(([v])=>{
            return ++v.value
        })(subSignal)
        this.publishSignal(r)
    }
}

class B extends MicroService{
    start(subSignal){
        let r = this.lift(([v])=>{
            return ++v.value
        })(subSignal)
        this.publishSignal(r)
    }
}

class Sink extends MicroService{
    start(subSignal){
        let x  =this.lift((res)=>{
            console.log("Got: "+res)
            return res
        })(subSignal)
        this.publishSignal(x)
    }
}

class SuperSink extends MicroService{
    start(subSignal){
        this.lift((res)=>{
            console.log("Got SUPER: "+res)
        })(subSignal)
    }
}

monitor.installRService(SuperSink,SuperTag,[SinkTag],null)
monitor.installRService(Sink,SinkTag,[ATag,BTag,Source2Tag],null)
monitor.installRService(Source,SourceTag,[],null)
monitor.installRService(A,ATag,[SourceTag],null)
monitor.installRService(B,BTag,[SourceTag],null)
monitor.deploy()