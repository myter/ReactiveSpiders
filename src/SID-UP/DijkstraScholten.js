Object.defineProperty(exports, "__esModule", { value: true });
class DijkstraScholten {
    constructor(listener = () => { }) {
        this.c = 0;
        this.d = 0;
        this.incoming = [];
        this.idle = 0;
        this.processing = 1;
        this.state = this.idle;
        this.listener = listener;
    }
    newParentMessage(parentRef) {
        this.state = this.processing;
        this.d++;
        this.incoming.push(parentRef);
    }
    newChildMessage() {
        this.state = this.processing;
        this.c++;
    }
    newAckMessage() {
        this.c--;
        if (this.c == 0) {
            this.sendAcks();
        }
    }
    nodeTerminated() {
        this.sendAcks();
    }
    sendAcks() {
        this.incoming.forEach((parentRef) => {
            this.d--;
            parentRef.ack();
        });
        if (this.d == 0) {
            this.state = this.idle;
            this.incoming = [];
            this.listener();
        }
    }
    isIdle() {
        return this.state == this.idle;
    }
}
exports.DijkstraScholten = DijkstraScholten;
//# sourceMappingURL=DijkstraScholten.js.map