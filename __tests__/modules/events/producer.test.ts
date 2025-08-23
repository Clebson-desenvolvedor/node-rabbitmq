import amqp from "amqplib";
import logger from "../../../src/modules/events/logger";
import publishMessage from "../../../src/modules/events/producer";

jest.mock("amqplib");
jest.mock("../../../src/modules/events/logger");

describe("publishMessage", () => {
    const mockChannel = {
        assertQueue: jest.fn(),
        sendToQueue: jest.fn(),
    };

    const mockConnection = {
        createChannel: jest.fn().mockResolvedValue(mockChannel),
        close: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
        jest.useFakeTimers();
        (amqp.connect as jest.Mock).mockResolvedValue(mockConnection);
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it("deve publicar uma mensagem na fila e fechar a conexão", async () => {
        const evento = { id: "123", type: "ORDER_CREATED" };

        await publishMessage(evento);

        expect(amqp.connect).toHaveBeenCalled();
        expect(mockConnection.createChannel).toHaveBeenCalled();
        expect(mockChannel.assertQueue).toHaveBeenCalledWith(expect.any(String), { durable: true });

        expect(mockChannel.sendToQueue).toHaveBeenCalledWith(
            expect.any(String),
            Buffer.from(JSON.stringify(evento)),
            { persistent: true }
        );

        expect(logger.info).toHaveBeenCalledWith(expect.stringContaining("Mensagem publicada na fila"));

        jest.advanceTimersByTime(500);

        expect(mockConnection.close).toHaveBeenCalled();
    });
});