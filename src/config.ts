import "dotenv/config";

export const config = {
  REFRESH_INTERVAL_MS: Number.parseInt(process.env.REFRESH_INTERVAL_MS!),
  ZMQ_PORT: Number.parseInt(process.env.ZMQ_PORT!),
  ZMQ_HOST: process.env.ZMQ_HOST!,
  LOG_LEVEL: process.env.LOG_LEVEL!,
  VATSIM_DATA_URL: process.env.VATSIM_DATA_URL!,
};
