import http from "node:http";


export function startRelay(port, onMessage) {
    const server = http.createServer((request, response) => {
        if (request.method !== "POST") {
            response.writeHead(405).end();
            return;
        }

        let body = "";
        request.on("data", (chunk) => {
            body += chunk;
        });
        request.on("end", async () => {
            try {
                const message = JSON.parse(body);
                await onMessage(message);
                response.writeHead(200, {
                    "Content-Type": "application/json"
                });
                response.end(JSON.stringify({ ok: true }));
            } catch (error) {
                response.writeHead(400).end(
                    JSON.stringify({ error: String(error) })
                );
            }
        });
    });

    server.listen(port, () => {
        console.log(`Relay hört auf Port ${port}`);
    });

    return server;
}

export async function sendToPeer(host, port, message) {
    try {
        const response = await fetch(`http://${host}:${port}/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(message)
        });
        return response.json();
    } catch (error) {
        console.error("Peer nicht erreichbar:", error.message);
    }
}
