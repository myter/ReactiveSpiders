/*(Array.prototype as any).flatMap = function(lambda) {
    return Array.prototype.concat.apply([], this.map(lambda));
};

//return x = Cons x Nil
function list(a) {
    return [a];
}

//xs >>= k = join $ fmap k xs
//xs :: [a]k  ::  a->[b]

// oneOf :: M a -> a -> M b -> M b
function oneOf(xs,k) {
    return xs.flatMap(k);
}

function plus(a,b) {
    return [a+b];
}

function guard( x ) {
    if(x) {
        return [null];
    } else {
        return [];
    }
}

var res = oneOf([1,2,3],(a) => {
    return oneOf([1,2,3],(b) => {
        return oneOf(guard(a+b>4), () => {
            return plus(a,b); }) });
});
let app = new ReactiveApplication()
let f1 = new app.libs.PubSubTag("f1")
let f2 = new app.libs.PubSubTag("f2")
let t1 = [new PropagationValue(f1,1,undefined,0),new PropagationValue(f1,2,undefined,1),new PropagationValue(f1,3,undefined,2)]
let t2 = [new PropagationValue(f2,11,undefined,0),new PropagationValue(f2,22,undefined,1)]

function getAllArgs(tables){
    let loop = (index,args)=>{
        if(index < tables.length){
            return oneOf(tables[index],(arg)=>{
                return loop(index+1,args.concat(arg))
            })
        }
        else{
            return [args]
        }
    }
    return loop(0,[])
}

function matchArgs(allArgs){
    return oneOf(allArgs,(args)=>{
        let ok = args.filter((a)=>{return a.fClock == 1})
        return oneOf(guard(ok.length == args.length),()=>{
            return [args]
        })
    })
}
let x = getAllArgs([t1,t2])
x
let y = matchArgs(x)
y
*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const spiders_js_1 = require("spiders.js");
const Signal_1 = require("../src/Signal");
const QPROPActor_1 = require("../src/QPROP/QPROPActor");
/*class MyApp extends Application{
    constructor(){
        super(new SpiderActorMirror(),"127.0.0.1",8000)
        this.libs.setupPSServer()
    }
}
let app = new MyApp()
let sourcetype  = new app.libs.PubSubTag("Source")
let sinkType    = new app.libs.PubSubTag("Sink")
let aType       = new app.libs.PubSubTag("A")
let bType       = new app.libs.PubSubTag("B")

class TestSignal extends Signal{
    val
    constructor(actorMirror : ReactiveMirror){
        super(actorMirror)
        this.val = 5
    }

    @mutating
    inc(){
        this.val++
    }

    @mutating
    noInc(){
        //do nothing
    }

    equals(other : TestSignal){
        return this.val == other.val
    }
}

class TestSource extends QPROPActor{
    TestSignal
    sig

    constructor(ownType : PubSubTag,parentTypes : Array<PubSubTag>,childTypes : Array<PubSubTag>,initVal,psServerAddress = "127.0.0.1",psServerPort = 8000){
        super(ownType,parentTypes,childTypes,psServerAddress,psServerPort)
        this.TestSignal = TestSignal
    }

    start(){
        console.log("Source started")
        this.sig = new this.TestSignal(this.libs.reflectOnActor())
        return this.sig
    }

    inc(){
        this.sig.inc()
        setTimeout(()=>{
            this.inc()
        },50)
    }
}

class A extends QPROPActor{
    start(source){
        console.log("A started")
        return this.libs.liftApp((s : TestSignal)=>{
            //console.log("Change in A with: " + s.val)
            return s.val + 1
        },source)
    }
}

class B extends QPROPActor{
    start(source){
        console.log("B started")
        return this.libs.liftApp((s : TestSignal)=>{
            //console.log("Change in B with: " + s.val)
            return s.val + 1
        },source)
    }
}

class TestSink extends QPROPActor{
    bType

    constructor(ownType : PubSubTag,parentTypes : Array<PubSubTag>,childTypes : Array<PubSubTag>,psServerAddress = "127.0.0.1",psServerPort = 8000){
        super(ownType,parentTypes,childTypes,psServerAddress,psServerPort)
        this.bType = bType
    }
    start(...args){
        console.log("Sink started")
        setTimeout(()=>{
            console.log("Adding dependency")
            this.addDependency(this.bType)
        },5000)
        return this.libs.lift((...argsC)=>{
            console.log("Change in sink: " + argsC)
        })(...args)
    }
}

let source : FarRef<TestSource> = app.spawnActor(TestSource,[sourcetype,[],[aType,bType]])
let a      = app.spawnActor(A,[aType,[sourcetype],[sinkType]])
let b      = app.spawnActor(B,[bType,[sourcetype],[]])
let sink   = app.spawnActor(TestSink,[sinkType,[aType],[]])
source.inc()*/
class TestSig extends Signal_1.Signal {
    constructor(mirr) {
        super(mirr);
        this.time = Date.now();
    }
    actualise() {
        this.time = Date.now();
    }
    equals(other) {
        return this.time == other.time;
    }
    getState() {
        return this.time;
    }
    setState(s) {
        this.time = s;
    }
}
__decorate([
    Signal_1.mutating
], TestSig.prototype, "actualise", null);
let sourceTag = new spiders_js_1.PubSubTag("source");
let sinkTag = new spiders_js_1.PubSubTag("sink");
class UseCaseApp extends spiders_js_1.Application {
    constructor() {
        super(new spiders_js_1.SpiderActorMirror(), "127.0.0.1", 8000);
        this.libs.setupPSServer();
    }
    dashDone() {
        this.kill();
        this.libs.setupPSServer();
        this.completeResolve();
    }
    onComplete() {
        return new Promise((resolve) => {
            this.completeResolve = resolve;
        });
    }
}
class SourceAct extends QPROPActor_1.QPROPActor {
    constructor() {
        super(sourceTag, [], [sinkTag]);
        this.TestSig = TestSig;
    }
    start() {
        console.log("Source start");
        let sig = new this.TestSig(this.libs.reflectOnActor());
        this.update(sig);
        return sig;
    }
    update(sig) {
        setTimeout(() => {
            sig.actualise();
            this.update(sig);
        }, 1000);
    }
}
class SinkAct extends QPROPActor_1.QPROPActor {
    constructor() {
        super(sinkTag, [sourceTag], []);
    }
    start(sig) {
        console.log("sink start");
        return this.libs.lift((s) => {
            console.log("Time taken: " + (Date.now() - s.time));
        })(sig);
    }
}
let app = new UseCaseApp();
let source = app.spawnActor(SourceAct);
let sink = app.spawnActor(SinkAct);
//# sourceMappingURL=temp.js.map