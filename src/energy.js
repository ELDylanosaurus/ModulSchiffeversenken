import { SHIP_IP } from "./Ship.js";

// Energy-Management läuft im Aktiv-Passiv-Modus mit 2 Nodes.
// Lesen geht auf beiden, schreiben nur auf dem aktiven - und welcher
// aktiv ist, wechselt. Darum vor jedem Schreiben neu nachschauen.
const NODES = [2032, 2033].map((port) => `http://${SHIP_IP}:${port}`);
const HTTP_TIMEOUT_MS = 2000;

export async function findActiveNode() {
    for (const node of NODES) {
        try {
            const response = await fetch(`${node}/status`, {
                signal: AbortSignal.timeout(HTTP_TIMEOUT_MS)
            });
            const status = await response.json();
            if (status.role === "active") {
                return node;
            }
        } catch {
            // Node nicht erreichbar -> nächsten probieren
        }
    }
    throw new Error("kein aktiver Energy-Management-Node gefunden");
}

// Setzt die gewünschten Limits, falls sie nicht schon stimmen.
// Gibt true zurück, wenn etwas geändert wurde.
export async function ensureLimits(wanted) {
    const node = await findActiveNode();

    const response = await fetch(`${node}/limits`, {
        signal: AbortSignal.timeout(HTTP_TIMEOUT_MS)
    });
    const limits = await response.json();

    const wrong = Object.keys(wanted).filter((key) => limits[key] !== wanted[key]);
    if (wrong.length === 0) {
        return false;
    }

    const putResponse = await fetch(`${node}/limits`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ ...limits, ...wanted }),
        signal: AbortSignal.timeout(HTTP_TIMEOUT_MS)
    });
    const result = await putResponse.json();
    if (result.kind !== "success") {
        throw new Error(`PUT /limits auf ${node}: ${JSON.stringify(result)}`);
    }

    console.log(`[energy] ${node} (aktiv): ${wrong.join(", ")} gesetzt`);
    return true;
}
