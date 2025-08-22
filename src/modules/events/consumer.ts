import amqp from "amqplib"
import config from "../../config/config";
import processEvent from "./eventService";
import logger from "./logger";

const rabbitmq = config.rabbitmq;
const retry = config.retry;

export default async function startConsumer(): Promise<void> {
    const connection = await amqp.connect(rabbitmq.url);
    const channel = await connection.createChannel();

    await channel.assertQueue(rabbitmq.queue, { durable: true });
    await channel.assertQueue(rabbitmq.dql, { durable: true });

    channel.consume(rabbitmq.queue, async (msg) => {
        if (msg != null) {
            const event = JSON.parse(msg.content.toString());

            let attempts = 0;

            while (attempts < retry.maxAttempts) {
                try {
                    await processEvent(event);

                    channel.ack(msg);

                    return;
                } catch (error: any) {
                    attempts++;

                    logger.error(`Erro processando evento. Tentativa ${attempts}: ${error.message}`);

                    await new Promise(r => setTimeout(r, retry.delay));
                }

                channel.sendToQueue(rabbitmq.dql, Buffer.from(JSON.stringify(event)));
                channel.ack(msg);

                logger.warn(`Mensagem enviada para DLQ: ${rabbitmq.dql}`);
            }
        }
    });
}

module.exports = { startConsumer };