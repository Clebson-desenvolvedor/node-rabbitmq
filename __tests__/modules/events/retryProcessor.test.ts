import { processWithRetry } from "../../../src/modules/events/retryProcessor";

jest.mock("../../../src/config/config", () => ({
    retry: {
        maxAttempts: 10,
        delay: 10,
    },
}));

describe("processWithRetry", () => {
    const context = "TestContext";

    it("deve executar a tarefa com sucesso na primeira tentativa", async () => {
        const task = jest.fn().mockResolvedValue(undefined);
        const onFailure = jest.fn();

        await processWithRetry(task, onFailure, context);

        expect(task).toHaveBeenCalledTimes(1);
        expect(onFailure).not.toHaveBeenCalled();
    });

    it("deve executar a tarefa com sucesso após algumas falhas", async () => {
        const task = jest
            .fn()
            .mockRejectedValueOnce(new Error("fail"))
            .mockRejectedValueOnce(new Error("fail"))
            .mockResolvedValue(undefined);
        const onFailure = jest.fn();

        await processWithRetry(task, onFailure, context);

        expect(task).toHaveBeenCalledTimes(3);
        expect(onFailure).not.toHaveBeenCalled();
    });

    it("deve chamar onFailure após todas as tentativas falharem", async () => {
        const task = jest.fn().mockRejectedValue(new Error("fail"));
        const onFailure = jest.fn();

        await processWithRetry(task, onFailure, context);

        expect(task).toHaveBeenCalledTimes(10);
        expect(onFailure).toHaveBeenCalledTimes(1);
    });
});
