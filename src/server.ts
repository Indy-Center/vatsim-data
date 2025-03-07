import { BrokerAsPromised } from "rascal";
import { config } from "./config";
import logger from "./logger";
import { ingestAndProcess } from "./process";
import rabbitConfig from "./rabbitConfig";

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

  // Create Rascal broker
  const broker = await BrokerAsPromised.create(rabbitConfig);

  broker.on("error", (err) => {
    logger.error(`Broker error: ${err}`);
  });

  // Initial Fetch when Application Starts
  await ingestAndProcess(broker);

  // Fetch VATSIM Data on config.REFRESH_INTERVAL_MS and publish
  logger.info(`Fetching VATSIM Data every ${config.REFRESH_INTERVAL_MS}ms`);
  setInterval(async () => {
    await ingestAndProcess(broker);
  }, config.REFRESH_INTERVAL_MS);
}

main().catch((error) => {
  logger.error(`Fatal error: ${error}`);
  process.exit(1);
});
