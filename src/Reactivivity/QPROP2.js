var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const signal_1 = require("./signal");
const serialisation_1 = require("../serialisation");
class SourceIsolate {
    constructor(sources) {
        this[serialisation_1.IsolateContainer.checkIsolateFuncKey] = true;
        this.sources = sources;
    }
}
class QPROPSourceSignal extends signal_1.SignalObject {
    change(parentVals) {
        this.parentVals = parentVals;
    }
}
__decorate([
    signal_1.mutator
], QPROPSourceSignal.prototype, "change", null);
exports.QPROPSourceSignal = QPROPSourceSignal;
class PropagationValue2 {
    constructor(from, value, sClocks, fClock) {
        this[serialisation_1.IsolateContainer.checkIsolateFuncKey] = true;
        this.from = from;
        this.value = value;
        this.sClocks = sClocks;
        this.fClock = fClock;
    }
    asString() {
        return "< " + this.from.tagVal + " , " + JSON.stringify([...this.sClocks]) + " , " + this.fClock + " >";
    }
    serMap() {
        this.sClocks = JSON.stringify([...this.sClocks]);
    }
    deSerMap() {
        this.sClocks = new Map(JSON.parse(this.sClocks));
    }
}
exports.PropagationValue2 = PropagationValue2;
class DependencyChange {
    constructor(fromType, toType) {
        this[serialisation_1.IsolateContainer.checkIsolateFuncKey] = true;
        this.fromType = fromType;
        this.toType = toType;
    }
}
exports.DependencyChange = DependencyChange;
class QPROP2Node {
    constructor(ownType, parentTypes, childTypes, hostActor, dependencyChangeTag) {
        this.hostActor = hostActor;
        this.ownType = ownType;
        this.parentTypes = parentTypes;
        this.childTypes = childTypes;
        this.ownSignal = new QPROPSourceSignal();
        this.dependencyChangeTag = dependencyChangeTag;
        this.init();
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
        this.ready = false;
        this.readyListeners = [];
        this.inChange = false;
        this.changeDoneListeners = [];
        this.brittle = new Map();
        this.lastProp = new PropagationValue2(this.ownType, null, new Map(), this.clock);
        if (this.amSource()) {
            //this.lastProp.value = this.invokeStart()
            this.lastProp.sClocks.set(this.ownType.tagVal, this.clock);
        }
        this.childTypes.forEach((childType) => {
            this.hostActor.subscribe(childType).once((childRef) => {
                this.childRefs.push(childRef);
                if (this.amSource() && this.gotAllChildren()) {
                    this.lastProp.serMap();
                    this.childRefs.forEach((ref) => {
                        ref.getSources([this.ownType], this.lastProp);
                    });
                    this.lastProp.deSerMap();
                }
                if (this.gotAllChildren()) {
                    this.flushChildMessages();
                }
            });
        });
        this.parentTypes.forEach((parentType) => {
            this.hostActor.subscribe(parentType).once((parentRef) => {
                this.parentRefs.push(parentRef);
                if (this.gotAllParents()) {
                    this.flushParentMessages();
                }
            });
        });
        this.hostActor.publish(this, this.ownType);
        this.hostActor.subscribe(this.dependencyChangeTag).each((change) => {
            //console.log("Dependency addition detected")
            if (change.toType.tagVal == this.ownType.tagVal && !this.contains(this.parentTypes, change.fromType)) {
                this.addDependency(change.fromType);
            }
        });
    }
    ////////////////////////////////////////
    // Helper Functions                   //
    ////////////////////////////////////////
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
    contains(typeArray, targettype) {
        return typeArray.filter((type) => {
            return type.tagVal == targettype.tagVal;
        }).length > 0;
    }
    ////////////////////////////////////////
    // Calls made by other QPROP nodes    //
    ////////////////////////////////////////
    getSources(sources, initProp) {
        initProp.deSerMap();
        let fromParent = initProp.from;
        this.I.set(fromParent.tagVal, [initProp]);
        this.sourcesReceived += 1;
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
                let tag = this.hostActor.newPSTag(source);
                allSources.push(tag);
                sourceClocks.set(source, 0);
            });
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
                    this.lastProp.serMap();
                    this.childRefs.forEach((ref) => {
                        ref.getSources(allSources, this.lastProp);
                    });
                    this.lastProp.deSerMap();
                };
                this.sendToAllChildren(send);
            }
        }
    }
    getStart() {
        this.startsReceived += 1;
        if (this.gotAllStarts()) {
            console.log(this.ownType.tagVal + " got all starts ! ");
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
    prePropagation(prop) {
        prop.deSerMap();
        if (!this.inChange) {
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
                let ok = true;
                sources.forEach((source) => {
                    let preds = this.S.get(source);
                    let check = preds.filter((pred) => {
                        if (pred.tagVal == br) {
                            return false;
                        }
                        else {
                            if (this.brittle.has(br)) {
                                if (this.brittle.get(br).length > 0) {
                                    let predFirst = this.I.get(pred.tagVal)[0];
                                    let brFirst = this.brittle.get(br)[0];
                                    return (predFirst.sClocks.get(source) - brFirst.sClocks.get(source)) > 1;
                                }
                                else {
                                    return false;
                                }
                            }
                            else {
                                return false;
                            }
                        }
                    });
                    ok = ok && check.length == 0;
                });
                if (ok) {
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
        }
        else {
            this.changeDoneListeners.push(() => {
                //TODO make sure seriaslisation is correct here
                this.prePropagation(prop);
            });
        }
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
        //console.log("Args for " + this.ownType.tagVal + "  = " + allArgs.length)
        //console.log("Matches: " + matches.length)
        if (this.ownType.tagVal == "26") {
            //console.log("All : " + allArgs.length)
            //console.log("Matches: " + matches.length)
            /*let one = this.I.get("57")
            let two = this.I.get("56")
            let three = this.I.get("54")
            let four = this.I.get("58")
            console.log("Length of 57 I = " + one.length)
            console.log("Length of 56 I = " + two.length)
            console.log("Length of 54 I = " + three.length)
            console.log("Length of 58 I = " + four.length)
            console.log("   ")*/
            /*allArgs.forEach((arg : Array<PropagationValue2>)=>{
                console.log("<PRINTING POSSIBLE ARGS>")
                arg.forEach((a)=>{
                    console.log(a.from.tagVal)
                    console.log(a.sClocks)
                })
            })*/
        }
        if (matches.length > 0) {
            let match = matches[matches.length - 1];
            this.lastMatch = match;
            let values = match.map((arg) => {
                return arg.value;
            });
            //This will start propagation of local change. The exported signal will invoke the propagate method (which will send
            match.forEach((pv) => {
                let vals = this.I.get(pv.from.tagVal);
                vals = vals.filter((pvv) => { return pvv.fClock >= pv.fClock; });
                this.I.set(pv.from.tagVal, vals);
            });
            this.ownSignal.change(values);
        }
        /*matches.forEach((match)=>{
            this.lastMatch  = match;
            let values      = match.map((arg : PropagationValue2)=>{
                return arg.value
            })
            //This will start propagation of local change. The exported signal will invoke the propagate method (which will send
            this.ownSignal.change(values)
        })
        if(this.lastMatch){
            this.lastMatch.forEach((pv : PropagationValue2)=>{
                let vals = this.I.get(pv.from.tagVal)
                vals = vals.filter((pvv : PropagationValue2)=>{return pvv.fClock >= pv.fClock})
                this.I.set(pv.from.tagVal,vals)
            })
        }*/
    }
    getSignal(signal) {
        //Dummy neeed to trigger underlying deserialisation of SpiderS.js
    }
    ////////////////////////////////////////
    // QPROPD API                         //
    ////////////////////////////////////////
    newChild(childType, childRef) {
        this.childTypes.push(childType);
        this.childRefs.push(childRef);
        this.startsReceived++;
        childRef.getSignal(this.publishedSignal);
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
            this.hostActor.subscribe(toParent).once((newParentRef) => {
                newParentRef.newChild(this.ownType, this).then(([lastProp, sources]) => {
                    let knownSources = sources.filter((source) => { return this.S.has(source); });
                    if (knownSources.length == 0) {
                        this.addToI(toParent.tagVal, lastProp);
                    }
                    this.addSources(toParent, sources).then(() => {
                        this.parentTypes.push(toParent);
                        this.parentRefs.push(newParentRef);
                        this.I.set(toParent.tagVal, []);
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
    publishSignal(signal) {
        let publish = () => {
            this.publishedSignal = signal;
            this.childRefs.forEach((childRef) => {
                childRef.getSignal(signal);
            });
        };
        if (this.childRefs.length == this.childTypes.length) {
            publish();
        }
        else {
            this.readyListeners.push(publish);
        }
        if (this.startsReceived != this.childTypes.length) {
            signal.holder.onChangeListener = () => {
                this.propagate(signal.holder, []);
            };
        }
    }
    propagate(signal, toIds) {
        let newVal = signal.value;
        if (newVal instanceof signal_1.SignalFunction) {
            newVal = newVal.lastVal;
        }
        let sendToAll = () => {
            this.clock++;
            let clocks = new Map();
            if (this.parentTypes.length == 0) {
                clocks.set(this.ownType.tagVal, this.clock);
                let prop = new PropagationValue2(this.ownType, newVal, clocks, this.clock);
                this.lastProp = prop;
                prop.serMap();
                this.childRefs.forEach((childRef) => {
                    childRef.prePropagation(prop);
                });
                prop.deSerMap();
            }
            else {
                this.lastMatch.forEach((pv) => {
                    pv.sClocks.forEach((clockVal, source) => {
                        clocks.set(source, clockVal);
                    });
                });
                this.lastProp = new PropagationValue2(this.ownType, newVal, clocks, this.clock);
                this.lastProp.serMap();
                this.childRefs.forEach((childRef) => {
                    childRef.prePropagation(this.lastProp);
                });
                this.lastProp.deSerMap();
            }
        };
        if (this.startsReceived == this.childTypes.length) {
            sendToAll();
        }
        else {
            this.readyListeners.push(sendToAll);
        }
    }
    propagationReceived(fromId, signalId, value) {
        //Not needed
    }
    setSignalPool(signalPool) {
        this.signalPool = signalPool;
    }
}
exports.QPROP2Node = QPROP2Node;
//# sourceMappingURL=QPROP2.js.map