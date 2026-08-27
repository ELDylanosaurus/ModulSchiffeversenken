import amqp from "amqplib";

const RABBITMQ_URL = "amqp://guest:guest@192.168.100.41:2014";
const EXCHANGE = "scanner/detected_objects";

export async function listenToScanner(callback) {
    const connection = await amqp.connect(RABBITMQ_URL);
    const channel = await connection.createChannel();

    await channel.assertExchange(
        EXCHANGE,
        "fanout",
        { durable: false }
    );
    const queue = await channel.assertQueue(
        "",
        { exclusive: true }
    );
    await channel.bindQueue(
        queue.queue,
        EXCHANGE,
        ""
    );
    console.log("Warte auf Scanner-Nachrichten ...");
    channel.consume(
        queue.queue,
        (message) => {
            if (!message) {
                return;
            }
            const data = JSON.parse(
                message.content.toString()
            );
            callback(data);
        },
        {
            noAck: true
        }
    );
}