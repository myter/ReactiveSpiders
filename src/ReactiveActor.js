Object.defineProperty(exports, "__esModule", { value: true });
const spiders_js_1 = require("spiders.js");
const ReactiveMirror_1 = require("./ReactiveMirror");
const NoDistGlitch_1 = require("./NoDistGlitch");
class ReactiveActor extends spiders_js_1.Actor {
    constructor(mirror = new ReactiveMirror_1.ReactiveMirror(new NoDistGlitch_1.NoDistGlitch())) {
        super(mirror);
    }
}
exports.ReactiveActor = ReactiveActor;
//# sourceMappingURL=ReactiveActor.js.map