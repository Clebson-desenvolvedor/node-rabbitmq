import addToBatch from "../../../src/modules/events/batchProcessor";
import logger from "../../../src/modules/events/logger";
import processEvent from "../../../src/modules/events/eventService";

jest.mock("../../../src/modules/events/batchProcessor");
jest.mock("../../../src/modules/events/logger");

type EventType = "ORDER_CREATED" | "PAYMENT_CONFIRMED";

interface Event {
    id: string;
    type: EventType;
}

describe("processEvent", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("deve processar evento ORDER_CREATED e chamar addToBatch", async () => {
        const evento: Event = { id: "123", type: "ORDER_CREATED" };

        await processEvent(evento);

        expect(logger.info).toHaveBeenCalledWith("Processando pedido: 123");
        expect(addToBatch).toHaveBeenCalledWith(evento);
    });

    it("deve processar evento PAYMENT_CONFIRMED e logar confirmação", async () => {
        const evento: Event = { id: "456", type: "PAYMENT_CONFIRMED" };

        await processEvent(evento);

        expect(logger.info).toHaveBeenCalledWith("Pagamento confirmado: 456");
        expect(addToBatch).not.toHaveBeenCalled();
    });

    it("deve lançar erro para tipo de evento não suportado", async () => {
        const evento = { id: "789", type: "UNKNOWN_EVENT" } as any;

        await expect(processEvent(evento)).rejects.toThrow("Tipo de evento não suportado: UNKNOWN_EVENT");
    });
});