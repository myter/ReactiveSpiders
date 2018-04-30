Object.defineProperty(exports, "__esModule", { value: true });
const spiders_js_1 = require("spiders.js");
const ReactiveMirror_1 = require("./ReactiveMirror");
const NoDistGlitch_1 = require("./NoDistGlitch");
class ReactiveApplication extends spiders_js_1.Application {
    constructor() {
        super(new ReactiveMirror_1.ReactiveMirror(new NoDistGlitch_1.NoDistGlitch()));
    }
}
exports.ReactiveApplication = ReactiveApplication;
//# sourceMappingURL=ReactiveApplication.js.map