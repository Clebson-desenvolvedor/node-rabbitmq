import amqp from "amqplib";
import config from "../../../src/config/config";
import logger from "../../../src/modules/events/logger";
import processEvent from "../../../src/modules/events/eventService";
import startConsumer from "../../../src/modules/events/consumer";

jest.mock("amqplib");
jest.mock("../../../src/modules/events/eventService");
jest.mock("../../../src/modules/events/logger", () => ({
    __esModule: true,
    default: {
        warn: jest.fn(),
        error: jest.fn(),
        info: jest.fn(),
    },
}));

jest.mock("../../../src/config/config", () => ({
    __esModule: true,
    default: {
        retry: {
            maxAttempts: 10,
            delay: 10,
        },
        rabbitmq: {
            dlq: "orders_dlq",
            queue: "orders_queue",
            url: "amqp://ADMIN:ADMIN@rabbitmq:5672",
        },
    },
}));

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
        (amqp.connect as jest.Mock).mockReset();
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
            .mockImplementationOnce(() => Promise.reject(new Error("Falha")))
            .mockImplementationOnce(() => Promise.resolve(mockConnection));

        await startConsumer();

        expect(logger.error).not.toHaveBeenCalled();
        expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining("Tentativa 1"));
        expect(amqp.connect).toHaveBeenCalledTimes(2);
    }, 10000);


    it("deve lançar erro se não conseguir conectar ao RabbitMQ após múltiplas tentativas", async () => {
        (amqp.connect as jest.Mock).mockRejectedValue(new Error("qualquer erro"));

        await expect(startConsumer()).rejects.toThrow(
            new Error("Não foi possível conectar ao RabbitMQ após múltiplas tentativas.")
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

        expect(processEvent).toHaveBeenCalledTimes(10);

        expect(mockChannel.sendToQueue).toHaveBeenCalledWith(
            "orders_dlq",
            Buffer.from(JSON.stringify({ id: "123", type: "ORDER_CREATED" }))
        );

        expect(mockChannel.ack).toHaveBeenCalledWith(fakeMsg);

        expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining(`Mensagem enviada para DLQ`));
    }, 70000);

    it("deve logar erro e lançar exceção se falhar ao iniciar o consumidor", async () => {
        (amqp.connect as jest.Mock).mockResolvedValue(mockConnection);

        mockConnection.createChannel.mockRejectedValue(new Error("Erro ao criar canal"));

        await expect(startConsumer()).rejects.toThrow("Erro ao criar canal");

        expect(logger.error).toHaveBeenCalledWith(
            expect.stringContaining("Erro ao iniciar consumidor: Erro ao criar canal")
        );
    });
});
