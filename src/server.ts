import express from "express";
import { db } from "./db";
import dataRoutes from "./routes/data";
import logger from "./logger";

const app = express();

// Routes
app.use("/v1/data", dataRoutes);

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
            details: error.response?.data
        });
        process.exit(1);
    }
}

// Add error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    logger.error("Unhandled error", {
        error: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method
    });
    res.status(500).json({ error: "Internal server error" });
});

main();