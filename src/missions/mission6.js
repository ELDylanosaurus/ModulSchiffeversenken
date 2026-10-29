import { getHold, getPosition, setTarget, waitUntilInReach } from "../Ship.js";
import { LOGIN_URL, activateLaser, deactivateLaser, getLaserState, setLaserAngle } from "../laser.js";

const ARAKROCK = { x: -18236, y: -11783 };
const APPROACH_DISTANCE = 60;
const DISTANCE_WINDOW = { min: 40, max: 56 };
const MAX_APPROACH_TRIES = 5;
const VESTA = { name: "Vesta Station", coordinates: { x: 7000, y: 7000 } };

const POLL_MS = 2000;
const CHECK_MS = 5000;
const TRY_WAIT_MS = 3000;
const LOGIN_RETRY_MS = 10000;
const ANGLE_CORRECTIONS = [0, -15, 15];

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
    let stillChecks = 0;
    while (stillChecks < 2) {
        await sleep(POLL_MS);
        const { velocity } = await getPosition();
        const moving = Math.hypot(velocity.x, velocity.y) > 0.5 || Math.abs(velocity.angle) > 0.5;
        stillChecks = moving ? 0 : stillChecks + 1;
    }
}

async function distanceToRock() {
    const { pos } = await getPosition();
    return Math.hypot(pos.x - ARAKROCK.x, pos.y - ARAKROCK.y);
}

async function approachRock() {
    let targetDistance = APPROACH_DISTANCE;
    for (let attempt = 1; attempt <= MAX_APPROACH_TRIES; attempt++) {
        await flyTo(ARAKROCK);
        await flyTo({ x: ARAKROCK.x - targetDistance, y: ARAKROCK.y });
        const distance = await distanceToRock();
        const { pos } = await getPosition();
        console.log(`Abstand zum Stein: ${Math.round(distance)} (Ziel westlich, ${targetDistance}) | Kurs ${Math.round(pos.angle)}°`);
        if (distance > DISTANCE_WINDOW.max) {
            targetDistance -= 10;
        } else if (distance < DISTANCE_WINDOW.min) {
            targetDistance += 10;
        } else {
            await setTarget("stop");
            return;
        }
    }
    await setTarget("stop");
    console.log("Abstand passt nach mehreren Versuchen nicht genau - versuche trotzdem abzubauen");
}

async function tryAngle(angle) {
    await setLaserAngle(angle);
    const result = await activateLaser();
    if (result.kind !== "success") {
        if (result.text === "not logged in") {
            console.log(`[laser] nicht eingeloggt - JETZT im Browser einloggen: ${LOGIN_URL} (Script wartet)`);
        } else {
            console.log(`[laser] /activate: ${JSON.stringify(result)}`);
        }
        await sleep(LOGIN_RETRY_MS);
        return "failed";
    }
    await sleep(TRY_WAIT_MS);
    const state = await getLaserState();
    return state.is_mining ? "mining" : "miss";
}

async function startMining() {
    const { pos } = await getPosition();
    const bearing = compassBearing(pos, ARAKROCK);
    const baseAngle = normalize(bearing - pos.angle);

    if (baseAngle < 90 || baseAngle > 270) {
        console.log(`[laser] Stein liegt vor dem Schiff (Kurs ${Math.round(pos.angle)}°) - Laser kann nicht nach vorne`);
        return "wrong-side";
    }

    for (const correction of ANGLE_CORRECTIONS) {
        const angle = Math.round(normalize(baseAngle + correction));
        const outcome = await tryAngle(angle);
        if (outcome === "mining") {
            console.log(`[laser] baut ab mit ${angle}° (Schiffskurs ${Math.round(pos.angle)}°, Richtung zum Stein ${Math.round(normalize(bearing))}°)`);
            return outcome;
        }
        if (outcome === "failed") {
            return outcome;
        }
        console.log(`[laser] ${angle}° trifft nicht`);
    }
    return "miss";
}

console.log("Fliege zu Arakrock ...");
await approachRock();

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
        const outcome = await startMining();
        if (outcome === "miss" || outcome === "wrong-side") {
            console.log("Fliege neu an (Mitte -> weg vom Stein)");
            await approachRock();
        }
    }

    await sleep(CHECK_MS);
}

await deactivateLaser();
console.log("Laderaum voll - Laser aus, fliege zur Vesta Station ...");
await setTarget(VESTA.coordinates);
await waitUntilInReach(VESTA.name);
console.log("Bei der Vesta Station angedockt!");
