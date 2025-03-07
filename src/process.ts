import axios from "axios";
import { config } from "./config";
import logger from "./logger";
import { VatsimData } from "./types";
import { BrokerAsPromised } from "rascal";
import { randomUUID } from "crypto";

const VATSIM_TYPES = ["pilots", "controllers", "atis", "prefiles"] as const;

export async function ingestAndProcess(broker: BrokerAsPromised) {
  const data = await fetchVatsimData();
  if (!data) {
    logger.error("Failed to fetch VATSIM data");
    return;
  }

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

async function fetchVatsimData(): Promise<VatsimData | null> {
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
