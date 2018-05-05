Object.defineProperty(exports, "__esModule", { value: true });
const spiders_js_1 = require("spiders.js");
exports.mutating = spiders_js_1.makeMethodAnnotation(() => { }, "mutating");
class SignalMirror extends spiders_js_1.SpiderIsolateMirror {
    isMutatingMethod(methodName) {
        if (this.isAnnotated(methodName)) {
            return this.getAnnotationTag(methodName) == "mutating";
        }
        else {
            return false;
        }
    }
    invoke(methodName, args) {
        let ret = super.invoke(methodName, args);
        if (this.isMutatingMethod(methodName)) {
            let sig = this.base;
            sig.actorMirror.sourceChanged(sig);
        }
        return ret;
    }
}
class Signal extends spiders_js_1.SpiderIsolate {
    constructor(actorMirror) {
        super(new SignalMirror());
        this.id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
        this.actorMirror = actorMirror;
        this.actorMirror.newSource(this);
        this.isSignal = true;
        this.isDerived = false;
    }
}
exports.Signal = Signal;
class DerivedSignal extends Signal {
    constructor(exp, actorMirror) {
        super(actorMirror);
        this.exp = exp;
        this.isDerived = true;
    }
    update(parentValues) {
        this.lastVal = this.exp(...parentValues);
    }
    equals(otherDerived) {
        return this.lastVal == otherDerived.lastVal;
    }
    getState() {
        return this.lastVal;
    }
    setState(s) {
        this.lastVal = s;
    }
}
exports.DerivedSignal = DerivedSignal;
let scope = new spiders_js_1.LexScope();
scope.addElement("SignalMirror", SignalMirror);
spiders_js_1.bundleScope(Signal, scope);
//# sourceMappingURL=Signal.js.map