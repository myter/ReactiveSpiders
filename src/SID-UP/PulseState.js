Object.defineProperty(exports, "__esModule", { value: true });
const spiders_js_1 = require("spiders.js");
class PulseState extends spiders_js_1.SpiderIsolate {
    constructor() {
        super();
        this.pending = 0;
        this.unchanged = 1;
        this.changed = 2;
        this.state = this.pending;
    }
    isPending() {
        return this.state == this.pending;
    }
    isUnchanged() {
        return this.state == this.unchanged;
    }
    isChanged() {
        return this.state == this.changed;
    }
    setPending() {
        this.state = this.pending;
    }
    setUnchanged() {
        this.state = this.unchanged;
    }
    setChanged() {
        this.state = this.changed;
    }
}
exports.PulseState = PulseState;
//# sourceMappingURL=PulseState.js.map