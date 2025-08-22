import addToBatch from "./batchProcessor";
import logger from "./logger";

type EventType = "ORDER_CREATED" | "PAYMENT_CONFIRMED";

interface Event {
    id: string;
    type: EventType;
}

const strategies: Record<EventType, (ev: Event) => Promise<void>> = {
    ORDER_CREATED: async (ev) => {
        logger.info(`Processando pedido: ${ev.id}`);

        await addToBatch(ev);
    },
    PAYMENT_CONFIRMED: async (ev) => {
        logger.info(`Pagamento confirmado: ${ev.id}`);
    }
};

export default async function processEvent(ev: Event) {
    const strategy = strategies[ev.type];
    if (strategy) {
        return strategy(ev);
    }

    throw new Error(`Tipo de evento não suportado: ${ev.type}`);
}
