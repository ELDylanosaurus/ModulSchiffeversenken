const shipName = process.argv[2];
const targetIp = process.argv[3];

const ownShipIp = "192.168.100.41";
const laserUrl = `http://${ownShipIp}:2018`;

console.log("Mission 4 gestartet");
console.log("Eigenes Schiff:", shipName);
console.log("Zielschiff:", targetIp);
console.log("Eigener Laser:", laserUrl);

async function getLaserState() {
    try {
        const response = await fetch(`${laserUrl}/state`);
        const data = await response.json();

        console.log("Laser-Status:", data);
    } catch (error) {
        console.error("Fehler beim Laser:", error.message);
    }
}

getLaserState();