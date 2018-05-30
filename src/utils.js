Object.defineProperty(exports, "__esModule", { value: true });
const spiders_1 = require("./spiders");
const signal_1 = require("./Reactivivity/signal");
const SubClient_1 = require("./PubSub/SubClient");
const SubTag_1 = require("./PubSub/SubTag");
const SubServer_1 = require("./PubSub/SubServer");
const QPROP_1 = require("./Reactivivity/QPROP");
const SIDUP_1 = require("./Reactivivity/SIDUP");
const QPROP2_1 = require("./Reactivivity/QPROP2");
/**
 * Created by flo on 05/12/2016.
 */
function isBrowser() {
    var isNode = false;
    if (typeof process === 'object') {
        if (typeof process.versions === 'object') {
            if (typeof process.versions.node !== 'undefined') {
                isNode = true;
            }
        }
    }
    return !(isNode);
}
exports.isBrowser = isBrowser;
function generateId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}
exports.generateId = generateId;
//Clone function comes from stack overflow thread:
//http://stackoverflow.com/questions/728360/how-do-i-correctly-clone-a-javascript-object
function cloneDR(o) {
    const gdcc = "__getDeepCircularCopy__";
    if (o !== Object(o)) {
        return o; // primitive value
    }
    var set = gdcc in o, cache = o[gdcc], result;
    if (set && typeof cache == "function") {
        return cache();
    }
    // else
    o[gdcc] = function () { return result; }; // overwrite
    if (o instanceof Array) {
        result = [];
        for (var i = 0; i < o.length; i++) {
            result[i] = cloneDR(o[i]);
        }
    }
    else if (o instanceof Function) {
        result = o;
    }
    else {
        result = {};
        Reflect.ownKeys(o).forEach((k) => {
            if (k != gdcc) {
                result[k] = cloneDR(o[k]);
            }
            else if (set) {
                result[k] = cloneDR(cache);
            }
        });
    }
    /*for (var prop in o)
        if (prop != gdcc)
            result[prop] = cloneDR(o[prop]);
        else if (set)
            result[prop] = cloneDR(cache);
}*/
    if (set) {
        o[gdcc] = cache; // reset
    }
    else {
        delete o[gdcc]; // unset again
    }
    return result;
}
exports.cloneDR = cloneDR;
//REALLY ugly way of checking whether we have reached the end of the prototype chain while cloning
function isLastPrototype(object) {
    return object == null;
}
function clone(object) {
    let base = cloneDR(object);
    function walkProto(proto, last) {
        if (!(isLastPrototype(proto))) {
            let protoClone = cloneDR(proto);
            Reflect.setPrototypeOf(last, protoClone);
            walkProto(Reflect.getPrototypeOf(proto), protoClone);
        }
    }
    walkProto(Reflect.getPrototypeOf(object), base);
    return base;
}
exports.clone = clone;
function getInitChain(behaviourObject, result) {
    var properties = Reflect.ownKeys(behaviourObject);
    //Have reached base level object, end of prototype chain (ugly but works)
    if (properties.indexOf("init") != -1) {
        result.unshift(Reflect.get(behaviourObject, "init"));
    }
    if (properties.indexOf("valueOf") != -1) {
        return result;
    }
    else {
        return getInitChain(behaviourObject.__proto__, result);
    }
}
const CONSTRAINT_OK = "ok";
function installSTDLib(appActor, parentRef, behaviourObject, environment) {
    let commMedium = environment.commMedium;
    let thisRef = environment.thisRef;
    let promisePool = environment.promisePool;
    let signalPool = environment.signalPool;
    let gspInstance = environment.gspInstance;
    if (!appActor) {
        behaviourObject["parent"] = parentRef.proxyify();
    }
    behaviourObject["remote"] = (address, port) => {
        return commMedium.connectRemote(thisRef, address, port, promisePool);
    };
    behaviourObject["Isolate"] = spiders_1.Isolate;
    behaviourObject["ArrayIsolate"] = spiders_1.ArrayIsolate;
    ///////////////////
    //Pub/Sub       //
    //////////////////
    behaviourObject["PSClient"] = ((serverAddress = "127.0.0.1", serverPort = 8000) => {
        let psClient = new SubClient_1.PSClient(serverAddress, serverPort, behaviourObject);
        behaviourObject["publish"] = psClient.publish.bind(psClient);
        behaviourObject["subscribe"] = psClient.subscribe.bind(psClient);
        behaviourObject["newPublished"] = psClient.newPublished.bind(psClient);
    });
    behaviourObject["newPSTag"] = ((name) => {
        return new SubTag_1.PubSubTag(name);
    });
    behaviourObject["PSServer"] = ((serverAddress = "127.0.0.1", serverPort = 8000) => {
        let psServer = new SubServer_1.PSServer(serverAddress, serverPort);
        behaviourObject["addPublish"] = psServer.addPublish.bind(psServer);
        behaviourObject["addSubscriber"] = psServer.addSubscriber.bind(psServer);
    });
    ///////////////////
    //Replication   //
    //////////////////
    behaviourObject["newRepliq"] = ((repliqClass, ...args) => {
        let repliqOb = new repliqClass(...args);
        return repliqOb.instantiate(gspInstance, thisRef.ownerId);
    });
    ///////////////////
    //Reactivity   //
    //////////////////
    let dependencyChangeTag = behaviourObject["newPSTag"]("DependencyChange");
    //Setup QPROP instance
    behaviourObject["QPROP"] = (ownType, directParents, directChildren, defaultValue, isDynamic = false) => {
        let qNode = new QPROP_1.QPROPNode(ownType, directParents, directChildren, behaviourObject, defaultValue, dependencyChangeTag, isDynamic);
        environment.signalPool.installDPropAlgorithm(qNode);
        let qNodeSignal = qNode.ownSignal;
        let signal = new signal_1.Signal(qNodeSignal);
        qNodeSignal.setHolder(signal);
        qNodeSignal.instantiateMeta(environment);
        signalPool.newSource(signal);
        return behaviourObject["lift"]((qSignal) => {
            return qSignal.parentVals;
        })(qNodeSignal);
    };
    behaviourObject["QPROP2"] = (ownType, directParents, directChildren) => {
        let qNode = new QPROP2_1.QPROP2Node(ownType, directParents, directChildren, behaviourObject, dependencyChangeTag);
        environment.signalPool.installDPropAlgorithm(qNode);
        let qNodeSignal = qNode.ownSignal;
        let signal = new signal_1.Signal(qNodeSignal);
        qNodeSignal.setHolder(signal);
        qNodeSignal.instantiateMeta(environment);
        signalPool.newSource(signal);
        return behaviourObject["lift"]((qSignal) => {
            return qSignal.parentVals;
        })(qNodeSignal);
    };
    behaviourObject["addDependency"] = (fromType, toType) => {
        behaviourObject["publish"](new QPROP_1.DependencyChange(fromType, toType), dependencyChangeTag);
    };
    behaviourObject["SIDUP"] = (ownType, parents, admitterType, isSink = false) => {
        let sidupNode = new SIDUP_1.SIDUPNode(ownType, parents, behaviourObject, admitterType, isSink);
        environment.signalPool.installDPropAlgorithm(sidupNode);
        let sidupSignal = sidupNode.ownSignal;
        let signal = new signal_1.Signal(sidupSignal);
        sidupSignal.setHolder(signal);
        sidupSignal.instantiateMeta(environment);
        signalPool.newSource(signal);
        return behaviourObject["lift"]((sidupSignal) => {
            return sidupSignal.parentVals;
        })(sidupSignal);
    };
    behaviourObject["SIDUPAdmitter"] = (admitterType, sources, sinks, idleListener = () => { }, changeListener = () => { }, admitListener = () => { }) => {
        let adm = new SIDUP_1.SIDUPAdmitter(admitterType, sources, sinks, idleListener, changeListener, admitListener, behaviourObject);
        behaviourObject["addDependency"] = adm.addDependency.bind(adm);
    };
    //Instruct QPROP instance to publish the given signal
    behaviourObject["publishSignal"] = (signal) => {
        environment.signalPool.distAlgo.publishSignal(signal);
    };
    behaviourObject["newSignal"] = (signalClass, ...args) => {
        let sigVal = new signalClass(...args);
        let signal = new signal_1.Signal(sigVal);
        sigVal.setHolder(signal);
        sigVal.instantiateMeta(environment);
        signalPool.newSource(signal);
        return signal.value;
    };
    //Automatically converts the resulting signal to weak if one of the dependencies is weak (leaves signal as strong otherwise)
    behaviourObject["lift"] = (func) => {
        let inner = signal_1.lift(func);
        return (...args) => {
            let sig = inner(...args);
            let allStrong = true;
            sig.signalDependencies.forEach((dep) => {
                allStrong = allStrong && dep.signal.strong;
            });
            if (!allStrong) {
                signalPool.newSignal(sig);
                sig.value.setHolder(sig);
                sig.makeWeak();
                return sig.value;
            }
            else {
                signalPool.newSignal(sig);
                sig.value.setHolder(sig);
                return sig.value;
            }
        };
    };
    if (!appActor) {
        var initChain = getInitChain(behaviourObject, []);
        initChain.forEach((initFunc) => {
            initFunc.apply(behaviourObject, []);
        });
    }
}
exports.installSTDLib = installSTDLib;
//# sourceMappingURL=utils.js.map