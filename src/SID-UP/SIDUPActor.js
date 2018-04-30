Object.defineProperty(exports, "__esModule", { value: true });
const spiders_js_1 = require("spiders.js");
const ReactiveMirror_1 = require("../ReactiveMirror");
const DijkstraScholten_1 = require("./DijkstraScholten");
const NodePulse_1 = require("./NodePulse");
const PulseState_1 = require("./PulseState");
const Mirror_1 = require("./Mirror");
const ReactiveActor_1 = require("../ReactiveActor");
//Purely used to capture changing of a local signal
//All the rest is implemented ad-hoc by SIDUP
class SIDUP extends spiders_js_1.SpiderIsolate {
    setMirror(actorMirror) {
        this.actorMirror = actorMirror;
    }
    registerSourceSignal(signal) { }
    registerDerivedSignal(signal) { }
    localSignalChanged(signal) {
        this.actorMirror.base.behaviourObject.internalSignalChanged(signal);
    }
    remoteSignalChanged(signal) { }
    signalSent(signal, target) { }
    signalReceived(signal, from) { }
}
exports.SIDUP = SIDUP;
class SIDUPActor extends ReactiveActor_1.ReactiveActor {
    constructor(ownType, admitterType, parents, isSink = false, psServerAddress = "127.0.0.1", psServerPort = 8000) {
        super(new ReactiveMirror_1.ReactiveMirror(new SIDUP()));
        this.DijkstraScholten = DijkstraScholten_1.DijkstraScholten;
        this.NodePulse = NodePulse_1.NodePulse;
        this.PulseState = PulseState_1.PulseState;
        this.Mirror = Mirror_1.Mirror;
        this.ownType = ownType;
        this.admitterType = admitterType;
        this.parentTypes = parents;
        this.isSink = isSink;
    }
    init() {
        this.termination = new this.DijkstraScholten();
        this.psClient = this.libs.setupPSClient(this.psServerAddress, this.psServerPort);
        this.parentRefs = [];
        this.childrenTypes = [];
        this.childrenRefs = [];
        this.setsReceived = 0;
        this.reachables = [];
        this.parentReachables = new Map();
        this.waitingResolvers = [];
        this.admittListeners = [];
        this.mirrors = new Map();
        this.inputSignals = new Map();
        this.ownPulse = new this.PulseState();
        this.inChange = false;
        this.psClient.publish(this, this.ownType);
        this.psClient.subscribe(this.admitterType).each((admitterRef) => {
            this.admitterRef = admitterRef;
            if (this.parentTypes.length == 0) {
                admitterRef.sourceRegister(this);
            }
            this.admittListeners.forEach((listener) => {
                listener();
            });
        });
        if (this.parentTypes.length == 0) {
            this.reachables.push(this.ownType.tagVal);
        }
        this.parentTypes.forEach((parentType) => {
            this.mirrors.set(parentType.tagVal, new this.Mirror(parentType, this.PulseState));
            this.psClient.subscribe(parentType).each((parentRef) => {
                this.parentRefs.push(parentRef);
                parentRef.getReachable(this, this.ownType).then((reachables) => {
                    this.setsReceived++;
                    reachables.forEach((reachable) => {
                        if (!this.reachables.includes(reachable)) {
                            this.reachables.push(reachable);
                        }
                    });
                    this.parentReachables.set(parentType.tagVal, reachables);
                    if (this.setsReceived == this.parentTypes.length) {
                        this.waitingResolvers.forEach((resolver) => {
                            resolver(this.reachables);
                        });
                        if (this.isSink) {
                            this.sendToAdmitter(() => {
                                this.admitterRef.sinkReady();
                            });
                        }
                    }
                });
            });
        });
    }
    sendToAdmitter(sendFunc) {
        if (this.admitterRef) {
            sendFunc();
        }
        else {
            this.admittListeners.push(sendFunc);
        }
    }
    reset() {
        this.ownPulse.setPending();
        this.parentTypes.forEach((parentType) => {
            let mirror = this.mirrors.get(parentType.tagVal);
            mirror.pulseValue.setPending();
        });
    }
    ////////////////////////////////////////
    // Calls made by actors extending this//
    ////////////////////////////////////////
    publishSignal(signal) {
        //Need to be sure that our list of children is complete, which is only the case of the graph is completely constructed
        let publish = () => {
            this.childrenRefs.forEach((childRef) => {
                childRef.receiveSignal(signal, this.ownType);
            });
        };
        let checkAdmitter = () => {
            this.admitterRef.graphReady().then(() => {
                publish();
            });
        };
        this.sendToAdmitter(checkAdmitter);
        this.publishedSignalId = signal.id;
    }
    ////////////////////////////////////////
    // Calls made by other SIDUP actors   //
    ////////////////////////////////////////
    receiveSignal(signal, from) {
        if (!this.inputSignals.has(from.tagVal)) {
            this.inputSignals.set(from.tagVal, signal);
            this.libs.reflectOnActor().newSource(signal);
        }
        if (this.inputSignals.size == this.parentTypes.length && Reflect.has(this, "start")) {
            let args = [];
            //Make sure args are provided in the same order as the parents are specified
            this.parentTypes.forEach((parentType, index) => {
                args[index] = this.inputSignals.get(parentType.tagVal);
            });
            this.start(...args);
        }
        if (this.isSink && this.inputSignals.size == this.parentTypes.length) {
            this.sendToAdmitter(() => {
                this.admitterRef.sinkStarted();
            });
        }
    }
    ack() {
        this.termination.newAckMessage();
    }
    getType() {
        return this.ownType;
    }
    getReachable(childRef, childType) {
        this.childrenTypes.push(childType);
        this.childrenRefs.push(childRef);
        if (this.setsReceived == this.parentTypes.length) {
            return this.reachables;
        }
        else {
            return new Promise((resolve) => {
                this.waitingResolvers.push(resolve);
            });
        }
    }
    newPulse(senderType, senderRef, pulse) {
        this.termination.newParentMessage(senderRef);
        let senderMirror = this.mirrors.get(senderType.tagVal);
        senderMirror.steadyValue = pulse.value;
        senderMirror.pulseValue = pulse.pulseState;
        let propagate = true;
        this.parentTypes.forEach((parenType) => {
            let parentMirror = this.mirrors.get(parenType.tagVal);
            if (parentMirror.pulseValue.isPending()) {
                let parentReachables = this.parentReachables.get(parenType.tagVal);
                let commonSources = parentReachables.filter((parentReachable) => {
                    return pulse.sourcesChanged.includes(parentReachable);
                });
                if (commonSources.length > 0) {
                    propagate = false;
                }
            }
        });
        if (propagate) {
            let anyChanged = false;
            let values = [];
            this.parentTypes.forEach((parentType) => {
                let mirror = this.mirrors.get(parentType.tagVal);
                values.push(mirror.steadyValue);
                if (mirror.pulseValue.isChanged()) {
                    anyChanged = true;
                }
            });
            //No need to send actual pulse here. By changing the internal signal the "propagate" method will eventually be triggered
            this.lastTriggerPulse = pulse;
            if (anyChanged) {
                this.ownPulse.setChanged();
                //(this.libs.reflectOnActor() as ReactiveMirror).sourceChanged(pulse.value)
                this.libs.reflectOnActor().sourcesChanged(values);
            }
            else {
                this.ownPulse.setUnchanged();
                //No need to let local graph propagate (given that there are no changes, propagate NO_CHANGE to all distributed children
                this.propagateNoChange();
            }
            this.reset();
            if (this.childrenRefs.length == 0) {
                this.termination.nodeTerminated();
            }
        }
    }
    updateReachable(isNewParent, senderRef, senderType, reachables, parentSignal) {
        this.termination.newParentMessage(senderRef);
        if (isNewParent) {
            if (this.parentReachables.has(senderType.tagVal)) {
                throw new Error("New parent already exists");
            }
            else {
                this.mirrors.set(senderType.tagVal, new this.Mirror(senderType, this.PulseState));
                this.parentTypes.push(senderType);
                this.parentRefs.push(senderRef);
                this.parentReachables.set(senderType.tagVal, reachables);
                this.inputSignals.forEach((iSignal) => {
                    let deps = this.libs.reflectOnActor().localGraph.getDependants(iSignal.id);
                    deps.forEach((dependant) => {
                        this.libs.reflectOnActor().localGraph.newSource(parentSignal);
                        this.libs.reflectOnActor().localGraph.addDependency(dependant.id, parentSignal.id);
                    });
                });
                this.inputSignals.set(senderType.tagVal, parentSignal);
            }
        }
        else {
            let previousReachables = this.parentReachables.get(senderType.tagVal);
            reachables.forEach((reachable) => {
                if (!previousReachables.includes(reachable)) {
                    previousReachables.push(reachable);
                }
            });
        }
        reachables.forEach((reachable) => {
            if (!this.reachables.includes(reachable)) {
                this.reachables.push(reachable);
            }
        });
        this.childrenRefs.forEach((childRef) => {
            this.termination.newChildMessage();
            childRef.updateReachable(false, this, this.ownType, this.reachables);
        });
        if (this.childrenRefs.length == 0) {
            this.termination.nodeTerminated();
        }
    }
    addDependency(sender, changePulse) {
        this.termination.newParentMessage(sender);
        let from = changePulse.fromType.tagVal;
        let to = changePulse.toType.tagVal;
        if (from == this.ownType.tagVal && !this.inChange) {
            let childTypes = this.childrenTypes.map((childType) => {
                return childType.tagVal;
            });
            if (childTypes.includes(to)) {
                throw new Error("Adding dependency which already exists");
            }
            else {
                this.childrenTypes.push(changePulse.toType);
                this.inChange = true;
                this.psClient.subscribe(changePulse.toType).once((newChildRef) => {
                    this.childrenRefs.push(newChildRef);
                    this.termination.newChildMessage();
                    newChildRef.updateReachable(true, this, this.ownType, this.reachables, this.lastVal);
                });
            }
        }
        else if (!this.inChange) {
            this.inChange = true;
            this.childrenRefs.forEach((childRef) => {
                this.termination.newChildMessage();
                childRef.addDependency(this, changePulse);
            });
        }
        if (this.childrenRefs.length == 0 && !(to == this.ownType.tagVal)) {
            this.termination.nodeTerminated();
        }
    }
    //////////////////////////////////////////
    // Calls made by dist glitch prevention //
    //////////////////////////////////////////
    //No change can only be called for non-source nodes
    propagateNoChange() {
        let pulse;
        if (this.parentTypes.length == 0) {
            pulse = new this.NodePulse(this.ownPulse, [this.ownType.tagVal], this.lastVal);
        }
        else {
            pulse = new this.NodePulse(this.ownPulse, this.lastTriggerPulse.sourcesChanged, this.lastVal);
        }
        this.ownPulse.setUnchanged();
        this.childrenRefs.forEach((childRef) => {
            this.termination.newChildMessage();
            childRef.newPulse(this.ownType, this, pulse);
        });
        this.reset();
    }
    propagateChange(signal) {
        let propagateToChildren = (isDistSource, newVal = signal) => {
            let newPulse;
            if (isDistSource) {
                this.lastVal = this.libs.clone(signal);
                this.ownPulse.setChanged();
                newPulse = new this.NodePulse(this.ownPulse, [this.ownType.tagVal], newVal);
            }
            else {
                this.lastVal = this.libs.clone(signal);
                this.ownPulse.setChanged();
                newPulse = new this.NodePulse(this.ownPulse, this.lastTriggerPulse.sourcesChanged, newVal);
            }
            this.childrenRefs.forEach((childRef) => {
                this.termination.newChildMessage();
                childRef.newPulse(this.ownType, this, newPulse);
            });
        };
        //Check whether this node is at the start of the distributed dependency graph
        //In which case it first needs to ask "permission" to propagate from the admitter
        if (this.parentTypes.length == 0) {
            let askAdmitter = () => {
                this.admitterRef.sourceChanged(signal).then((ret) => {
                    //This code is only triggered after accept from admitter
                    this.termination.newParentMessage(this.admitterRef);
                    if (ret == "ok") {
                        propagateToChildren(true);
                    }
                    else {
                        propagateToChildren(true, ret);
                    }
                });
            };
            this.sendToAdmitter(askAdmitter);
        }
        else {
            propagateToChildren(false);
        }
    }
    internalSignalChanged(signal) {
        if (signal.id == this.publishedSignalId) {
            if (this.lastVal) {
                if (signal.equals(this.lastVal)) {
                    this.propagateNoChange();
                }
                else {
                    this.propagateChange(signal);
                }
            }
            else {
                this.propagateChange(signal);
            }
        }
    }
    //Used for debugging purposes
    debug() {
        console.log("<!!!> Info for: " + this.ownType.tagVal + " <!!!>");
        console.log("Reachable by: " + this.reachables);
        console.log("Parents: " + this.parentTypes.map((type) => { return type.tagVal; }));
        console.log("Children: " + this.childrenTypes.map((type) => { return type.tagVal; }));
    }
}
exports.SIDUPActor = SIDUPActor;
//# sourceMappingURL=SIDUPActor.js.map