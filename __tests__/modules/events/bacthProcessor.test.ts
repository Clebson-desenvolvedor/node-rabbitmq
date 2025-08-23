import addToBatch, { getBatchEvents, clearBatchEvents, startBatchProcessing }
    from "../../../src/modules/events/batchProcessor";

import logger from "../../../src/modules/events/logger";


jest.mock("../../../src/modules/events/logger", () => ({
    info: jest.fn(),
}));


describe("addToBatch", () => {
    jest.useFakeTimers();

    beforeEach(() => {
        clearBatchEvents();
    });

    it("deve adicionar um evento ao lote", async () => {
        const evento = { id: 1, nome: "teste" };
        await addToBatch(evento);

        const lote = getBatchEvents();
        expect(lote).toContain(evento);
        expect(lote.length).toBe(1);
    });


    it("deve processar o lote e limpar os eventos após o intervalo", async () => {
        startBatchProcessing();

        const evento = { id: "1", type: "ORDER_CREATED" };

        await addToBatch(evento);

        jest.runOnlyPendingTimers();

        expect(logger.info).toHaveBeenCalledWith(expect.stringContaining("Processando lote com 1 eventos"));
        expect(getBatchEvents()).toEqual([]);
    });
});