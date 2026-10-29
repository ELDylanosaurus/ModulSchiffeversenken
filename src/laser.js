import { SHIP_IP } from "./Ship.js";

const LASER = `http://${SHIP_IP}:2018`;
const RATE_LIMIT_WAIT_MS = 15000;

export const LOGIN_URL = `${LASER}/login`;

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function request(method, path, body) {
    while (true) {
        const response = await fetch(`${LASER}${path}`, {
            method,
            headers: body ? { "Content-Type": "application/json" } : undefined,
            body: body ? JSON.stringify(body) : undefined
        });
        const text = await response.text();

        let data;
        try {
            data = JSON.parse(text);
        } catch {
            return { kind: "error", message: `${response.status}: ${text}` };
        }

        if (data.kind === "failure" && String(data.text).includes("max requests")) {
            console.log(`[laser] zu viele Anfragen pro Minute - warte ${RATE_LIMIT_WAIT_MS / 1000}s`);
            await sleep(RATE_LIMIT_WAIT_MS);
            continue;
        }
        return data;
    }
}

export function getLaserState() {
    return request("GET", "/state");
}

export function activateLaser() {
    return request("POST", "/activate");
}

export function deactivateLaser() {
    return request("POST", "/deactivate");
}

export function setLaserAngle(angle) {
    return request("PUT", "/angle", { angle });
}
