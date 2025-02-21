import axios from "axios";
import { config } from "./config";
import logger from "./logger";
import { BrokerAsPromised } from "rascal";
import rabbitConfig from "./rabbitConfig";
import { randomUUID } from "crypto";

const VATSIM_TYPES = ["pilots", "controllers", "atis", "prefiles"];

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
  await ingestAndPublish(broker);

  // Fetch VATSIM Data on config.REFRESH_INTERVAL_MS and publish
  logger.info(`Fetching VATSIM Data every ${config.REFRESH_INTERVAL_MS}ms`);
  setInterval(async () => {
    await ingestAndPublish(broker);
  }, config.REFRESH_INTERVAL_MS);
}

async function ingestAndPublish(broker: BrokerAsPromised) {
  const data = await ingest();
  if (!data) return;

  try {
    const batchId = randomUUID();

    await broker.publish(
      "raw.feed",
      {
        batchId,
        data,
      },
      {
        routingKey: "raw.feed",
      }
    );

    // Publish individual components
    for (const type of VATSIM_TYPES) {
      const items = data[type] || [];

      await Promise.all(
        items.map((item: any) =>
          broker.publish(
            "raw.feed",
            {
              batchId,
              data: item,
            },
            {
              routingKey: `raw.${type}`,
            }
          )
        )
      );
    }

    const counts = VATSIM_TYPES.map(
      (type) => `${type}: ${data[type]?.length || 0}`
    ).join(", ");

    logger.debug(`Published VATSIM Data - ${counts}`);
  } catch (error) {
    logger.error(`Error publishing to RabbitMQ: ${error}`);
  }
}

async function ingest() {
  try {
    logger.debug("Fetching VATSIM Data");
    const response = await axios.get(config.VATSIM_DATA_URL);

    logger.silly(`Data: ${JSON.stringify(response.data)}`);
    return response.data;
  } catch (error) {
    logger.error(`Error ingesting VATSIM Data: ${error}`);
    return null;
  }
}

main().catch((error) => {
  logger.error(`Fatal error: ${error}`);
  process.exit(1);
});
