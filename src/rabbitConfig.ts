import rascal from "rascal";
import { config } from "./config";

const VATSIM_TYPES = ["pilots", "controllers", "atis", "prefiles"];

// Dynamically generate publications
const publications = {
  "raw.feed": {
    exchange: "vatsim.raw",
  },
};

export default rascal.withDefaultConfig({
  vhosts: {
    "/": {
      connection: {
        url: config.RABBIT_URL,
      },
      exchanges: {
        "vatsim.raw": {
          type: "topic",
          options: { durable: true },
        },
      },
      publications,
    },
  },
});
