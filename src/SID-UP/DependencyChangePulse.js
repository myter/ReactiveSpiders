Object.defineProperty(exports, "__esModule", { value: true });
const spiders_js_1 = require("spiders.js");
class DependencyChangePulse extends spiders_js_1.SpiderIsolate {
    constructor(fromType, toType) {
        super();
        this.fromType = fromType;
        this.toType = toType;
    }
}
exports.DependencyChangePulse = DependencyChangePulse;
//# sourceMappingURL=DependencyChangePulse.js.map