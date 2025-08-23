import amqp from "amqplib";
import config from "../../../src/config/config";
import logger from "../../../src/modules/events/logger";
import processEvent from "../../../src/modules/events/eventService";
import startConsumer from "../../../src/modules/events/consumer";

jest.mock("amqplib");

jest.mock("../../../src/modules/events/eventService");
jest.mock("../../../src/modules/events/logger");

describe("startConsumer", () => {
    const mockChannel = {
        assertQueue: jest.fn(),
        consume: jest.fn(),
        ack: jest.fn(),
        sendToQueue: jest.fn(),
    };

    const mockConnection = { createChannel: jest.fn().mockResolvedValue(mockChannel) };

    beforeEach(() => {
        jest.clearAllMocks();
        (amqp.connect as jest.Mock).mockResolvedValue(mockConnection);
    });

    it("deve conectar ao RabbitMQ e configurar as filas", async () => {
        await startConsumer();

        expect(amqp.connect).toHaveBeenCalled();
        expect(mockConnection.createChannel).toHaveBeenCalled();
        expect(mockChannel.assertQueue).toHaveBeenCalledTimes(2);
        expect(mockChannel.consume).toHaveBeenCalled();
    });

    it("deve tentar reconectar em caso de erro", async () => {
        (amqp.connect as jest.Mock)
            .mockRejectedValueOnce(new Error("Falha"))
            .mockResolvedValueOnce(mockConnection);

        await startConsumer();

        expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining("Tentativa 1"));
        expect(amqp.connect).toHaveBeenCalledTimes(2);
    }, 10000);

    it("deve lançar erro se não conseguir conectar ao RabbitMQ após múltiplas tentativas", async () => {
        (amqp.connect as jest.Mock).mockRejectedValue(new Error("Falha de conexão"));

        await expect(startConsumer()).rejects.toThrow(
            "Não foi possível conectar ao RabbitMQ após múltiplas tentativas."
        );

        expect(amqp.connect).toHaveBeenCalledTimes(config.retry.maxAttempts);
    }, 80000);

    it("deve processar a mensagem recebida da fila", async () => {
        const fakeMsg = { content: Buffer.from(JSON.stringify({ id: "123", type: "ORDER_CREATED" })) };

        let consumeCallback: Function = () => { };

        mockChannel.consume.mockImplementation((_queue, cb) => consumeCallback = cb);

        await startConsumer();
        await consumeCallback(fakeMsg);

        expect(processEvent).toHaveBeenCalledWith({ id: "123", type: "ORDER_CREATED" });
        expect(mockChannel.ack).toHaveBeenCalledWith(fakeMsg);
    });

    it("deve enviar a mensagem para a DLQ após falhas no processamento", async () => {
        const fakeMsg = { content: Buffer.from(JSON.stringify({ id: "123", type: "ORDER_CREATED" })) };

        let consumeCallback: Function = () => { };

        mockChannel.consume.mockImplementation((_queue, cb) => consumeCallback = cb);

        (processEvent as jest.Mock).mockRejectedValue(new Error("Erro no processamento"));

        await startConsumer();
        await consumeCallback(fakeMsg);

        expect(processEvent).toHaveBeenCalledTimes(config.retry.maxAttempts);

        expect(mockChannel.sendToQueue).toHaveBeenCalledWith(
            config.rabbitmq.dlq,
            Buffer.from(JSON.stringify({ id: "123", type: "ORDER_CREATED" }))
        );

        expect(mockChannel.ack).toHaveBeenCalledWith(fakeMsg);

        expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining(`Mensagem enviada para DLQ`));
    }, 70000);
});