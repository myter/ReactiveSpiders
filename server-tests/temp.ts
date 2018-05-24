import {ServiceMonitor} from "../src/MicroService/ServiceMonitor";
import {PubSubTag} from "../src/PubSub/SubTag";
import {MicroService} from "../src/MicroService/MicroService";
import {SpiderLib} from "../src/spiders";
var spider  : SpiderLib         = require('../src/spiders')
let monitor = new ServiceMonitor()


let aTag        = new PubSubTag("A")
let bTag        = new PubSubTag("B")
let cTag        = new PubSubTag("C")
let dTag        = new PubSubTag("D")
let eTag        = new PubSubTag("E")

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

class ServiceA extends MicroService{
    aTag
    cTag
    dTag
    TestSignal
    t

    constructor(){
        super()
        this.aTag       = aTag
        this.cTag       = cTag
        this.dTag       = dTag
        this.TestSignal = TestSignal
    }

    init(){
        this.t  = this.newSignal(this.TestSignal)
        this.QPROP2(this.aTag,[],[this.cTag,this.dTag])
        this.publishSignal(this.t)
        this.update()
    }

    update(){
        this.t.inc()
        setTimeout(()=>{
            this.update()
        },10)
    }
}

class ServiceB extends MicroService{
    bTag
    cTag
    aTag
    dTag
    TestSignal
    t

    constructor(){
        super()
        this.bTag       = bTag
        this.dTag       = dTag
        this.cTag       = cTag
        this.aTag       = aTag
        this.TestSignal = TestSignal
    }

    init(){
        this.t  = this.newSignal(this.TestSignal)
        this.QPROP2(this.bTag,[],[this.dTag,this.cTag])
        this.publishSignal(this.t)
        this.update()
        setTimeout(()=>{
            console.log("Adding dependency")
            this.addDependency(this.bTag,this.cTag)
            console.log("AGAIn")
            this.addDependency(this.aTag,this.dTag)
        },4000)
    }

    update(){
        this.t.inc()
        setTimeout(()=>{
            this.update()
        },10)
    }
}

class ServiceC extends MicroService{
    cTag
    aTag
    eTag
    bTag

    constructor(){
        super()
        this.cTag       = cTag
        this.aTag       = aTag
        this.eTag       = eTag
        this.bTag       = bTag
    }

    init(){
        let s = this.QPROP2(this.cTag,[this.aTag,this.bTag],[this.eTag])
        let ss = this.lift(([s1,s2])=>{
            if(s1 != null){
                return s1.value
            }
            else{
                return s2.value
            }
        })(s)
        this.publishSignal(ss)
    }
}

class ServiceD extends  MicroService{
    bTag
    dTag
    eTag
    aTag

    constructor(){
        super()
        this.dTag       = dTag
        this.eTag       = eTag
        this.bTag       = bTag
        this.aTag       = aTag
    }

    init(){
        let s = this.QPROP2(this.dTag,[this.bTag,this.aTag],[this.eTag]);
        let ss = this.lift(([s1,s2])=>{
            if(s1 != null){
                return s1.value
            }
            else{
                return s2.value
            }
        })(s)
        this.publishSignal(ss)
    }
}

class ServiceE extends MicroService{
    cTag
    dTag
    eTag

    constructor(){
        super()
        this.cTag = cTag
        this.dTag = dTag
        this.eTag = eTag
    }

    init(){
        let s = this.QPROP2(this.eTag,[this.cTag,this.dTag],[])
        /*this.lift(([v1,v2])=>{
            this.resultVal = v1 + v2
            console.log(this.resultVal)
        })(s)*/
        this.lift((args)=>{
            console.log(args)
        })(s)
    }
}
monitor.spawnActor(ServiceA)
let sink = monitor.spawnActor(ServiceE)
monitor.spawnActor(ServiceB)
monitor.spawnActor(ServiceC)
monitor.spawnActor(ServiceD)
/*setTimeout(()=>{
    sink.resultVal.then((v)=>{
        console.log("Result in sink: " + v)
    })
},2000)*/