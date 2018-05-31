import {mutating, Signal} from "../src/Signal";
/**
 * Created by flo on 02/08/2017.
 */

export class FleetData extends Signal{
    id:     string
    lat:    string
    lon:    string
    speed:  string

    constructor(mirr,id,lat,lon,speed){
        super(mirr)
        this.id     = id
        this.lat    = lat
        this.lon    = lon
        this.speed  = speed
    }

    @mutating
    actualise(newLat,newLon,newSpeed){
        this.lat    = newLat
        this.lon    = newLon
        this.speed  = newSpeed
    }

    equals(){}
}