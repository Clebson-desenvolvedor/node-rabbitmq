import config from "../../config/config";
import logger from "./logger";

let batchEvents: any[] = [];

export function getBatchEvents() {
    return batchEvents;
}

export function clearBatchEvents() {
    batchEvents = [];
}

export default async function addToBatch(ev: any) {
    batchEvents.push(ev);
}


export function startBatchProcessing() {
    setInterval(() => {
        if (batchEvents.length > 0) {
            logger.info(`Processando lote com ${batchEvents.length} eventos`);
            batchEvents = [];
        }
    }, config.batch.interval);
}