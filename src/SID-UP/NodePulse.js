Object.defineProperty(exports, "__esModule", { value: true });
const spiders_js_1 = require("spiders.js");
class NodePulse extends spiders_js_1.SpiderIsolate {
    constructor(pulseState, sourcesChanged, value) {
        super();
        this.pulseState = pulseState;
        this.sourcesChanged = sourcesChanged;
        this.value = value;
    }
}
exports.NodePulse = NodePulse;
//# sourceMappingURL=NodePulse.js.map