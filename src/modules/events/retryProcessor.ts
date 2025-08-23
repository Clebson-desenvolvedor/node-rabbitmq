
import logger from "./logger";
import config from "../../config/config";

export async function processWithRetry<T>(
    task: () => Promise<T>,
    onFailure: () => void,
    context: string
): Promise<void> {
    const maxAttempts = config.retry.maxAttempts;
    const delay = config.retry.delay;

    let attempts = 0;

    while (attempts < maxAttempts) {
        try {
            await task();
            return;
        } catch (error: any) {
            attempts++;
            logger.error(`[${context}] Erro na tentativa ${attempts}: ${error.message}`);
            await new Promise((res) => setTimeout(res, delay));
        }
    }

    logger.warn(`[${context}] Todas as tentativas falharam. Executando fallback.`);
    onFailure();
}
