import express from "express";
import { db } from "./db";
import dataRoutes from "./routes/data";
import pilotsRoutes from "./routes/pilots";
import logger from "./logger";

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    version: process.env.BUILD_NUMBER || "development",
    paths: {
      data: "/v1/data",
      pilots: "/v1/pilots",
    },
  });
});

// Routes
app.use("/v1/data", dataRoutes);
app.use("/v1/pilots", pilotsRoutes);

async function main() {
  try {
    logger.info("Running database migrations...");
    await db.migrate.latest();
    logger.info("Database migrations completed");

    app.listen(3000, () => {
      logger.info("Server is running on port 3000");
    });
  } catch (error: any) {
    logger.error("Failed to start server", {
      error: error.message,
      stack: error.stack,
      code: error.code,
      details: error.response?.data,
    });
    process.exit(1);
  }
}

main();
