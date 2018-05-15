import {ServiceMonitor} from "../src/MicroService/ServiceMonitor";
import {PubSubTag} from "../src/PubSub/SubTag";
import {MicroService} from "../src/MicroService/MicroService";
import {SpiderLib} from "../src/spiders";
var spider  : SpiderLib         = require('../src/spiders')
let monitor = new ServiceMonitor()
let sourceTag   = new PubSubTag("source")
let sinkTag     = new PubSubTag("sink")
let aTag        = new PubSubTag("a")
let bTag        = new PubSubTag("b")

class TestSignal extends spider.Signal{
    value

    constructor(){
        super()
        this.value = 1
    }

    @spider.mutator
    inc(){
        ++this.value
    }
}

class SourceService extends MicroService{
    sourceTag
    sinkTag
    aTag
    bTag
    TestSignal
    t

    constructor(){
        super()
        this.sourceTag  = sourceTag
        this.aTag       = aTag
        this.bTag       = bTag
        this.TestSignal = TestSignal
        this.sinkTag    = sinkTag
    }

    init(){
        this.t  = this.newSignal(this.TestSignal)
        this.QPROP2(this.sourceTag,[],[this.aTag,this.bTag])
        this.publishSignal(this.t)
        this.update()
    }

    update(){
        this.t.inc()
        setTimeout(()=>{
            this.update()
        },1000)
    }
}

class ServiceA extends MicroService{
    sourceTag
    sinkTag
    aTag

    constructor(){
        super()
        this.sourceTag  = sourceTag
        this.sinkTag    = sinkTag
        this.aTag       = aTag
    }

    init(){
        let s = this.QPROP2(this.aTag,[this.sourceTag],[this.sinkTag])
        let ss = this.lift(([s1])=>{
            return (s1.value + 1)
        })(s)
        this.publishSignal(ss)
    }
}

class ServiceB extends  MicroService{
    sourceTag
    sinkTag
    bTag

    constructor(){
        super()
        this.sourceTag  = sourceTag
        this.sinkTag    = sinkTag
        this.bTag       = bTag
    }

    init(){
        let s = this.QPROP2(this.bTag,[this.sourceTag],[this.sinkTag]);
        let ss = this.lift(([s1])=>{
            return (s1.value + 1)
        })(s)
        this.publishSignal(ss)
    }
}

class SinkService extends MicroService{
    aTag
    bTag
    sinkTag
    resultVal

    constructor(){
        super()
        this.aTag       = aTag
        this.bTag       = bTag
        this.sinkTag    = sinkTag
    }

    init(){
        let s = this.QPROP2(this.sinkTag,[this.aTag,this.bTag],[])
        this.lift(([v1,v2])=>{
            this.resultVal = v1 + v2
            console.log(this.resultVal)
        })(s)
    }
}
monitor.spawnActor(SourceService)
let sink = monitor.spawnActor(SinkService)
monitor.spawnActor(ServiceA)
monitor.spawnActor(ServiceB)
/*setTimeout(()=>{
    sink.resultVal.then((v)=>{
        console.log("Result in sink: " + v)
    })
},2000)*/