import {ConfigService, DashboardService, DataService, DrivingService, GeoService, Monitor} from "./Services";
import {FleetMember} from "./FleetMember";
/**
 * Created by flo on 02/08/2017.
 */
let app = new Monitor()
app.spawnActor(DataService)
app.spawnActor(ConfigService)
app.spawnActor(GeoService)
app.spawnActor(DrivingService)
app.spawnActor(DashboardService)

let loop = () => {
    setTimeout(()=>{
        let member = new FleetMember()
        member.sendData(5,33.7489,-84.3789,3)
        loop()
    },4000)
}
loop()
