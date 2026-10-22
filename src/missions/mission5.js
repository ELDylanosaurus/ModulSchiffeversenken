import { getPosition, setTarget } from "../Ship.js";
import { ensureLimits } from "../energy.js";
import { measure } from "../vacuumSensor.js";
import { startSensorServer } from "../sensorGrpcServer.js";

const GRPC_PORT = 2102;

const POWER = {
    sensor_void_energy: 1.0,
    analyzer_alpha: 1.0
};
const ENERGY_CHECK_MS = 5000;
const STATUS_MS = 10000;

const URAN_STONE = { x: -2100, y: 3600 };

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

await ensureLimits(POWER);
setInterval(() => {
    ensureLimits(POWER).catch((error) => console.log(`[energy] ${error.message}`));
}, ENERGY_CHECK_MS);

let latestHex = null;
let markFirstValue;
const firstValue = new Promise((resolve) => {
    markFirstValue = resolve;
});

async function measureLoop() {
    while (true) {
        try {
            latestHex = await measure();
            markFirstValue();
        } catch (error) {
            console.log(`[sensor] ${error.message}`);
            await sleep(1000);
        }
    }
}

measureLoop();

let requests = 0;
await startSensorServer(GRPC_PORT, async () => {
    await firstValue;
    requests++;
    return latestHex;
});

console.log(`Setze Kurs auf Uran Stone (${URAN_STONE.x}, ${URAN_STONE.y})`);
await setTarget(URAN_STONE);

setInterval(async () => {
    try {
        const { pos } = await getPosition();
        const distance = Math.round(Math.hypot(pos.x - URAN_STONE.x, pos.y - URAN_STONE.y));
        const value = latestHex ? `${latestHex.slice(0, 16)}...` : "noch keiner";
        console.log(`[status] Distanz ${distance} | Analyzer-Anfragen ${requests} | Wert ${value}`);
    } catch (error) {
        console.log(`[status] ${error.message}`);
    }
}, STATUS_MS);
