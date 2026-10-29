import { flyToPosition, getHold, setTarget, waitUntilInReach } from "../Ship.js";
import { LOGIN_URL, activateLaser, deactivateLaser, getLaserState, setLaserAngle } from "../laser.js";

const ARAKROCK = { x: -18236, y: -11783 };
const VESTA = { name: "Vesta Station", coordinates: { x: 7000, y: 7000 } };

const ANGLE_STEP = 10;
const SETTLE_MS = 1500;
const POLL_MS = 2000;
const LOGIN_RETRY_MS = 5000;

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

process.on("SIGINT", async () => {
    console.log("\nAbbruch - schalte Laser aus");
    await deactivateLaser().catch(() => {});
    process.exit(0);
});

async function loadedStone() {
    const { hold } = await getHold();
    return { stone: hold.resources.STONE ?? 0, free: hold.hold_free };
}

async function ensureActive() {
    while (true) {
        const state = await getLaserState();
        if (state.is_active) {
            return;
        }
        if (state.is_cooling_down) {
            await sleep(POLL_MS);
            continue;
        }
        const result = await activateLaser();
        if (result.kind === "success") {
            console.log("[laser] aktiviert");
            return;
        }
        console.log(`[laser] Aktivieren fehlgeschlagen: ${result.message ?? JSON.stringify(result)}`);
        console.log(`[laser] Bitte im Browser einloggen: ${LOGIN_URL}`);
        await sleep(LOGIN_RETRY_MS);
    }
}

async function findMiningAngle() {
    for (let angle = 0; angle < 360; angle += ANGLE_STEP) {
        await setLaserAngle(angle);
        await sleep(SETTLE_MS);
        const state = await getLaserState();
        if (state.is_mining) {
            console.log(`[laser] baut ab bei Winkel ${angle}°`);
            return angle;
        }
    }
    return null;
}

console.log("Fliege zu Arakrock ...");
await flyToPosition(ARAKROCK);

await ensureActive();
let angle = await findMiningAngle();
if (angle === null) {
    console.log("[laser] kein Winkel gefunden, bei dem abgebaut wird");
    await deactivateLaser();
    process.exit(1);
}

while (true) {
    const { stone, free } = await loadedStone();
    console.log(`[mining] Stein ${stone} | frei ${free}`);
    if (free === 0) {
        break;
    }

    const state = await getLaserState();
    if (state.is_cooling_down) {
        console.log("[laser] kühlt ab ...");
    } else if (!state.is_active) {
        await ensureActive();
        await setLaserAngle(angle);
    } else if (!state.is_mining) {
        angle = (await findMiningAngle()) ?? angle;
    }

    await sleep(POLL_MS);
}

await deactivateLaser();
console.log("Laderaum voll - Laser aus, fliege zur Vesta Station ...");
await setTarget(VESTA.coordinates);
await waitUntilInReach(VESTA.name);
console.log("Bei der Vesta Station angedockt!");
