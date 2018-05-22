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
let aTag = new SubTag_1.PubSubTag("A");
let bTag = new SubTag_1.PubSubTag("B");
let cTag = new SubTag_1.PubSubTag("C");
let dTag = new SubTag_1.PubSubTag("D");
let eTag = new SubTag_1.PubSubTag("E");
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
class ServiceA extends MicroService_1.MicroService {
    constructor() {
        super();
        this.aTag = aTag;
        this.cTag = cTag;
        this.TestSignal = TestSignal;
    }
    init() {
        this.t = this.newSignal(this.TestSignal);
        this.QPROP2(this.aTag, [], [this.cTag]);
        this.publishSignal(this.t);
        this.update();
    }
    update() {
        this.t.inc();
        setTimeout(() => {
            this.update();
        }, 3000);
    }
}
class ServiceB extends MicroService_1.MicroService {
    constructor() {
        super();
        this.bTag = bTag;
        this.dTag = dTag;
        this.cTag = cTag;
        this.aTag = aTag;
        this.TestSignal = TestSignal;
    }
    init() {
        this.t = this.newSignal(this.TestSignal);
        this.QPROP2(this.bTag, [], [this.dTag]);
        this.publishSignal(this.t);
        this.update();
        setTimeout(() => {
            console.log("Adding dependency");
            this.addDependency(this.bTag, this.cTag);
            console.log("AGAIn");
            this.addDependency(this.aTag, this.dTag);
        }, 4000);
    }
    update() {
        this.t.inc();
        setTimeout(() => {
            this.update();
        }, 2000);
    }
}
class ServiceC extends MicroService_1.MicroService {
    constructor() {
        super();
        this.cTag = cTag;
        this.aTag = aTag;
        this.eTag = eTag;
    }
    init() {
        let s = this.QPROP2(this.cTag, [this.aTag], [this.eTag]);
        let ss = this.lift(([s1]) => {
            return (s1.value + 1);
        })(s);
        this.publishSignal(ss);
    }
}
class ServiceD extends MicroService_1.MicroService {
    constructor() {
        super();
        this.dTag = dTag;
        this.eTag = eTag;
        this.bTag = bTag;
    }
    init() {
        let s = this.QPROP2(this.dTag, [this.bTag], [this.eTag]);
        let ss = this.lift(([s1]) => {
            return (s1.value + 1);
        })(s);
        this.publishSignal(ss);
    }
}
class ServiceE extends MicroService_1.MicroService {
    constructor() {
        super();
        this.cTag = cTag;
        this.dTag = dTag;
        this.eTag = eTag;
    }
    init() {
        let s = this.QPROP2(this.eTag, [this.cTag, this.dTag], []);
        /*this.lift(([v1,v2])=>{
            this.resultVal = v1 + v2
            console.log(this.resultVal)
        })(s)*/
        this.lift((args) => {
            console.log(args);
        })(s);
    }
}
monitor.spawnActor(ServiceA);
let sink = monitor.spawnActor(ServiceE);
monitor.spawnActor(ServiceB);
monitor.spawnActor(ServiceC);
monitor.spawnActor(ServiceD);
/*setTimeout(()=>{
    sink.resultVal.then((v)=>{
        console.log("Result in sink: " + v)
    })
},2000)*/ 
//# sourceMappingURL=temp.js.map