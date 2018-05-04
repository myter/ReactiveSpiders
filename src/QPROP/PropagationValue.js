Object.defineProperty(exports, "__esModule", { value: true });
const spiders_js_1 = require("spiders.js");
class PropagationValue extends spiders_js_1.SpiderIsolate {
    constructor(from, value, sClocks, fClock, isOptimised = false) {
        super();
        this.from = from;
        this.value = value;
        this.sClocks = sClocks;
        this.fClock = fClock;
        this.isOptimised = isOptimised;
    }
    asString() {
        return "< " + this.from.tagVal + " , " + this.value.toString() + " , " + this.sClocks + " , " + this.fClock + " >";
    }
    toArray() {
        return [this.from, this.value, this.sClocks, this.fClock, this.isOptimised];
    }
}
exports.PropagationValue = PropagationValue;
//# sourceMappingURL=PropagationValue.js.map