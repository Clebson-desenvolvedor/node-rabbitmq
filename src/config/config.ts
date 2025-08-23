import dotenv from "dotenv";
dotenv.config();

export default {
    rabbitmq: {
        url: process.env.RABBITMQ_URL!,
        queue: process.env.RABBITMQ_QUEUE!,
        dlq: process.env.RABBITMQ_DLQ!
    },
    batch: {
        size: parseInt(process.env.BATCH_SIZE ?? "")!,
        interval: parseInt(process.env.BATCH_INTERVAL ?? "")!
    },
    retry: {
        maxAttempts: parseInt(process.env.RETRY_MAX_ATTEMPTS ?? "")!,
        delay: parseInt(process.env.RETRY_DELAY ?? "") || 5000
    },
    db: {
        url: process.env.DB_URL || "postgres://user:pass@postgress:5432/mydb"
    }
}