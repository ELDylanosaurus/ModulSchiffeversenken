const RECONNECT_DELAY_MS = 2000;
const CONNECT_TIMEOUT_MS = 15000;

function short(payload) {
    const text = JSON.stringify(payload);
    return text.length > 60 ? `${text.slice(0, 60)}...` : text;
}

export async function connectToStation(name, wsUrl, field, onPayload) {
    let socket = null;
    let markReady;
    const ready = new Promise((resolve) => {
        markReady = resolve;
    });

    function connect() {
        const ws = new WebSocket(wsUrl);

        ws.addEventListener("open", () => {
            socket = ws;
            markReady();
            console.log(`[${name}] verbunden`);
        });

        ws.addEventListener("message", (event) => {
            let data;
            try {
                data = JSON.parse(event.data);
            } catch {
                console.log(`[${name}] kein JSON: ${event.data}`);
                return;
            }
            const payload = data[field];
            if (payload === undefined) {
                console.log(`[${name}] ohne '${field}': ${event.data}`);
                return;
            }
            console.log(`[${name}] <- ${short(payload)}`);
            onPayload(payload);
        });

        ws.addEventListener("error", () => {
            console.log(`[${name}] WebSocket-Fehler`);
        });

        ws.addEventListener("close", (event) => {
            socket = null;
            console.log(`[${name}] getrennt (${event.code}), neuer Versuch ...`);
            setTimeout(connect, RECONNECT_DELAY_MS);
        });
    }

    connect();
    await Promise.race([
        ready,
        new Promise((resolve) => setTimeout(resolve, CONNECT_TIMEOUT_MS))
    ]);

    return function sendToStation(payload, source) {
        if (!socket) {
            console.log(`[${name}] nicht verbunden, Nachricht verworfen`);
            return;
        }
        socket.send(JSON.stringify({ source, [field]: payload }));
        console.log(`[${name}] -> ${short(payload)}`);
    };
}
