import { getHold, getPosition, setTarget, waitUntilInReach } from "../Ship.js";
import { LOGIN_URL, activateLaser, deactivateLaser, getLaserState, setLaserAngle } from "../laser.js";

const ARAKROCK = { x: -18236, y: -11783 };
const MINING_DISTANCE = 50;
const VESTA = { name: "Vesta Station", coordinates: { x: 7000, y: 7000 } };

const POLL_MS = 2000;
const LOGIN_RETRY_MS = 5000;
const ARRIVAL_TOLERANCE = 40;

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalize(angle) {
    return ((angle % 360) + 360) % 360;
}

function compassBearing(from, to) {
    return Math.atan2(to.x - from.x, to.y - from.y) * 180 / Math.PI;
}

process.on("SIGINT", async () => {
    console.log("\nAbbruch - schalte Laser aus");
    await deactivateLaser().catch(() => {});
    process.exit(0);
});

async function flyTo(target) {
    await setTarget(target);
    while (true) {
        await sleep(POLL_MS);
        const { pos, velocity } = await getPosition();
        const off = Math.hypot(pos.x - target.x, pos.y - target.y);
        if (off < ARRIVAL_TOLERANCE && Math.hypot(velocity.x, velocity.y) < 0.5) {
            return;
        }
    }
}

async function miningSpot() {
    const { pos } = await getPosition();
    const dx = pos.x - ARAKROCK.x;
    const dy = pos.y - ARAKROCK.y;
    const distance = Math.hypot(dx, dy) || 1;
    return {
        x: ARAKROCK.x + dx / distance * MINING_DISTANCE,
        y: ARAKROCK.y + dy / distance * MINING_DISTANCE
    };
}

async function aimAtRock() {
    const { pos } = await getPosition();
    const angle = Math.round(normalize(compassBearing(pos, ARAKROCK) - pos.angle));
    await setLaserAngle(angle);
    return angle;
}

async function activate() {
    while (true) {
        const result = await activateLaser();
        await sleep(1000);
        const state = await getLaserState();
        if (state.is_active) {
            return;
        }
        if (state.is_cooling_down) {
            console.log("[laser] kühlt ab ...");
            await sleep(POLL_MS);
            continue;
        }
        console.log(`[laser] geht nicht an (${result.message ?? result.kind}) - bitte im Browser einloggen: ${LOGIN_URL}`);
        await sleep(LOGIN_RETRY_MS);
    }
}

console.log("Fliege zu Arakrock ...");
await flyTo(await miningSpot());
console.log(`Bei Arakrock, ${MINING_DISTANCE} Einheiten Abstand`);

while (true) {
    const { hold } = await getHold();
    console.log(`[mining] Stein ${hold.resources.STONE ?? 0} | frei ${hold.hold_free}`);
    if (hold.hold_free === 0) {
        break;
    }

    const state = await getLaserState();
    if (state.is_cooling_down) {
        console.log("[laser] kühlt ab ...");
    } else if (!state.is_mining) {
        const angle = await aimAtRock();
        await activate();
        console.log(`[laser] zielt mit ${angle}° auf Arakrock`);
    }

    await sleep(POLL_MS);
}

await deactivateLaser();
console.log("Laderaum voll - Laser aus, fliege zur Vesta Station ...");
await setTarget(VESTA.coordinates);
await waitUntilInReach(VESTA.name);
console.log("Bei der Vesta Station angedockt!");
