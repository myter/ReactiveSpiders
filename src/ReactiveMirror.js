Object.defineProperty(exports, "__esModule", { value: true });
const spiders_js_1 = require("spiders.js");
const Signal_1 = require("./Signal");
exports._REMOTE_CHANGE_ = "_REMOTE_CHANGE_";
class LocalDependencyGraph extends spiders_js_1.SpiderIsolate {
    constructor() {
        super();
        this.nodes = new Map();
        this.sources = [];
        this.dependencies = new Map();
        this.parents = new Map();
    }
    newSource(source) {
        this.sources.push(source.id);
        this.nodes.set(source.id, source);
        this.dependencies.set(source.id, []);
        this.parents.set(source.id, []);
    }
    updateSource(source) {
        this.nodes.set(source.id, source);
    }
    updateSources(sources) {
        sources.forEach(this.updateSource.bind(this));
    }
    newNode(node) {
        this.nodes.set(node.id, node);
        this.dependencies.set(node.id, []);
        this.parents.set(node.id, []);
    }
    addDependency(fromId, toId) {
        this.dependencies.get(toId).push(fromId);
        this.parents.get(fromId).push(toId);
    }
    getDependants(forId) {
        if (!this.dependencies.has(forId)) {
            return [];
        }
        else {
            return this.dependencies.get(forId).map((depId) => {
                return this.nodes.get(depId);
            });
        }
    }
    getParents(forId) {
        return this.parents.get(forId).map((pId) => {
            return this.nodes.get(pId);
        });
    }
}
class ReactiveMirror extends spiders_js_1.SpiderActorMirror {
    constructor(distGlitchPreventer) {
        super();
        this.localGraph = new LocalDependencyGraph();
        this.DerivedSignal = Signal_1.DerivedSignal;
        this.distGlitchPrev = distGlitchPreventer;
        this._REMOTE_CHANGE_ = exports._REMOTE_CHANGE_;
    }
    /////////////////////////////////////////////////////////
    // Local Reactivity                                    //
    /////////////////////////////////////////////////////////
    lift(f) {
        return (...args) => {
            let returnSig = new this.DerivedSignal(f, this);
            this.localGraph.newNode(returnSig);
            args.forEach((arg, index) => {
                if (arg.isSignal) {
                    this.localGraph.addDependency(returnSig.id, arg.id);
                }
                else {
                    //TODO
                }
            });
            return returnSig;
        };
    }
    liftApp(f, sig) {
        return this.lift(f)(sig);
    }
    containsSignal(args) {
        return args.filter((arg, i) => {
            //Need to explicitly return true or false in filter (i.e. undefined not considered as false)
            //Also, checking for == true, am I stupid ? Yes and no, could be that arg is a far ref in which case arg.isSignal returns a promise which apparently is true-ish ?
            if (arg) {
                if (arg.isSignal == true) {
                    return true;
                }
                else {
                    return false;
                }
            }
            else {
                return false;
            }
        });
    }
    updateNode(node) {
        let parentValues = this.localGraph.getParents(node.id).map((parent) => {
            if (parent.isDerived) {
                return parent.lastVal;
            }
            else {
                return parent;
            }
        });
        node.update(parentValues);
        this.distGlitchPrev.localSignalChanged(node);
        this.localGraph.getDependants(node.id).forEach((dep) => {
            this.updateNode(dep);
        });
    }
    newSource(signal) {
        this.localGraph.newSource(signal);
    }
    sourceChanged(source) {
        this.localGraph.updateSource(source);
        this.distGlitchPrev.localSignalChanged(source);
        this.localGraph.getDependants(source.id).forEach((dep) => {
            this.updateNode(dep);
        });
    }
    sourcesChanged(sources) {
        this.localGraph.updateSources(sources);
        sources.forEach(this.distGlitchPrev.localSignalChanged);
        let depIds = [];
        let deps = [];
        sources.forEach((source) => {
            let toAdd = this.localGraph.getDependants(source.id);
            toAdd.forEach((dep) => {
                if (!(depIds.includes(dep.id))) {
                    deps.push(dep);
                    depIds.push(dep.id);
                }
            });
        });
        deps.forEach((dep) => {
            this.updateNode(dep);
        });
    }
    /////////////////////////////////////////////////////////
    // Methods overwritten from default actor mirror       //
    /////////////////////////////////////////////////////////
    initialise(stdLib, appActor, parentRef) {
        stdLib.lift = this.lift.bind(this);
        stdLib.liftApp = this.liftApp.bind(this);
        this.distGlitchPrev.setMirror(this);
        super.initialise(stdLib, appActor, parentRef);
    }
    sendInvocation(target, methodName, args, ...rest) {
        if (methodName != this._REMOTE_CHANGE_) {
            let signals = this.containsSignal(args);
            signals.forEach((signal) => {
                this.distGlitchPrev.signalSent(signal, target);
            });
        }
        return super.sendInvocation(target, methodName, args, ...rest);
    }
    receiveInvocation(sender, targetObject, methodName, args, ...rest) {
        if (methodName == this._REMOTE_CHANGE_) {
            this.distGlitchPrev.remoteSignalChanged(args[0]);
        }
        else {
            let signals = this.containsSignal(args);
            if (signals.length > 0) {
                signals.forEach((signal) => {
                    this.distGlitchPrev.signalReceived(signal, sender);
                });
            }
            return super.receiveInvocation(sender, targetObject, methodName, args, ...rest);
        }
    }
}
exports.ReactiveMirror = ReactiveMirror;
//# sourceMappingURL=ReactiveMirror.js.map