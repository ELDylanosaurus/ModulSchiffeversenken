// Mission 4: Raumanomalie - Schildgenerator zum Laufen bringen.
//
// Vorher auf der VM die MongoDB starten:  sh mongo/start-mongo.sh
// Dann:  SHIP_IP=127.0.0.1 node src/missions/mission4.js

import { MongoClient } from "mongodb";
import { SHIP_IP, setTarget, waitUntilInReach } from "../Ship.js";
import { ensureLimits } from "../energy.js";
import { measure } from "../vacuumSensor.js";

const MONGO_URL = `mongodb://theship:theship1234@${SHIP_IP}:2021/theshipdb`;
const COLLECTION = "vacuum-energy";

const POWER = {
    sensor_void_energy: 1.0,
    shield_generator: 1.0
};
const ENERGY_CHECK_MS = 5000;

const RELIEF_STATION = {
    name: "Relief Station",
    coordinates: { x: 150000, y: 150000 }
};

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

// 1. MongoDB
const mongo = new MongoClient(MONGO_URL, { serverSelectionTimeoutMS: 5000 });
await mongo.connect();
const collection = mongo.db().collection(COLLECTION);
// Der Schildgenerator erwartet genau EIN Dokument
await collection.deleteMany({});
console.log(`[mongo] verbunden mit ${SHIP_IP}:2021`);

// 2. Strom für Sensor und Schild - regelmässig prüfen, weil der aktive
//    Node wechseln kann
await ensureLimits(POWER);
setInterval(() => {
    ensureLimits(POWER).catch((error) => console.log(`[energy] ${error.message}`));
}, ENERGY_CHECK_MS);

// 3. Sensor messen -> Ergebnis in die MongoDB, endlos
let markFirstWrite;
const firstWrite = new Promise((resolve) => {
    markFirstWrite = resolve;
});

async function measureLoop() {
    while (true) {
        try {
            const hex = await measure();
            await collection.replaceOne({}, { data: hex }, { upsert: true });
            console.log(`[sensor] ${hex} -> ${COLLECTION}`);
            markFirstWrite();
        } catch (error) {
            console.log(`[sensor] ${error.message}`);
            await sleep(1000);
        }
    }
}

measureLoop();

// 4. Erst losfliegen, wenn der Schild Daten hat
await firstWrite;
console.log(`Schild hat Daten - fliege zur ${RELIEF_STATION.name} ...`);
await setTarget(RELIEF_STATION.coordinates);
await waitUntilInReach(RELIEF_STATION.name);
console.log(`${RELIEF_STATION.name} erreicht! (Script läuft weiter, beenden mit Ctrl+C)`);
