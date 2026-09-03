import { listenToScanner } from "../scanner.js";
import { setTarget } from "../ship.js";

const TARGET = "G-Station 0-4";

const WAIT_POSITION = {
    x: -16169,
    y: -11163
};

async function main() {

    console.log("Fliege zum Treffpunkt...");
    await setTarget(WAIT_POSITION);

    await listenToScanner(async (data) => {

        const station = data.find(
            object => object.name === TARGET
        );

        if (station) {
            console.log("G-Station gefunden:", station.pos);

            await setTarget(station.pos);
        }
    });
}

main();