Object.defineProperty(exports, "__esModule", { value: true });
const Services_1 = require("./Services");
const FleetMember_1 = require("./FleetMember");
/**
 * Created by flo on 02/08/2017.
 */
let app = new Services_1.Monitor();
app.spawnActor(Services_1.DataService);
app.spawnActor(Services_1.ConfigService);
app.spawnActor(Services_1.GeoService);
app.spawnActor(Services_1.DrivingService);
app.spawnActor(Services_1.DashboardService);
let loop = () => {
    setTimeout(() => {
        let member = new FleetMember_1.FleetMember();
        member.sendData(5, 33.7489, -84.3789, 3);
        loop();
    }, 4000);
};
loop();
//# sourceMappingURL=run.js.map