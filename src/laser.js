import { SHIP_IP } from "./Ship.js";

const LASER = `http://${SHIP_IP}:2018`;

export const LOGIN_URL = `${LASER}/login`;

async function request(method, path, body) {
    const response = await fetch(`${LASER}${path}`, {
        method,
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined
    });
    const text = await response.text();
    try {
        return JSON.parse(text);
    } catch {
        return { kind: "error", message: `${response.status}: ${text}` };
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
