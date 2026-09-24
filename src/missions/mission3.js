import { SHIP_IP, setTarget, waitUntilInReach } from "../Ship.js";
import { startRelay, sendToPeer } from "../relay.js";
import { connectToStation } from "../stationChat.js";

const STATIONS = {
    elyse: {
        name: "Elyse Terminal",
        wsUrl: `ws://${SHIP_IP}:2026/api`,
        field: "msg",
        coordinates: { x: -70565, y: 72811 },
        partner: "Shangris Station"
    },
    shangris: {
        name: "Shangris Station",
        wsUrl: `ws://${SHIP_IP}:2025/ws`,
        field: "data",
        coordinates: { x: 4446, y: 4340 },
        partner: "Elyse Terminal"
    }
};

const START_SEED = [1, 2, 3, 4];
const STATUS_INTERVAL_MS = 5000;

const station = STATIONS[process.argv[2]];
const peerIp = process.argv[3];

if (!station || !peerIp) {
    console.log("Aufruf: node src/missions/mission3.js <elyse|shangris> <IP der anderen VM>");
    process.exit(1);
}

console.log(`Fliege zu ${station.name} ...`);
await setTarget(station.coordinates);
await waitUntilInReach(station.name);
await setTarget("stop");
console.log("Angekommen, halte Position");

const sendToStation = await connectToStation(
    station.name,
    station.wsUrl,
    station.field,
    (payload) => sendToPeer(peerIp, station.name, payload)
);

startRelay((message) => sendToStation(message.payload, message.from));

sendToStation(START_SEED, station.partner);

const startedAt = Date.now();
setInterval(() => {
    const seconds = Math.round((Date.now() - startedAt) / 1000);
    console.log(`verbunden seit ${seconds}s (beenden mit Ctrl+C)`);
}, STATUS_INTERVAL_MS);
