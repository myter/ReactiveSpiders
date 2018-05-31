var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const QPROPActor_1 = require("../src/QPROP/QPROPActor");
const Signal_1 = require("../src/Signal");
const spiders_js_1 = require("spiders.js");
const FleetData_1 = require("./FleetData");
const MyConfig_1 = require("./MyConfig");
var LZString = require("lz-string");
let configTag = new spiders_js_1.PubSubTag("config");
let dataTag = new spiders_js_1.PubSubTag("data");
let geoTag = new spiders_js_1.PubSubTag("geo");
let drivingTag = new spiders_js_1.PubSubTag("driving");
let dashTag = new spiders_js_1.PubSubTag("sink");
class Monitor extends spiders_js_1.Application {
    constructor() {
        super(new spiders_js_1.SpiderActorMirror(), "127.0.0.1", 8000);
        this.libs.setupPSServer();
    }
}
exports.Monitor = Monitor;
class ConfigSignal extends Signal_1.Signal {
    constructor(mirr) {
        super(mirr);
        this.type = "short";
    }
    change() {
        this.type = "long";
    }
    equals(otherSignal) {
        return this.type == otherSignal.type;
    }
}
__decorate([
    Signal_1.mutating
], ConfigSignal.prototype, "change", null);
exports.ConfigSignal = ConfigSignal;
class ConfigService extends QPROPActor_1.QPROPActor {
    constructor() {
        super(configTag, [], [dashTag]);
        this.ConfigSignal = ConfigSignal;
    }
    start() {
        this.sig = new this.ConfigSignal(this.libs.reflectOnActor());
        return this.sig;
    }
    update() {
        setTimeout(() => {
            this.sig.change();
        }, 15000);
    }
}
exports.ConfigService = ConfigService;
class DashboardService extends QPROPActor_1.QPROPActor {
    constructor() {
        super(dashTag, [drivingTag, geoTag, configTag], []);
    }
    start(inputSignals) {
        return this.libs.lift((drivingData, geoData, configData) => {
            drivingData.then((violation) => {
                geoData.then((address) => {
                    if (!configData) {
                        console.log("Driving: " + violation + " geo: " + address.address);
                    }
                    else if (configData.type == "short") {
                        console.log("Driving: " + violation + " geo: " + address.address);
                    }
                    else {
                        console.log("Dashboard updated to: " + violation + " geographical poistion: " + address.address);
                    }
                });
            });
        })(inputSignals);
    }
}
exports.DashboardService = DashboardService;
class DataService extends QPROPActor_1.QPROPActor {
    constructor() {
        super(dataTag, [], [geoTag, drivingTag]);
        this.thisDirectory = __dirname;
        this.FleetData = FleetData_1.FleetData;
    }
    start() {
        let FleetData = require(this.thisDirectory + "/FleetData").FleetData;
        let DataPacket = require(this.thisDirectory + "/FleetMember").DataPacket;
        this.DB = new Map();
        this.dataSignals = new Map();
        var PORT = 33333;
        var HOST = '127.0.0.1';
        var dgram = require('dgram');
        var server = dgram.createSocket('udp4');
        let signal = new this.FleetData(this.libs.reflectOnActor());
        server.on('listening', function () {
            var address = server.address();
            console.log('UDP Server listening on ' + address.address + ":" + address.port);
        });
        server.on('message', (message, remote) => {
            let dataPacket = JSON.parse(message);
            if (this.dataSignals.has(dataPacket.id)) {
                let signal = this.dataSignals.get(dataPacket.id);
                signal.actualise(dataPacket.lat, dataPacket.lon, dataPacket.speed);
            }
            else {
                signal = new this.FleetData(this.libs.reflectOnActor(), dataPacket.id, dataPacket.lat, dataPacket.lon, dataPacket.speed);
                this.dataSignals.set(dataPacket.id, signal);
                let decompress = (compressedPacket) => {
                    let packet = new DataPacket(compressedPacket.id, compressedPacket.lat, compressedPacket.lon, compressedPacket.speed);
                    packet.decompress();
                    return packet;
                };
                let persist = (packet) => {
                    this.DB.set(dataPacket.id, packet);
                };
                let decompressed = this.libs.lift(decompress)(signal);
                this.libs.lift(persist)(decompressed);
                return decompressed;
            }
        });
        server.bind(PORT, HOST);
        return signal;
    }
}
exports.DataService = DataService;
class DrivingService extends QPROPActor_1.QPROPActor {
    constructor() {
        super(drivingTag, [dataTag, geoTag], [dashTag]);
        this.API_KEY = MyConfig_1.API_KEY;
    }
    start(inputSignals) {
        return this.libs.lift(([fleetData, addressData]) => {
            console.log("Driving new ! ");
            return addressData.then((addressObject) => {
                let place = addressObject.place;
                return this.speedViolation(place, fleetData.speed);
            });
        })(inputSignals);
    }
    speedViolation(place, currentspeed) {
        var request = require('request-promise-native');
        return request("https://roads.googleapis.com/v1/speedLimits?placeId=" + place + "&key=" + this.API_KEY).then((response) => {
            let maxSpeed = response.speedLimits[0].speedLimit;
            return currentspeed > maxSpeed;
        })
            .catch((reason) => {
            console.log(reason);
        });
    }
}
exports.DrivingService = DrivingService;
var geocoder = require('geocoder');
class AddressSignal extends Signal_1.Signal {
    constructor(mirr, aData) {
        super(mirr);
        this.aData = aData;
    }
    update(newA) {
        this.aData = newA;
    }
    equals() { }
}
__decorate([
    Signal_1.mutating
], AddressSignal.prototype, "update", null);
class AddressData extends spiders_js_1.SpiderIsolate {
    constructor(address, place) {
        super();
        this.address = address;
        this.place = place;
    }
}
exports.AddressData = AddressData;
class GeoService extends QPROPActor_1.QPROPActor {
    constructor() {
        super(geoTag, [dataTag], [drivingTag, dashTag]);
        this.AddressSignal = AddressSignal;
        this.AddressData = AddressData;
        this.API_KEY = MyConfig_1.API_KEY;
    }
    start(fleetDataSignal) {
        //Reverse geo-code (async so return promise)
        return this.libs.lift(([fleetData]) => {
            console.log("GEO new ! ");
            return this.reverseGeoCode(fleetData.lat, fleetData.lon);
        })(fleetDataSignal);
    }
    reverseGeoCode(lat, lon) {
        var geocoder = require('geocoder');
        var that = this;
        return new Promise((resolve) => {
            geocoder.reverseGeocode(lat, lon, function (err, data) {
                if (err) {
                    console.log(err);
                }
                resolve(new that.AddressData(data.results[0].formatted_address, data.results[0].place_id));
            }, { key: this.API_KEY });
        });
    }
}
exports.GeoService = GeoService;
//# sourceMappingURL=Services.js.map