Object.defineProperty(exports, "__esModule", { value: true });
const spiders_js_1 = require("spiders.js");
const DijkstraScholten_1 = require("./DijkstraScholten");
const DependencyChangePulse_1 = require("./DependencyChangePulse");
class SIDUPAdmitter extends spiders_js_1.Actor {
    constructor(ownType, sources, sinks, psServerAddress = "127.0.0.1", psServerPort = 8000) {
        super();
        this.ownType = ownType;
        this.Dijkstra = DijkstraScholten_1.DijkstraScholten;
        this.DependencyChangePulse = DependencyChangePulse_1.DependencyChangePulse;
        this.waitingChanges = [];
        this.sinks = sinks;
        this.sources = sources;
        this.sourceRefs = [];
        this.sinksReady = 0;
        this.sinksStarted = 0;
        this.readyResolvers = [];
        this.sourceResolvers = [];
        this.psServerAdd = psServerAddress;
        this.psServerPort = psServerPort;
    }
    init() {
        this.termination = new this.Dijkstra(() => { this.returnedToIdle(); });
        this.psClient = this.libs.setupPSClient(this.psServerAdd, this.psServerPort);
        this.psClient.publish(this, this.ownType);
        this.idleListener = () => { };
        this.changeListener = () => { };
        this.admitListener = () => { };
    }
    returnedToIdle() {
        this.idleListener();
        if (this.waitingChanges.length > 0) {
            let toResolve = this.waitingChanges[0];
            this.waitingChanges = this.waitingChanges.slice(1, this.waitingChanges.length);
            toResolve("ok");
            this.termination.newChildMessage();
        }
    }
    sourceChanged(withValue) {
        this.admitListener();
        if (this.termination.isIdle() && this.sinksStarted == this.sinks) {
            this.termination.newChildMessage();
            if (this.changeListener) {
                return this.changeListener(withValue);
            }
            else {
                return "ok";
            }
        }
        else {
            return new Promise((resolve) => {
                let f = () => {
                    if (this.changeListener) {
                        resolve(this.changeListener(withValue));
                    }
                    else {
                        resolve("ok");
                    }
                };
                this.waitingChanges.push(f);
            });
        }
    }
    ack() {
        this.termination.newAckMessage();
    }
    sinkReady() {
        this.sinksReady++;
        if (this.sinksReady == this.sinks) {
            console.log("graph has been constructed");
            this.readyResolvers.forEach((resolver) => {
                resolver("ok");
            });
            this.readyResolvers = [];
        }
    }
    sinkStarted() {
        this.sinksStarted++;
        if (this.sinksStarted == this.sinks) {
            console.log("Graph started");
            //There might already be changes buffered
            this.returnedToIdle();
        }
    }
    sourceRegister(sourceRef) {
        this.sourceRefs.push(sourceRef);
        if (this.sourceRefs.length == this.sources) {
            this.sourceResolvers.forEach((resolver) => {
                resolver();
            });
        }
    }
    graphReady() {
        if (this.sinksReady == this.sinks) {
            return "ok";
        }
        else {
            return new Promise((resolve) => {
                this.readyResolvers.push(resolve);
            });
        }
    }
    addDependency(fromType, toType) {
        let initiateChange = () => {
            this.sourceRefs.forEach((sourceRef) => {
                this.termination.newChildMessage();
                sourceRef.addDependency(this, new this.DependencyChangePulse(fromType, toType));
            });
        };
        if (this.termination.isIdle() && this.sinksStarted == this.sinks) {
            initiateChange();
        }
        else {
            this.waitingChanges.push(initiateChange);
        }
    }
}
exports.SIDUPAdmitter = SIDUPAdmitter;
//# sourceMappingURL=SIDUPAdmitter.js.map