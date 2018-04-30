var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const Signal_1 = require("../src/Signal");
const ReactiveApplication_1 = require("../src/ReactiveApplication");
const ReactiveActor_1 = require("../src/ReactiveActor");
const spiders_js_1 = require("spiders.js");
const SIDUPAdmitter_1 = require("../src/SID-UP/SIDUPAdmitter");
const SIDUPActor_1 = require("../src/SID-UP/SIDUPActor");
const QPROPActor_1 = require("../src/QPROP/QPROPActor");
var chai = require('chai');
var expect = chai.expect;
class BasicSignal extends Signal_1.Signal {
    constructor(actorMirror) {
        super(actorMirror);
        this.val = 1;
    }
    inc() {
        this.val++;
    }
    equals(other) {
        return this.val == other.val;
    }
}
__decorate([
    Signal_1.mutating
], BasicSignal.prototype, "inc", null);
describe("Local Reactivity", () => {
    it("In main", function (done) {
        class TestApp extends ReactiveApplication_1.ReactiveApplication {
            constructor() {
                super();
                let sig = new BasicSignal(this.libs.reflectOnActor());
                this.libs.lift((v) => {
                    this.res = v.val;
                })(sig);
                sig.inc();
            }
        }
        let app = new TestApp();
        try {
            expect(app.res).to.equal(2);
            app.kill();
            done();
        }
        catch (e) {
            app.kill();
            done(e);
        }
    });
    it("In Actor", function (done) {
        class TestActor extends ReactiveActor_1.ReactiveActor {
            constructor() {
                super();
                this.sigDef = BasicSignal;
            }
            init() {
                let sig = new this.sigDef(this.libs.reflectOnActor());
                this.libs.lift((v) => {
                    this.res = v.val;
                })(sig);
                sig.inc();
            }
        }
        let app = new ReactiveApplication_1.ReactiveApplication();
        let act = app.spawnActor(TestActor);
        act.res.then((v) => {
            try {
                expect(v).to.equal(2);
                app.kill();
                done();
            }
            catch (e) {
                app.kill();
                done(e);
            }
        });
    });
});
describe("Glitch Freedom", () => {
    it("local glitch freedom", function (done) {
        class TestApp extends ReactiveApplication_1.ReactiveApplication {
            constructor() {
                super();
                let source = new BasicSignal(this.libs.reflectOnActor());
                let adder = this.libs.lift((bs) => {
                    return bs.val + 1;
                });
                let add1 = adder(source);
                let add2 = adder(source);
                this.libs.lift((v1, v2) => {
                    this.res = v1 + v2;
                })(add1, add2);
                source.inc();
            }
        }
        let app = new TestApp();
        try {
            expect(app.res).to.equal(6);
            app.kill();
            done();
        }
        catch (e) {
            app.kill();
            done(e);
        }
    });
    /*it("QPROP simple glitch freedom",function(done){
        this.timeout(10000)
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

            constructor(){
                super()
                this.sourceTag  = sourceTag
                this.aTag       = aTag
                this.bTag       = bTag
                this.TestSignal = TestSignal
                this.sinkTag    = sinkTag
            }

            init(){
                let t : any = this.newSignal(this.TestSignal)
                this.QPROP(this.sourceTag,[],[this.aTag,this.bTag],t)
                this.publishSignal(t)
                t.inc()
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
                let s = this.QPROP(this.aTag,[this.sourceTag],[this.sinkTag],-1)
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
                let s = this.QPROP(this.bTag,[this.sourceTag],[this.sinkTag],-1);
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
                let s = this.QPROP(this.sinkTag,[this.aTag,this.bTag],[],null)
                this.lift(([v1,v2])=>{
                    this.resultVal = v1 + v2
                })(s)
            }
        }
        monitor.spawnActor(SourceService)
        let sink = monitor.spawnActor(SinkService)
        monitor.spawnActor(ServiceA)
        monitor.spawnActor(ServiceB)
        setTimeout(()=>{
            sink.resultVal.then((v)=>{
                try{
                    expect(v).to.equal(6)
                    monitor.kill()
                    done()
                }
                catch(e){
                    monitor.kill()
                    done(e)
                }
            })
        },2000)
    })*/
    it("SIDUP simple glitch freedom", function (done) {
        this.timeout(10000);
        class SIDUPApp extends spiders_js_1.Application {
            constructor() {
                super(new spiders_js_1.SpiderActorMirror(), "127.0.0.1", 8000);
                this.libs.setupPSServer();
            }
        }
        let app = new SIDUPApp();
        let admitterTag = new app.libs.PubSubTag("admitter");
        let sourceTag = new app.libs.PubSubTag("source");
        let sinkTag = new app.libs.PubSubTag("sink");
        let aTag = new app.libs.PubSubTag("a");
        let bTag = new app.libs.PubSubTag("b");
        class TestSignal extends Signal_1.Signal {
            constructor(actorMirror) {
                super(actorMirror);
                this.value = 1;
            }
            inc() {
                ++this.value;
            }
            equals(otherSingal) {
                return this.value == otherSingal.value;
            }
        }
        __decorate([
            Signal_1.mutating
        ], TestSignal.prototype, "inc", null);
        app.spawnActor(SIDUPAdmitter_1.SIDUPAdmitter, [admitterTag, 1, 1]);
        class SourceService extends SIDUPActor_1.SIDUPActor {
            constructor(ownType, admType, parents, ...rest) {
                super(ownType, admType, parents, ...rest);
                this.TestSignal = TestSignal;
            }
            init() {
                let t = new this.TestSignal(this.libs.reflectOnActor());
                this.publishSignal(t);
                t.inc();
            }
        }
        class ServiceA extends SIDUPActor_1.SIDUPActor {
            constructor(ownType, admType, parents, ...rest) {
                super(ownType, admType, parents, ...rest);
            }
            start(s) {
                let ss = this.libs.lift((s1) => {
                    return (s1.value + 1);
                })(s);
                this.publishSignal(ss);
            }
        }
        class ServiceB extends SIDUPActor_1.SIDUPActor {
            constructor(ownType, admType, parents, ...rest) {
                super(ownType, admType, parents, ...rest);
            }
            start(s) {
                let ss = this.libs.lift((s1) => {
                    return (s1.value + 1);
                })(s);
                this.publishSignal(ss);
            }
        }
        class SinkService extends SIDUPActor_1.SIDUPActor {
            constructor(ownType, admType, parents, ...rest) {
                super(ownType, admType, parents, ...rest);
            }
            start(v1, v2) {
                this.libs.lift((a, b) => {
                    this.resultVal = a + b;
                })(v1, v2);
            }
        }
        let source = app.spawnActor(SourceService, [sourceTag, admitterTag, []]);
        let a = app.spawnActor(ServiceA, [aTag, admitterTag, [sourceTag]]);
        let b = app.spawnActor(ServiceB, [bTag, admitterTag, [sourceTag]]);
        let sink = app.spawnActor(SinkService, [sinkTag, admitterTag, [aTag, bTag], true]);
        setTimeout(() => {
            sink.resultVal.then((v) => {
                try {
                    expect(v).to.equal(6);
                    app.kill();
                    done();
                }
                catch (e) {
                    app.kill();
                    done(e);
                }
            });
        }, 2000);
    });
    it("QPROP simple glitch freedom", function (done) {
        this.timeout(10000);
        class QPROPApp extends spiders_js_1.Application {
            constructor() {
                super(new spiders_js_1.SpiderActorMirror(), "127.0.0.1", 8000);
                this.libs.setupPSServer();
            }
        }
        let app = new QPROPApp();
        let sourceTag = new app.libs.PubSubTag("source");
        let sinkTag = new app.libs.PubSubTag("sink");
        let aTag = new app.libs.PubSubTag("a");
        let bTag = new app.libs.PubSubTag("b");
        class TestSignal extends Signal_1.Signal {
            constructor(actorMirror) {
                super(actorMirror);
                this.value = 1;
            }
            inc() {
                ++this.value;
            }
            equals(otherSingal) {
                return this.value == otherSingal.value;
            }
        }
        __decorate([
            Signal_1.mutating
        ], TestSignal.prototype, "inc", null);
        class SourceService extends QPROPActor_1.QPROPActor {
            constructor(ownType, admType, parents, ...rest) {
                super(ownType, admType, parents, ...rest);
                this.TestSignal = TestSignal;
            }
            start() {
                let t = new this.TestSignal(this.libs.reflectOnActor());
                setTimeout(() => {
                    t.inc();
                }, 2000);
                return t;
            }
        }
        class ServiceA extends QPROPActor_1.QPROPActor {
            start(s) {
                return this.libs.lift((s1) => {
                    return (s1.value + 1);
                })(s);
            }
        }
        class ServiceB extends QPROPActor_1.QPROPActor {
            start(s) {
                return this.libs.lift((s1) => {
                    return (s1.value + 1);
                })(s);
            }
        }
        class SinkService extends QPROPActor_1.QPROPActor {
            start(v1, v2) {
                return this.libs.lift((a, b) => {
                    this.resultVal = a + b;
                })(v1, v2);
            }
        }
        let source = app.spawnActor(SourceService, [sourceTag, [], [aTag, bTag]]);
        let a = app.spawnActor(ServiceA, [aTag, [sourceTag], [sinkTag]]);
        let b = app.spawnActor(ServiceB, [bTag, [sourceTag], [sinkTag]]);
        let sink = app.spawnActor(SinkService, [sinkTag, [aTag, bTag], []]);
        setTimeout(() => {
            sink.resultVal.then((v) => {
                try {
                    expect(v).to.equal(6);
                    app.kill();
                    done();
                }
                catch (e) {
                    app.kill();
                    done(e);
                }
            });
        }, 5000);
    });
    it("SIDUP dynamic glitch freedom", function (done) {
        this.timeout(20000);
        class MyApp extends spiders_js_1.Application {
            constructor() {
                super(new spiders_js_1.SpiderActorMirror(), "127.0.0.1", 8000);
                this.libs.setupPSServer();
                console.log("constructed");
            }
        }
        let app = new MyApp();
        let admType = new app.libs.PubSubTag("admitter");
        let sourcetype = new app.libs.PubSubTag("Source");
        let sinkType = new app.libs.PubSubTag("Sink");
        let aType = new app.libs.PubSubTag("A");
        let bType = new app.libs.PubSubTag("B");
        let adm = app.spawnActor(SIDUPAdmitter_1.SIDUPAdmitter, [admType, 1, 1]);
        class TestSignal extends Signal_1.Signal {
            constructor(actorMirror) {
                super(actorMirror);
                this.val = 5;
            }
            inc() {
                this.val++;
            }
            noInc() {
                //do nothing
            }
            equals(other) {
                return this.val == other.val;
            }
        }
        __decorate([
            Signal_1.mutating
        ], TestSignal.prototype, "inc", null);
        __decorate([
            Signal_1.mutating
        ], TestSignal.prototype, "noInc", null);
        class TestSource extends SIDUPActor_1.SIDUPActor {
            constructor(ownType, admType, parents, ...rest) {
                super(ownType, admType, parents, ...rest);
                this.TestSignal = TestSignal;
            }
            init() {
                this.sig = new this.TestSignal(this.libs.reflectOnActor());
                this.publishSignal(this.sig);
            }
            inc() {
                this.sig.inc();
            }
        }
        class A extends SIDUPActor_1.SIDUPActor {
            start(source) {
                let ret = this.libs.liftApp((s) => {
                    return s.val + 1;
                }, source);
                this.publishSignal(ret);
            }
        }
        class B extends SIDUPActor_1.SIDUPActor {
            start(source) {
                let ret = this.libs.liftApp((s) => {
                    return s.val + 1;
                }, source);
                this.publishSignal(ret);
            }
        }
        class TestSink extends SIDUPActor_1.SIDUPActor {
            start(...args) {
                this.libs.lift((...argsC) => {
                    this.lastVal = argsC;
                })(...args);
            }
        }
        let source = app.spawnActor(TestSource, [sourcetype, admType, []]);
        let a = app.spawnActor(A, [aType, admType, [sourcetype]]);
        let b = app.spawnActor(B, [bType, admType, [sourcetype]]);
        let sink = app.spawnActor(TestSink, [sinkType, admType, [aType], true]);
        source.inc();
        //It is unclear from SID-UP semantics what should happen if a dependency change happens before an change orignally propagates (i.e. what "initial" pulse does the parent provide to its new child), wait to make sure that graph propagates value first before changing dependency
        setTimeout(() => {
            adm.addDependency(bType, sinkType);
            source.inc();
        }, 5000);
        setTimeout(() => {
            sink.lastVal.then((v) => {
                try {
                    expect(v[0]).to.equal(8);
                    expect(v[0]).to.equal(8);
                    app.kill();
                    done();
                }
                catch (e) {
                    app.kill();
                    done(e);
                }
            });
        }, 8000);
    });
    it("QPROP dynamic glitch freedom", function (done) {
        this.timeout(20000);
        class MyApp extends spiders_js_1.Application {
            constructor() {
                super(new spiders_js_1.SpiderActorMirror(), "127.0.0.1", 8000);
                this.libs.setupPSServer();
                console.log("constructed");
            }
        }
        let app = new MyApp();
        let sourcetype = new app.libs.PubSubTag("Source");
        let sinkType = new app.libs.PubSubTag("Sink");
        let aType = new app.libs.PubSubTag("A");
        let bType = new app.libs.PubSubTag("B");
        class TestSignal extends Signal_1.Signal {
            constructor(actorMirror) {
                super(actorMirror);
                this.val = 5;
            }
            inc() {
                this.val++;
            }
            noInc() {
                //do nothing
            }
            equals(other) {
                return this.val == other.val;
            }
        }
        __decorate([
            Signal_1.mutating
        ], TestSignal.prototype, "inc", null);
        __decorate([
            Signal_1.mutating
        ], TestSignal.prototype, "noInc", null);
        class TestSource extends QPROPActor_1.QPROPActor {
            constructor(ownType, parentTypes, childTypes, psServerAddress = "127.0.0.1", psServerPort = 8000) {
                super(ownType, parentTypes, childTypes, psServerAddress, psServerPort);
                this.TestSignal = TestSignal;
            }
            start() {
                this.sig = new this.TestSignal(this.libs.reflectOnActor());
                return this.sig;
            }
            inc() {
                this.sig.inc();
            }
        }
        class A extends QPROPActor_1.QPROPActor {
            start(source) {
                return this.libs.liftApp((s) => {
                    return s.val + 1;
                }, source);
            }
        }
        class B extends QPROPActor_1.QPROPActor {
            start(source) {
                return this.libs.liftApp((s) => {
                    return s.val + 1;
                }, source);
            }
        }
        class TestSink extends QPROPActor_1.QPROPActor {
            start(...args) {
                return this.libs.lift((...argsC) => {
                    this.lastVal = argsC;
                })(...args);
            }
            addDep(btype) {
                this.addDependency(btype);
            }
        }
        let source = app.spawnActor(TestSource, [sourcetype, [], [aType, bType]]);
        let a = app.spawnActor(A, [aType, [sourcetype], [sinkType]]);
        let b = app.spawnActor(B, [bType, [sourcetype], []]);
        let sink = app.spawnActor(TestSink, [sinkType, [aType], []]);
        source.inc();
        //It is unclear from SID-UP semantics what should happen if a dependency change happens before an change orignally propagates (i.e. what "initial" pulse does the parent provide to its new child), wait to make sure that graph propagates value first before changing dependency
        setTimeout(() => {
            sink.addDependency(bType);
            source.inc();
        }, 5000);
        setTimeout(() => {
            sink.lastVal.then((v) => {
                try {
                    expect(v[0]).to.equal(8);
                    expect(v[0]).to.equal(8);
                    app.kill();
                    done();
                }
                catch (e) {
                    app.kill();
                    done(e);
                }
            });
        }, 8000);
    });
});
describe("Remote Reactivity", () => {
    it("main to actor", function (done) {
        this.timeout(10000);
        class TestApp extends ReactiveApplication_1.ReactiveApplication {
            createAndSend(toRef) {
                let sig = new BasicSignal(this.libs.reflectOnActor());
                toRef.getSignal(sig);
                setTimeout(() => {
                    sig.inc();
                }, 2000);
            }
        }
        class TestActor extends ReactiveActor_1.ReactiveActor {
            getSignal(sig) {
                this.libs.lift((s) => {
                    this.resolve(s.val);
                })(sig);
            }
            getVal() {
                let prom = new Promise((resolve) => {
                    this.resolve = resolve;
                });
                return prom;
            }
        }
        let app = new TestApp();
        let act = app.spawnActor(TestActor);
        app.createAndSend(act);
        act.getVal().then((v) => {
            try {
                expect(v).to.equal(2);
                app.kill();
                done();
            }
            catch (e) {
                app.kill();
                done(e);
            }
        });
    });
    it("actor to actor", function (done) {
        this.timeout(10000);
        class Producer extends ReactiveActor_1.ReactiveActor {
            constructor() {
                super();
                this.BasicSignal = BasicSignal;
            }
            createAndSend(consumerRef) {
                let sig = new this.BasicSignal(this.libs.reflectOnActor());
                consumerRef.getSignal(sig);
                setTimeout(() => {
                    sig.inc();
                }, 2000);
            }
        }
        class Consumer extends ReactiveActor_1.ReactiveActor {
            getSignal(signalRef) {
                this.libs.lift((v) => {
                    this.resolve(v.val);
                })(signalRef);
            }
            getVal() {
                let prom = new Promise((resolve) => {
                    this.resolve = resolve;
                });
                return prom;
            }
        }
        let app = new ReactiveApplication_1.ReactiveApplication();
        let consumer = app.spawnActor(Consumer);
        let producer = app.spawnActor(Producer);
        producer.createAndSend(consumer);
        consumer.getVal().then((v) => {
            try {
                expect(v).to.equal(2);
                app.kill();
                done();
            }
            catch (e) {
                app.kill();
                done(e);
            }
        });
    });
    it("transitive", function (done) {
        this.timeout(10000);
        class TestApp extends ReactiveApplication_1.ReactiveApplication {
            createAndSend(firstRef, secondRef) {
                let sig = new BasicSignal(this.libs.reflectOnActor());
                firstRef.getSignal(sig, secondRef);
                setTimeout(() => {
                    sig.inc();
                }, 4000);
            }
        }
        class Act1 extends ReactiveActor_1.ReactiveActor {
            getSignal(signalRef, forwardRef) {
                forwardRef.getSignal(signalRef);
            }
        }
        class Act2 extends ReactiveActor_1.ReactiveActor {
            getSignal(signalRef) {
                this.libs.lift((v) => {
                    this.resolve(v.val);
                })(signalRef);
            }
            getVal() {
                let prom = new Promise((resolve) => {
                    this.resolve = resolve;
                });
                return prom;
            }
        }
        let app = new TestApp();
        let a1 = app.spawnActor(Act1);
        let a2 = app.spawnActor(Act2);
        app.createAndSend(a1, a2);
        a2.getVal().then((v) => {
            try {
                expect(v).to.equal(2);
                app.kill();
                done();
            }
            catch (e) {
                app.kill();
                done(e);
            }
        });
    });
    it("pipeline", function (done) {
        this.timeout(10000);
        class TestApp extends ReactiveApplication_1.ReactiveApplication {
            createAndSend(firstRef, secondRef) {
                let sig = new BasicSignal(this.libs.reflectOnActor());
                firstRef.getSignal(sig, secondRef);
                setTimeout(() => {
                    sig.inc();
                }, 4000);
            }
        }
        class Act1 extends ReactiveActor_1.ReactiveActor {
            getSignal(signalRef, forwardRef) {
                let derived = this.libs.lift((v) => {
                    return v.val * 10;
                })(signalRef);
                forwardRef.getSignal(derived);
            }
        }
        class Act2 extends ReactiveActor_1.ReactiveActor {
            getSignal(signalRef) {
                this.libs.lift((v) => {
                    this.resolve(v);
                })(signalRef);
            }
            getVal() {
                let prom = new Promise((resolve) => {
                    this.resolve = resolve;
                });
                return prom;
            }
        }
        let app = new TestApp();
        let a1 = app.spawnActor(Act1);
        let a2 = app.spawnActor(Act2);
        app.createAndSend(a1, a2);
        a2.getVal().then((v) => {
            try {
                expect(v).to.equal(20);
                app.kill();
                done();
            }
            catch (e) {
                app.kill();
                done(e);
            }
        });
    });
});
//# sourceMappingURL=reactivity.Test.js.map