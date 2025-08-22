import amqp from "amqplib";
import logger from "./logger";
import config from "../../config/config";

const rabbitmq = config.rabbitmq;

export default async function publishMessage(ev: any): Promise<void> {
    const connection = await amqp.connect(rabbitmq.url);
    const channel = await connection.createChannel();
    
    await channel.assertQueue(rabbitmq.queue, { durable: true });

    channel.sendToQueue(rabbitmq.queue, Buffer.from(JSON.stringify(ev)), { persistent: true });
    logger.info(`Mensagem publicada na fila: ${rabbitmq.queue}`);

    setTimeout(() => connection.close(), 500);
}