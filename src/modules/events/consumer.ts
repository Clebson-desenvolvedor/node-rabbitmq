import amqp from "amqplib";
import config from "../../config/config";
import processEvent from "./eventService";
import logger from "./logger";

const rabbitmq = config.rabbitmq;
const retry = config.retry;

export default async function startConsumer(): Promise<void> {
    let connection;
    let attempts = 0;

    while (!connection && attempts < retry.maxAttempts) {
        try {
            connection = await amqp.connect(rabbitmq.url);
        } catch (error: any) {
            attempts++;
            logger.warn(`Tentativa ${attempts} de conexão com RabbitMQ falhou: ${error.message}`);
            await new Promise((res) => setTimeout(res, retry.delay));
        }
    }

    if (!connection) throw new Error("Não foi possível conectar ao RabbitMQ após múltiplas tentativas.");

    const channel = await connection.createChannel();
    await channel.assertQueue(rabbitmq.queue, { durable: true });
    await channel.assertQueue(rabbitmq.dlq, { durable: true });

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
                    await new Promise((r) => setTimeout(r, retry.delay));
                }
            }

            channel.sendToQueue(rabbitmq.dlq, Buffer.from(JSON.stringify(event)));
            channel.ack(msg);
            logger.warn(`Mensagem enviada para DLQ: ${rabbitmq.dlq}`);
        }
    });
}