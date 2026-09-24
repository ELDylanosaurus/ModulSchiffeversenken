import {
    flyToStation,
    flyToPosition,
    getHold,
    buy,
    sell
} from "../Ship.js";


const BUY_STATION = "Azura Station";
const SELL_STATION = "Core Station";

const VESTA_POS = {
    x: 7000,
    y: 7000
};

const MIN_CREDITS = 60;
const TARGET_IRON = 12;
const TRADE_AMOUNT = 5;

async function main() {
    let hold = await getHold();
    while (hold.hold.credits < MIN_CREDITS) {
        await flyToStation(BUY_STATION);
        await buy(
            BUY_STATION,
            "IRON",
            TRADE_AMOUNT
        );
        
        await flyToStation(SELL_STATION);
        await sell(
            SELL_STATION,
            "IRON",
            TRADE_AMOUNT
        );
        hold = await getHold();
    }
    while ((hold.hold.resources.IRON || 0) < TARGET_IRON) {
        await flyToStation(BUY_STATION);
        const currentIron = hold.hold.resources.IRON || 0;
        const missingIron = TARGET_IRON - currentIron;
        await buy(
            BUY_STATION,
            "IRON",
            missingIron
        );

        hold = await getHold();
    }
    await flyToPosition(VESTA_POS);
    console.log("Mission abgeschlossen!");
}
main();