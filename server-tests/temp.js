var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const ServiceMonitor_1 = require("../src/MicroService/ServiceMonitor");
const SubTag_1 = require("../src/PubSub/SubTag");
const MicroService_1 = require("../src/MicroService/MicroService");
var spider = require('../src/spiders');
let monitor = new ServiceMonitor_1.ServiceMonitor();
let sourceTag = new SubTag_1.PubSubTag("source");
let sinkTag = new SubTag_1.PubSubTag("sink");
let aTag = new SubTag_1.PubSubTag("a");
let bTag = new SubTag_1.PubSubTag("b");
class TestSignal extends spider.Signal {
    constructor() {
        super();
        this.value = 1;
    }
    inc() {
        ++this.value;
    }
}
__decorate([
    spider.mutator
], TestSignal.prototype, "inc", null);
class SourceService extends MicroService_1.MicroService {
    constructor() {
        super();
        this.sourceTag = sourceTag;
        this.aTag = aTag;
        this.bTag = bTag;
        this.TestSignal = TestSignal;
        this.sinkTag = sinkTag;
    }
    init() {
        this.t = this.newSignal(this.TestSignal);
        this.QPROP2(this.sourceTag, [], [this.aTag, this.bTag]);
        this.publishSignal(this.t);
        this.update();
    }
    update() {
        this.t.inc();
        setTimeout(() => {
            this.update();
        }, 1000);
    }
}
class ServiceA extends MicroService_1.MicroService {
    constructor() {
        super();
        this.sourceTag = sourceTag;
        this.sinkTag = sinkTag;
        this.aTag = aTag;
    }
    init() {
        let s = this.QPROP2(this.aTag, [this.sourceTag], [this.sinkTag]);
        let ss = this.lift(([s1]) => {
            return (s1.value + 1);
        })(s);
        this.publishSignal(ss);
    }
}
class ServiceB extends MicroService_1.MicroService {
    constructor() {
        super();
        this.sourceTag = sourceTag;
        this.sinkTag = sinkTag;
        this.bTag = bTag;
    }
    init() {
        let s = this.QPROP2(this.bTag, [this.sourceTag], []);
        let ss = this.lift(([s1]) => {
            return (s1.value + 1);
        })(s);
        this.publishSignal(ss);
        setTimeout(() => {
            console.log("Adding dependency");
            this.addDependency(this.bTag, this.sinkTag);
        }, 4000);
    }
}
class SinkService extends MicroService_1.MicroService {
    constructor() {
        super();
        this.aTag = aTag;
        this.bTag = bTag;
        this.sinkTag = sinkTag;
    }
    init() {
        let s = this.QPROP2(this.sinkTag, [this.aTag], []);
        /*this.lift(([v1,v2])=>{
            this.resultVal = v1 + v2
            console.log(this.resultVal)
        })(s)*/
        this.lift((args) => {
            console.log(args);
        })(s);
    }
}
monitor.spawnActor(SourceService);
let sink = monitor.spawnActor(SinkService);
monitor.spawnActor(ServiceA);
monitor.spawnActor(ServiceB);
/*setTimeout(()=>{
    sink.resultVal.then((v)=>{
        console.log("Result in sink: " + v)
    })
},2000)*/ 
//# sourceMappingURL=temp.js.map