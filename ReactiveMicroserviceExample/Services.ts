import {QPROPActor} from "../src/QPROP/QPROPActor";
import {mutating, Signal} from "../src/Signal";
import {Application, PubSubTag, SpiderActorMirror, SpiderIsolate} from "spiders.js";
import {FleetData} from "./FleetData";
import {DataPacket} from "./FleetMember";
import {API_KEY} from "./MyConfig";
var LZString                = require("lz-string")


let configTag   = new PubSubTag("config")
let dataTag     = new PubSubTag("data")
let geoTag      = new PubSubTag("geo")
let drivingTag  = new PubSubTag("driving")
let dashTag     = new PubSubTag("sink")

export class Monitor extends Application{
    constructor(){
        super(new SpiderActorMirror(),"127.0.0.1",8000)
        this.libs.setupPSServer()
    }
}

export class ConfigSignal extends Signal{
    type

    constructor(mirr){
        super(mirr)
        this.type = "short"
    }

    @mutating
    change(){
        this.type = "long"
    }

    equals(otherSignal){
        return this.type == otherSignal.type
    }
}

export class ConfigService extends QPROPActor{
    ConfigSignal
    sig
    constructor(){
        super(configTag,[],[dashTag])
        this.ConfigSignal = ConfigSignal
    }

    start(){
        this.sig = new this.ConfigSignal(this.libs.reflectOnActor())
        return this.sig
    }

    update(){
        setTimeout(()=>{
            this.sig.change()
        },15000)
    }
}

export class DashboardService extends QPROPActor{
    constructor(){
        super(dashTag,[drivingTag,geoTag,configTag],[])
    }

    start(inputSignals){
        return this.libs.lift((drivingData,geoData,configData)=>{
            drivingData.then((violation)=>{
                geoData.then((address : AddressData)=>{
                    if(!configData){
                        console.log("Driving: " + violation + " geo: " + address.address)
                    }
                    else if (configData.type == "short"){
                        console.log("Driving: " + violation + " geo: " + address.address)
                    }
                    else{
                        console.log("Dashboard updated to: " + violation + " geographical poistion: " + address.address)
                    }
                })
            })
        })(inputSignals)
    }
}

interface CompressedPacket{
    id:     string
    lat:    string
    lon:    string
    speed:  string
}

export class DataService extends QPROPActor{
    thisDirectory
    dataSignals : Map<string,FleetData>
    DataPacket
    DB
    FleetData

    constructor(){
        super(dataTag,[],[geoTag,drivingTag])
        this.thisDirectory  = __dirname
        this.FleetData      = FleetData
    }

    start(){
        let FleetData       = require(this.thisDirectory + "/FleetData").FleetData
        let DataPacket      = require(this.thisDirectory + "/FleetMember").DataPacket
        this.DB             = new Map()
        this.dataSignals    = new Map()
        var PORT            = 33333;
        var HOST            = '127.0.0.1';
        var dgram           = require('dgram');
        var server          = dgram.createSocket('udp4');
        let signal          = new this.FleetData(this.libs.reflectOnActor())
        server.on('listening', function () {
            var address = server.address();
            console.log('UDP Server listening on ' + address.address + ":" + address.port);
        });
        server.on('message', (message, remote)=> {
            let dataPacket: CompressedPacket = JSON.parse(message)
            if(this.dataSignals.has(dataPacket.id)){
                let signal : FleetData = this.dataSignals.get(dataPacket.id)
                signal.actualise(dataPacket.lat,dataPacket.lon,dataPacket.speed)
            }
            else{
                signal = new this.FleetData(this.libs.reflectOnActor(),dataPacket.id,dataPacket.lat,dataPacket.lon,dataPacket.speed)
                this.dataSignals.set(dataPacket.id,signal as any)
                let decompress = (compressedPacket : CompressedPacket) => {
                    let packet = new DataPacket(compressedPacket.id,compressedPacket.lat,compressedPacket.lon,compressedPacket.speed)
                    packet.decompress()
                    return packet
                }
                let persist = (packet : DataPacket) => {
                    this.DB.set(dataPacket.id,packet)
                }
                let decompressed = this.libs.lift(decompress)(signal)
                this.libs.lift(persist)(decompressed)
                return decompressed
            }
        })
        server.bind(PORT, HOST)
        return signal
    }
}

export class DrivingService extends QPROPActor {
    API_KEY

    constructor(){
        super(drivingTag,[dataTag,geoTag],[dashTag])
        this.API_KEY = API_KEY
    }
    start(inputSignals){
        return this.libs.lift(([fleetData,addressData])=>{
            console.log("Driving new ! ")
            return addressData.then((addressObject : AddressData)=>{
                let place = addressObject.place
                return this.speedViolation(place,fleetData.speed)
            })
        })(inputSignals)
    }

    speedViolation(place,currentspeed){
        var request = require('request-promise-native')
        return request("https://roads.googleapis.com/v1/speedLimits?placeId="+place+"&key="+this.API_KEY).then((response)=>{
            let maxSpeed = response.speedLimits[0].speedLimit
            return currentspeed > maxSpeed
        })
            .catch((reason)=>{
                console.log(reason)
            })
    }
}

var geocoder = require('geocoder')

class AddressSignal extends Signal{
    aData

    constructor(mirr,aData){
        super(mirr)
        this.aData = aData
    }

    @mutating
    update(newA){
        this.aData = newA
    }

    equals(){}
}

export class AddressData extends SpiderIsolate{
    address : string
    place   : string

    constructor(address,place){
        super()
        this.address    = address
        this.place      = place
    }
}
export class GeoService extends QPROPActor{
    AddressSignal
    AddressData
    API_KEY

    constructor(){
        super(geoTag,[dataTag],[drivingTag,dashTag])
        this.AddressSignal  = AddressSignal
        this.AddressData    = AddressData
        this.API_KEY        = API_KEY
    }

    start(fleetDataSignal){
        //Reverse geo-code (async so return promise)
        return this.libs.lift(([fleetData])=>{
            console.log("GEO new ! ")
            return this.reverseGeoCode(fleetData.lat,fleetData.lon)
        })(fleetDataSignal)
    }

    reverseGeoCode(lat,lon){
        var geocoder = require('geocoder')
        var that = this
        return new Promise((resolve)=>{
            geocoder.reverseGeocode( lat, lon, function ( err, data ) {
                if(err){
                    console.log(err)
                }
                resolve(new that.AddressData(data.results[0].formatted_address,data.results[0].place_id))
            },{key:this.API_KEY});
        })
    }
}