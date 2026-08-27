const SHIP_IP = "192.168.100.41";

const NAV_PORT = 2010;
const STEER_PORT = 2009;
const COMM_PORT = 2011;
const HOLD_PORT = 2012;

function url(port, path) {
    return `http://${SHIP_IP}:${port}${path}`;
}

async function getJson(port, path) {
    const response = await fetch(url(port, path));
    return response.json();
}

async function postJson(port, path, body) {
    const response = await fetch(url(port, path), {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
    });

    return response.json();
}

export async function getHold() {
    return getJson(HOLD_PORT, "/hold");
}

export async function setTarget(target) {
    return postJson(STEER_PORT, "/set_target", {
        target
    });
}

export async function buy(station, what, amount) {
    return postJson(COMM_PORT, "/buy", {
        station,
        what,
        amount
    });
}

export async function sell(station, what, amount) {
    return postJson(COMM_PORT, "/sell", {
        station,
        what,
        amount
    });
}

async function getStations() {
    return getJson(COMM_PORT, "/stations_in_reach");
}

async function getPosition() {
    return getJson(NAV_PORT, "/pos");
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export async function flyToStation(station) {
    console.log(`Fliege zu ${station} ...`);
    await setTarget(station);
    while (true) {
        await sleep(2000);
        const result = await getStations();
        if (result.stations[station]) {
            console.log(`Angekommen bei ${station}`);
            return;
        }
    }
}

export async function flyToPosition(position) {
    console.log(
        `Fliege zu (${position.x}, ${position.y}) ...`
    );
    await setTarget(position);
    while (true) {
        await sleep(2000);
        const result = await getPosition();
        const pos = result.pos;
        const distance = Math.hypot(
            pos.x - position.x,
            pos.y - position.y
        );

        if (distance <= 50) {
            console.log("Position erreicht");
            return;
        }
    }
}