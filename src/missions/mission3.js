import { flyToStation } from "../ship.js";
import { startRelay, sendToPeer } from "../relay.js";

const MY_STATION = "Elyse Terminal";      
const PEER_HOST = "192.168.100.40";      
const PEER_PORT = 5000;                   
const LISTEN_PORT = 5000;                

const RUN_MS = 60_000;                    
const FORWARD_INTERVAL_MS = 2000;         

const SHIP_IP = "192.168.100.40";
const COMM_PORT = 2011;

async function readFromStation(station) {
    const response = await fetch(
        `http://${SHIP_IP}:${COMM_PORT}/messages` +
        `?station=${encodeURIComponent(station)}`
    );
    const data = await response.json();
    return data.messages ?? [];
}

async function writeToStation(station, message) {
    await fetch(`http://${SHIP_IP}:${COMM_PORT}/send`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ station, message })
    });
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
    await flyToStation(MY_STATION);

    startRelay(LISTEN_PORT, async (message) => {
        console.log("von Peer erhalten:", message);
        await writeToStation(MY_STATION, message);
    });

    const stopAt = Date.now() + RUN_MS;
    while (Date.now() < stopAt) {
        const outgoing = await readFromStation(MY_STATION);

        if (outgoing.length > 0) {
            for (const msg of outgoing) {
                await sendToPeer(PEER_HOST, PEER_PORT, msg);
            }
        } else {
            await sendToPeer(PEER_HOST, PEER_PORT, {
                type: "keepalive",
                from: MY_STATION,
                t: Date.now()
            });
        }

        await sleep(FORWARD_INTERVAL_MS);
    }

    console.log("Kommunikation beendet");
}

main();
