import amqp from "amqplib";
import config from "../../config/config";
import logger from "./logger";
import processEvent from "./eventService";
import { processWithRetry } from "./retryProcessor";

const rabbitmq = config.rabbitmq;

async function startConsumer() {
    let connection;
    let attempts = 0;

    while (!connection && attempts < config.retry.maxAttempts) {
        try {
            connection = await amqp.connect(rabbitmq.url);
        } catch (error: any) {
            attempts++;
            logger.warn(`Tentativa ${attempts} de conexão com RabbitMQ falhou: ${error.message}`);
            await new Promise((res) => setTimeout(res, config.retry.delay));
        }
    }

    if (!connection) {
        throw new Error("Não foi possível conectar ao RabbitMQ após múltiplas tentativas.");
    }

    try {
        const channel = await connection.createChannel();

        await channel.assertQueue(rabbitmq.queue, { durable: true });
        await channel.assertQueue(rabbitmq.dlq, { durable: true });

        channel.consume(rabbitmq.queue, async (msg) => {
            if (msg != null) {
                const event = JSON.parse(msg.content.toString());

                await processWithRetry(
                    () => processEvent(event),
                    () => {
                        channel.sendToQueue(rabbitmq.dlq, Buffer.from(JSON.stringify(event)));
                        logger.warn(`Mensagem enviada para DLQ: ${rabbitmq.dlq}`);
                    },
                    `Processamento de evento ${event.id}`
                );

                channel.ack(msg);
            }
        });

        logger.info(`Consumidor iniciado na fila: ${rabbitmq.queue}`);
    } catch (error: any) {
        logger.error(`Erro ao iniciar consumidor: ${error.message}`);
        throw error;
    }
}

export default startConsumer;
