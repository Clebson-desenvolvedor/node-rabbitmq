import bodyParser from "body-parser";
import express from "express"
import logger from "./modules/events/logger";
import publishMessage from "./modules/events/producer";
import startConsumer from "./modules/events/consumer";

const app = express();

app.use(bodyParser.json());

app.post("/event", async (req, res) => {
    const event = req.body;

    await publishMessage(event);

    res.json({ status: "Evento enviado para fila", event });
});

const port = process.env.PORT || 3000;

app.listen(port, async () => {
    logger.info(`API rodando na porta ${port}`);

    await startConsumer();
});