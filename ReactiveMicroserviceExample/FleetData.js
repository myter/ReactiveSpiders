var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const Signal_1 = require("../src/Signal");
/**
 * Created by flo on 02/08/2017.
 */
class FleetData extends Signal_1.Signal {
    constructor(mirr, id, lat, lon, speed) {
        super(mirr);
        this.id = id;
        this.lat = lat;
        this.lon = lon;
        this.speed = speed;
    }
    actualise(newLat, newLon, newSpeed) {
        this.lat = newLat;
        this.lon = newLon;
        this.speed = newSpeed;
    }
    equals() { }
}
__decorate([
    Signal_1.mutating
], FleetData.prototype, "actualise", null);
exports.FleetData = FleetData;
//# sourceMappingURL=FleetData.js.map