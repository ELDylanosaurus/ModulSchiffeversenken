import { SHIP_IP } from "./Ship.js";

const SENSOR = `http://${SHIP_IP}:2037`;
const POLL_MS = 500;
const MAX_WAIT_MS = 30000;

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function measure() {
    const id = `measurement_${Date.now()}`;

    const trigger = await fetch(`${SENSOR}/trigger_measurement`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ request_id: id })
    });
    if (!trigger.ok) {
        throw new Error(`trigger_measurement: ${trigger.status} ${await trigger.text()}`);
    }

    try {
        const giveUpAt = Date.now() + MAX_WAIT_MS;
        while (Date.now() < giveUpAt) {
            await sleep(POLL_MS);
            const response = await fetch(`${SENSOR}/measurements/${id}`);
            const measurement = await response.json();

            if (measurement.state === "measured") {
                return measurement.result;
            }
            if (measurement.state !== "measuring") {
                throw new Error(`unerwartete Antwort: ${JSON.stringify(measurement)}`);
            }
        }
        throw new Error(`Messung ${id} nach ${MAX_WAIT_MS / 1000}s nicht fertig`);
    } finally {
        await fetch(`${SENSOR}/measurements/${id}`, { method: "DELETE" }).catch(() => {});
    }
}
