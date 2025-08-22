import dotenv from "dotenv";
dotenv.config();

export default {
    rabbitmq: {
        url: process.env.RABBITMQ_URL || "amqp://guest@rabbitmq:5672",
        queue: process.env.RABBITMQ_QUEUE || "orders_queue",
        dql: process.env.RABBITMQ_DLQ || "orders_dlq"
    },
    batch: {
        size: parseInt(process.env.BATCH_SIZE ?? "") || 10,
        interval: parseInt(process.env.BATCH_INTERVAL ?? "")
    },
    retry: {
        maxAttempts: parseInt(process.env.RETRY_MAX_ATTEMPTS ?? "") || 3,
        delay: parseInt(process.env.RETRY_DELAY ?? "") || 2000
    },
    db: {
        url: process.env.DB_URL || "postgres://user:pass@postgress:5432/mydb"
    }
}