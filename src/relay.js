import http from "node:http";

// Relay zwischen den beiden Schiff-VMs (Ports >= 5000).
// Format: { from: <Stationsname>, payload: <Inhalt unverändert> }

// Muss auf beiden VMs gleich sein. Ausweichen z.B. mit RELAY_PORT=5001
export const RELAY_PORT = Number(process.env.RELAY_PORT ?? 5000);
const HTTP_TIMEOUT_MS = 2000;

export function startRelay(onMessage, port = RELAY_PORT) {
    const server = http.createServer((request, response) => {
        if (request.method !== "POST") {
            response.writeHead(405).end();
            return;
        }

        let body = "";
        request.on("data", (chunk) => {
            body += chunk;
        });
        request.on("end", () => {
            response.writeHead(200).end();
            try {
                onMessage(JSON.parse(body));
            } catch {
                console.log(`[relay] kein JSON: ${body}`);
            }
        });
    });

    server.listen(port, "0.0.0.0", () => {
        console.log(`[relay] hört auf Port ${port}`);
    });

    return server;
}

export async function sendToPeer(peerIp, source, payload, port = RELAY_PORT) {
    try {
        await fetch(`http://${peerIp}:${port}/message`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ from: source, payload }),
            signal: AbortSignal.timeout(HTTP_TIMEOUT_MS)
        });
        console.log(`[relay] -> ${peerIp}: ${JSON.stringify(payload).length} Zeichen`);
    } catch (error) {
        console.log(`[relay] Peer nicht erreichbar: ${error.message}`);
    }
}
