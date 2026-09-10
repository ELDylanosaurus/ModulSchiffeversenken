// Klopft das Comm-Modul ab, um die echten Endpoints zu finden.
// Aufruf:
//   node src/probe.js                    -> nur abklopfen
//   node src/probe.js "Elyse Terminal"   -> erst zur Station fliegen, dann abklopfen

import { setTarget } from "./ship.js";

const SHIP_IP = "192.168.100.40";
const COMM_PORT = 2011;
const NAV_PORT = 2010;

const station = process.argv[2] ?? null;

const GET_PATHS = [
    "/", "/help", "/routes", "/api", "/status",
    "/messages", "/message", "/inbox", "/outbox", "/queue",
    "/receive", "/read", "/poll", "/pull", "/next",
    "/comm", "/comm/receive", "/comm/messages", "/comm/inbox",
    "/stations_in_reach"
];

const POST_PATHS = [
    "/send", "/send_message", "/message", "/messages",
    "/transmit", "/broadcast", "/comm/send", "/comm/transmit"
];

function short(text) {
    return text.slice(0, 300).replace(/\s+/g, " ");
}

async function get(path) {
    try {
        const response = await fetch(`http://${SHIP_IP}:${COMM_PORT}${path}`);
        const text = await response.text();
        console.log(`${response.status}  GET  ${path}  ->  ${short(text)}`);
    } catch (error) {
        console.log(`ERR  GET  ${path}  ->  ${error.message}`);
    }
}

async function post(path) {
    try {
        const response = await fetch(`http://${SHIP_IP}:${COMM_PORT}${path}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                station,
                message: "probe",
                content: "probe",
                text: "probe"
            })
        });
        const text = await response.text();
        console.log(`${response.status}  POST ${path}  ->  ${short(text)}`);
    } catch (error) {
        console.log(`ERR  POST ${path}  ->  ${error.message}`);
    }
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function flyThere(name) {
    console.log(`Fliege zu ${name} ...`);
    await setTarget(name);
    for (let i = 0; i < 60; i++) {
        await sleep(2000);
        const response = await fetch(
            `http://${SHIP_IP}:${COMM_PORT}/stations_in_reach`
        );
        const data = await response.json();
        if (data.stations && data.stations[name]) {
            console.log(`In Reichweite von ${name}`);
            console.log(JSON.stringify(data, null, 2));
            return;
        }
    }
    console.log("Station nicht erreicht (Timeout) - probe trotzdem weiter");
}

async function tryWebSocket(path) {
    return new Promise((resolve) => {
        const url = `ws://${SHIP_IP}:${COMM_PORT}${path}`;
        let done = false;
        try {
            const ws = new WebSocket(url);
            const finish = (msg) => {
                if (done) return;
                done = true;
                try { ws.close(); } catch {}
                console.log(`WS   ${path}  ->  ${msg}`);
                resolve();
            };
            ws.addEventListener("open", () => finish("OPEN (WebSocket akzeptiert!)"));
            ws.addEventListener("message", (event) => finish(`MESSAGE ${String(event.data).slice(0, 200)}`));
            ws.addEventListener("error", () => finish("error / kein WS"));
            setTimeout(() => finish("timeout"), 3000);
        } catch (error) {
            console.log(`WS   ${path}  ->  ${error.message}`);
            resolve();
        }
    });
}

async function main() {
    if (station) {
        await flyThere(station);
    }

    console.log("\n--- GET ---");
    for (const path of GET_PATHS) {
        await get(path);
    }

    console.log("\n--- POST ---");
    for (const path of POST_PATHS) {
        await post(path);
    }

    console.log("\n--- WebSocket ---");
    for (const path of ["/", "/ws", "/socket", "/stream", "/comm"]) {
        await tryWebSocket(path);
    }
}

main();
