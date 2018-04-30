Object.defineProperty(exports, "__esModule", { value: true });
const ReactiveMirror_1 = require("./ReactiveMirror");
const spiders_js_1 = require("spiders.js");
class NoDistGlitch extends spiders_js_1.SpiderIsolate {
    constructor() {
        super();
        this.remoteSignalCopies = new Map();
        this._REMOTE_CHANGE_ = ReactiveMirror_1._REMOTE_CHANGE_;
    }
    setMirror(actorMirror) {
        this.actorMirror = actorMirror;
    }
    registerSourceSignal(signal) { }
    registerDerivedSignal(signal) { }
    localSignalChanged(signal) {
        if (this.remoteSignalCopies.has(signal.id)) {
            this.remoteSignalCopies.forEach(([sig, owners]) => {
                owners.forEach((owner) => {
                    //Avoid copying over the actor mirror
                    let mirr = signal.actorMirror;
                    delete signal.actorMirror;
                    owner[this._REMOTE_CHANGE_](signal);
                    signal.actorMirror = mirr;
                });
            });
        }
    }
    remoteSignalChanged(signal) {
        signal.actorMirror = this.actorMirror;
        this.actorMirror.sourceChanged(signal);
    }
    signalSent(signal, target) {
        if (!this.remoteSignalCopies.has(signal.id)) {
            this.remoteSignalCopies.set(signal.id, [signal, []]);
        }
        this.remoteSignalCopies.get(signal.id)[1].push(target);
    }
    signalReceived(signal, from) {
        this.actorMirror.localGraph.newSource(signal);
    }
}
exports.NoDistGlitch = NoDistGlitch;
//# sourceMappingURL=NoDistGlitch.js.map