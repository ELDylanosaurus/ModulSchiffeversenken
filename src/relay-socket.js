import net from "node:net";

// Rohe TCP-Verbindung zwischen den beiden Schiff-VMs.
// Protokoll: eine JSON-Nachricht pro Zeile ("\n" als Trenner).

// Server: nimmt Verbindungen der anderen VM an. Port >= 5000.
export function startRelay(port, onMessage) {
    const server = net.createServer((socket) => {
        console.log("Peer verbunden:", socket.remoteAddress);
        let buffer = "";

        socket.on("data", (chunk) => {
            buffer += chunk.toString();

            let newlineIndex;
            while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
                const line = buffer.slice(0, newlineIndex);
                buffer = buffer.slice(newlineIndex + 1);
                if (line.trim() === "") {
                    continue;
                }
                try {
                    onMessage(JSON.parse(line));
                } catch (error) {
                    console.error("Ungültige Nachricht:", line, error.message);
                }
            }
        });

        socket.on("error", (error) => {
            console.error("Socket-Fehler:", error.message);
        });
    });

    server.listen(port, () => {
        console.log(`Relay (TCP) hört auf Port ${port}`);
    });

    return server;
}

// Client: hält eine Verbindung zur anderen VM offen und schickt Nachrichten.
export function connectToPeer(host, port) {
    let socket = null;
    let connected = false;

    function connect() {
        socket = net.createConnection({ host, port }, () => {
            connected = true;
            console.log(`mit Peer verbunden: ${host}:${port}`);
        });

        socket.on("error", (error) => {
            console.error("Peer-Verbindung:", error.message);
        });

        socket.on("close", () => {
            connected = false;
            setTimeout(connect, 1000); // automatisch neu verbinden
        });
    }

    connect();

    return {
        send(message) {
            if (connected && socket) {
                socket.write(JSON.stringify(message) + "\n");
            }
        }
    };
}
