// Aufgabe 3: Kommunikation zwischen Elyse Terminal und Shangris Station.
// Läuft auf den VMs (nur dort sind Ports >= 5000 zwischen den Schiffen offen).
//
// Aufruf auf der jeweiligen VM:
//   SHIP_IP=127.0.0.1 node src/missions/mission3.js elyse    <IP der Shangris-VM>
//   SHIP_IP=127.0.0.1 node src/missions/mission3.js shangris <IP der Elyse-VM>

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

// Die Namen kennt das Schiff nicht -> per Koordinaten anfliegen
console.log(`Fliege zu ${station.name} ...`);
await setTarget(station.coordinates);
await waitUntilInReach(station.name);
await setTarget("stop");
console.log("Angekommen, halte Position");

// Station -> andere VM
const sendToStation = await connectToStation(
    station.name,
    station.wsUrl,
    station.field,
    (payload) => sendToPeer(peerIp, station.name, payload)
);

// andere VM -> Station
startRelay((message) => sendToStation(message.payload, message.from));

sendToStation(START_SEED, station.partner);

// Läuft, bis man es mit Ctrl+C beendet - so überlappen sich beide VMs sicher
const startedAt = Date.now();
setInterval(() => {
    const seconds = Math.round((Date.now() - startedAt) / 1000);
    console.log(`verbunden seit ${seconds}s (beenden mit Ctrl+C)`);
}, STATUS_INTERVAL_MS);
