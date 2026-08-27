import { listenToScanner } from "../scanner.js";
import { setTarget } from "../ship.js";

const TARGET = "G-Station 0-4";

async function main() {
    await listenToScanner(async (data) => {

        console.log(data);

        if (data.name === TARGET) {
            await setTarget(data.pos);
        }
    });
}

main();