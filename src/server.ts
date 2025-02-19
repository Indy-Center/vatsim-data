import axios from "axios";
import { config } from "./config";
import logger from "./logger";
import * as zmq from "zeromq";

process.on("SIGINT", () => {
  logger.info("SIGINT received, shutting down...");
  process.exit(0);
});

process.on("SIGTERM", () => {
  logger.info("SIGTERM received, shutting down...");
  process.exit(0);
});

async function main() {
  logger.info("Starting VATSIM Data Ingestor");

  // Create ZMQ Socket for Broadcasting
  const sock = new zmq.Publisher();
  await sock.bind(`tcp://${config.ZMQ_HOST}:${config.ZMQ_PORT}`);

  // Initial Fetch when Application Starts
  await ingestAndBroadcast(sock);

  // Fetch VATSIM Data on config.REFRESH_INTERVAL_MS and publish.
  logger.info(`Fetching VATSIM Data every ${config.REFRESH_INTERVAL_MS}ms`);
  setInterval(async () => {
    await ingestAndBroadcast(sock);
  }, config.REFRESH_INTERVAL_MS);
}

async function ingestAndBroadcast(sock: zmq.Publisher) {
  const message = await ingest();

  if (message) {
    await sock.send(JSON.stringify(message));
  }
}

async function ingest() {
  try {
    logger.debug("Fetching VATSIM Data");
    const response = await axios.get(config.VATSIM_DATA_URL);

    let message = {
      timestamp: new Date().toISOString(),
      data: response.data,
    };

    logger.silly(`Data: ${JSON.stringify(message.data)}`);

    logger.debug(
      `Broadcasting VATSIM Data: ${message.data.controllers.length} controllers, ${message.data.pilots.length} pilots, ${message.data.servers.length} servers, ${message.data.atis.length} atis, ${message.data.prefiles.length} pre-files.`
    );

    return message;
  } catch (error) {
    logger.error(`Error ingesting VATSIM Data: ${error}`);
    return null;
  }
}

main();
