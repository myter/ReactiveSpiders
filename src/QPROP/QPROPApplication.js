Object.defineProperty(exports, "__esModule", { value: true });
const ReactiveMirror_1 = require("../ReactiveMirror");
const Signal_1 = require("../Signal");
const PropagationValue_1 = require("./PropagationValue");
class QPROPApplication {
    constructor(host, ownType, parentTypes, childTypes, myAddress, myPort, psServerAddress = "127.0.0.1", psServerPort = 8000) {
        this.host = host;
        this.thisDir = __dirname;
        this.ownType = ownType;
        this.parentTypes = parentTypes;
        this.childTypes = childTypes;
        this.serverAddress = psServerAddress;
        this.serverPort = psServerPort;
        this.PropagationValue = PropagationValue_1.PropagationValue;
        this.DerivedSignal = Signal_1.DerivedSignal;
        this._REMOTE_CHANGE_ = ReactiveMirror_1._REMOTE_CHANGE_;
        this.nodes = new Map();
        this.sources = [];
        this.dependencies = new Map();
        this.parents = new Map();
    }
    init() {
        Array.prototype.flatMap = function (lambda) {
            return Array.prototype.concat.apply([], this.map(lambda));
        };
        this.childRefs = [];
        this.parentRefs = [];
        this.sourcesReceived = 0;
        this.startsReceived = 0;
        this.clock = 0;
        this.allChildListeners = [];
        this.allParentListeners = [];
        this.I = new Map();
        this.S = new Map();
        this.inputSignals = new Map();
        this.ready = false;
        this.readyListeners = [];
        this.inChange = false;
        this.changeDoneListeners = [];
        this.brittle = new Map();
        this.psClient = this.host.libs.setupPSClient(this.serverAddress, this.serverPort);
        this.lastProp = new this.PropagationValue(this.ownType, null, new Map(), this.clock);
        if (this.amSource()) {
            this.lastProp.value = this.invokeStart();
        }
        this.childTypes.forEach((childType) => {
            this.psClient.subscribe(childType).each((childRef) => {
                this.childRefs.push(childRef);
                if (this.amSource()) {
                    this.lastProp.sClocks.set(this.ownType.tagVal, this.clock);
                    childRef.getSources([this.ownType], this.lastProp);
                }
                if (this.gotAllChildren()) {
                    this.flushChildMessages();
                }
            });
        });
        this.parentTypes.forEach((parentType) => {
            this.psClient.subscribe(parentType).each((parentRef) => {
                this.parentRefs.push(parentRef);
                if (this.gotAllParents()) {
                    this.flushParentMessages();
                }
            });
        });
        this.psClient.publish(this, this.ownType);
    }
    ////////////////////////////////////////
    // Helper Functions                   //
    ////////////////////////////////////////
    fromPropValArray(propValArr) {
        return new this.PropagationValue(new this.host.libs.PubSubTag(propValArr[0]), propValArr[1], propValArr[2], propValArr[3], propValArr[4]);
    }
    amSource() {
        return this.parentTypes.length == 0;
    }
    amSink() {
        return this.childTypes.length == 0;
    }
    gotAllSources() {
        return this.sourcesReceived == this.parentTypes.length;
    }
    gotAllStarts() {
        return this.startsReceived == this.childTypes.length;
    }
    gotAllChildren() {
        return this.childRefs.length == this.childTypes.length;
    }
    gotAllParents() {
        return this.parentRefs.length == this.parentTypes.length;
    }
    sendToAllChildren(sendFunc) {
        if (this.gotAllChildren()) {
            sendFunc();
        }
        else {
            this.allChildListeners.push(sendFunc);
        }
    }
    flushChildMessages() {
        this.allChildListeners.forEach((sendFunc) => {
            sendFunc();
        });
    }
    sendToAllParents(sendFunc) {
        if (this.gotAllParents()) {
            sendFunc();
        }
        else {
            this.allParentListeners.push(sendFunc);
        }
    }
    flushParentMessages() {
        this.allParentListeners.forEach((sendFunc) => {
            sendFunc();
        });
    }
    invokeStart() {
        let args = [];
        //Make sure args are provided in the same order as the parents are specified
        this.parentTypes.forEach((parentType, index) => {
            args[index] = this.inputSignals.get(parentType.tagVal);
        });
        let returnSig = this.host.start(...args);
        this.publishedSignalId = returnSig.id;
        return returnSig;
    }
    flushReady() {
        this.readyListeners.forEach((readyList) => {
            readyList();
        });
    }
    nextChange() {
        if (this.changeDoneListeners.length > 0) {
            let perform = this.changeDoneListeners.splice(0, 1)[0];
            perform();
        }
    }
    //xs >>= k = join $ fmap k xs
    //xs :: [a]k  ::  a->[b]
    // oneOf :: M a -> a -> M b -> M b
    oneOf(xs, k) {
        return xs.flatMap(k);
    }
    guard(x) {
        if (x) {
            return [null];
        }
        else {
            return [];
        }
    }
    getAllArgs(tables) {
        let loop = (index, args) => {
            if (index < tables.length) {
                return this.oneOf(tables[index], (arg) => {
                    return loop(index + 1, args.concat(arg));
                });
            }
            else {
                return [args];
            }
        };
        return loop(0, []);
    }
    getCommonSources(parentType1, parentType2) {
        let ret = [];
        this.S.forEach((parents, source) => {
            let p = parents.map((parent) => { return parent.tagVal; });
            if (p.includes(parentType1.tagVal) && p.includes(parentType2.tagVal)) {
                ret.push(source);
            }
        });
        return ret;
    }
    getSourcesFor(parentType) {
        let ret = [];
        this.S.forEach((parents, source) => {
            let p = parents.map((parent) => { return parent.tagVal; });
            if (p.includes(parentType)) {
                ret.push(source);
            }
        });
        return ret;
    }
    getMatchArgs(allArgs) {
        return this.oneOf(allArgs, (args) => {
            let okSourceClock = true;
            this.oneOf(args, (argDP1) => {
                this.oneOf(args, (argDP2) => {
                    this.oneOf(this.guard(!(argDP1.from.equals(argDP2.from))), () => {
                        let common = this.getCommonSources(argDP1.from, argDP2.from);
                        common.forEach((commonSource) => {
                            okSourceClock = okSourceClock && (argDP1.sClocks.get(commonSource) == argDP2.sClocks.get(commonSource));
                        });
                    });
                });
            });
            return this.oneOf(this.guard(okSourceClock), () => {
                return [args];
            });
        });
    }
    addToI(parent, prop) {
        if (this.I.has(parent)) {
            let prevProps = this.I.get(parent);
            this.I.set(parent, prevProps.concat(prop));
        }
        else {
            this.I.set(parent, [prop]);
        }
    }
    ////////////////////////////////////////
    // Calls made by other QPROP nodes    //
    ////////////////////////////////////////
    getSources(sources, initProp) {
        let fromParent = initProp.from;
        this.I.set(fromParent.tagVal, [initProp]);
        this.sourcesReceived += 1;
        this.inputSignals.set(fromParent.tagVal, initProp.value);
        this.newSource(initProp.value);
        sources.forEach((source) => {
            if (this.S.has(source.tagVal)) {
                this.S.get(source.tagVal).push(fromParent);
            }
            else {
                this.S.set(source.tagVal, [fromParent]);
            }
        });
        if (this.gotAllSources()) {
            let allSources = [];
            let sourceClocks = new Map();
            this.S.forEach((_, source) => {
                let tag = new this.host.libs.PubSubTag(source);
                allSources.push(tag);
                sourceClocks.set(source, 0);
            });
            this.lastProp.value = this.invokeStart();
            this.lastProp.sClocks = sourceClocks;
            if (this.amSink()) {
                let send = () => {
                    this.parentRefs.forEach((ref) => {
                        ref.getStart();
                    });
                };
                this.sendToAllParents(send);
                this.ready = true;
                this.flushReady();
            }
            else {
                let send = () => {
                    this.childRefs.forEach((ref) => {
                        ref.getSources(allSources, this.lastProp);
                    });
                };
                this.sendToAllChildren(send);
            }
        }
    }
    getStart() {
        this.startsReceived += 1;
        if (this.gotAllStarts()) {
            let send = () => {
                this.parentRefs.forEach((ref) => {
                    ref.getStart();
                });
            };
            this.sendToAllParents(send);
            this.ready = true;
            this.flushReady();
        }
    }
    prePropagation(fromm, value, sClocks, fClock, isOptimised) {
        let prop = new this.PropagationValue(fromm, value, new Map(JSON.parse(sClocks)), fClock, isOptimised);
        //let prop        = this.fromPropValArray(propArr)
        let from = prop.from.tagVal;
        if (this.brittle.size == 0) {
            this.addToI(from, prop);
            return this.newPropagation(prop);
        }
        else if (this.brittle.has(from)) {
            let prevProps = this.brittle.get(from);
            this.brittle.set(from, prevProps.concat(prop));
        }
        else {
            this.addToI(from, prop);
            let sources = this.getSourcesFor(from);
            let cont = true;
            sources.forEach((source) => {
                let parents = this.S.get(source);
                let brittleCousins = parents.filter((parent) => { return this.brittle.has(parent.tagVal); });
                brittleCousins.forEach((br) => {
                    cont = cont && (this.brittle.get(br.tagVal).length == 0);
                });
            });
            if (cont) {
                return this.newPropagation(prop);
            }
        }
        this.brittle.forEach((brittleProps, br) => {
            let sources = this.getSourcesFor(br);
            sources.forEach((source) => {
                let preds = this.S.get(source);
                let check = preds.filter((pred) => {
                    if (pred.tagVal == br) {
                        return false;
                    }
                    else {
                        let predFirst = this.I.get(pred.tagVal)[0];
                        let brFirst = this.brittle.get(br)[0];
                        return (predFirst.sClocks.get(source) - brFirst.sClocks.get(source)) > 1;
                    }
                });
                if (check.length == 0) {
                    if (this.I.has(br)) {
                        this.addToI(br, this.brittle.get(br));
                    }
                    else {
                        this.I.set(br, this.brittle.get(br));
                    }
                    this.brittle.delete(br);
                    return this.newPropagation(prop);
                }
            });
        });
    }
    newPropagation(prop) {
        let from = prop.from.tagVal;
        let is = [];
        this.I.forEach((vals, parent) => {
            if (parent != from) {
                is.push(vals);
            }
        });
        is.push([prop]);
        //Find cross product of new propagation value and all other values
        let allArgs = this.getAllArgs(is);
        let matches = this.getMatchArgs(allArgs);
        matches.forEach((match) => {
            this.lastMatch = match;
            let values = match.map((arg) => {
                if (arg.isOptimised) {
                    let sig = this.inputSignals.get(arg.from.tagVal);
                    sig.setState(arg.value);
                    return sig;
                }
                else {
                    return arg.value;
                }
            });
            this.sourcesChanged(values);
        });
        if (this.lastMatch) {
            this.lastMatch.forEach((pv) => {
                let vals = this.I.get(pv.from.tagVal);
                vals = vals.filter((pvv) => { return pvv.fClock >= pv.fClock; });
                this.I.set(pv.from.tagVal, vals);
            });
        }
    }
    //////////////////////////////////////////
    // Calls made by dist glitch prevention //
    //////////////////////////////////////////
    //Internal propagation starts in "newPropagation", the reactive mirror catches the end of the internal propagation and invokes this method which will ensure that distributed propagation continues
    internalSignalChanged(signal) {
        if (signal.id == this.publishedSignalId) {
            if (this.ready) {
                this.clock++;
                let clocks = new Map();
                if (this.amSource()) {
                    clocks.set(this.ownType.tagVal, this.clock);
                }
                else {
                    this.lastMatch.forEach((pv) => {
                        pv.sClocks.forEach((clockVal, source) => {
                            clocks.set(source, clockVal);
                        });
                    });
                }
                this.lastProp = new this.PropagationValue(this.ownType, signal, clocks, this.clock);
                this.sendToAllChildren(() => {
                    this.childRefs.forEach((child) => {
                        child.prePropagation(this.ownType, signal.getState(), JSON.stringify([...clocks]), this.clock, true);
                    });
                });
            }
            else {
                let sigClone = this.host.libs.clone(signal);
                this.readyListeners.push(() => {
                    this.internalSignalChanged(sigClone);
                });
            }
        }
    }
    ////////////////////////////////////////
    // QPROPD API                         //
    ////////////////////////////////////////
    newChild(childType, childRef) {
        this.childTypes.push(childType);
        this.childRefs.push(childRef);
        if (this.amSource()) {
            return [this.lastProp, [this.ownType.tagVal]];
        }
        else {
            return [this.lastProp, Array.from(this.S.keys())];
        }
    }
    addDependency(toParent) {
        if (this.inChange) {
            this.changeDoneListeners.push(() => {
                this.addDependency(toParent);
            });
        }
        else {
            this.inChange = true;
            this.psClient.subscribe(toParent).once((newParentRef) => {
                newParentRef.newChild(this.ownType, this).then(([lastProp, sources]) => {
                    let knownSources = sources.filter((source) => { return this.S.has(source); });
                    if (knownSources.length == 0) {
                        this.addToI(toParent.tagVal, lastProp);
                    }
                    this.addSources(toParent, sources).then(() => {
                        this.parentTypes.push(toParent);
                        this.parentRefs.push(newParentRef);
                        this.I.set(toParent.tagVal, []);
                        this.inputSignals.forEach((iSignal) => {
                            let deps = this.getDependants(iSignal.id);
                            deps.forEach((dependant) => {
                                this.newSource(lastProp.value);
                                this.addDependencyG(dependant.id, lastProp.value.id);
                            });
                        });
                        this.inputSignals.set(toParent.tagVal, lastProp.value);
                        this.inChange = false;
                        this.nextChange();
                    });
                });
            });
        }
    }
    addSources(from, sources) {
        sources.forEach((source) => {
            if (this.S.has(source)) {
                this.S.get(source).push(from);
                this.brittle.set(from.tagVal, []);
            }
            else {
                this.S.set(source, [from]);
            }
        });
        let childPromises = this.childRefs.map((child) => { return child.addSources(this.ownType, sources); });
        return Promise.all(childPromises);
    }
    /////////////////////////////////////////////////////////
    // Local Reactivity                                    //
    /////////////////////////////////////////////////////////
    lift(f) {
        return (...args) => {
            let returnSig = new this.DerivedSignal(f, this);
            this.newNode(returnSig);
            args.forEach((arg, index) => {
                if (arg.isSignal) {
                    this.addDependencyG(returnSig.id, arg.id);
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
        let parentValues = this.getParents(node.id).map((parent) => {
            if (parent.isDerived) {
                return parent.lastVal;
            }
            else {
                return parent;
            }
        });
        node.update(parentValues);
        this.internalSignalChanged(node);
        this.getDependants(node.id).forEach((dep) => {
            this.updateNode(dep);
        });
    }
    newSource(signal) {
        this.newSourceG(signal);
    }
    sourceChanged(source) {
        this.updateSource(source);
        this.internalSignalChanged(source);
        this.getDependants(source.id).forEach((dep) => {
            this.updateNode(dep);
        });
    }
    sourcesChanged(sources) {
        this.updateSources(sources);
        sources.forEach(this.internalSignalChanged.bind(this));
        let depIds = [];
        let deps = [];
        sources.forEach((source) => {
            let toAdd = this.getDependants(source.id);
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
    newSourceG(source) {
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
    addDependencyG(fromId, toId) {
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
exports.QPROPApplication = QPROPApplication;
//# sourceMappingURL=QPROPApplication.js.map