import axios from "axios";
import { process as processVatsimData } from "../process";
import logger from "../logger";
import { db } from "../db";

const INTERVAL_MS = 15000; // 15 seconds
let isShuttingDown = false;

// Handle graceful shutdown
process.on('SIGTERM', () => {
    logger.info('Received SIGTERM signal, initiating graceful shutdown');
    isShuttingDown = true;
});

process.on('SIGINT', () => {
    logger.info('Received SIGINT signal, initiating graceful shutdown');
    isShuttingDown = true;
});

async function ingestVatsimData() {
    try {
        const response = await axios.get("https://data.vatsim.net/v3/vatsim-data.json");
        await processVatsimData(response.data);
    } catch (error: any) {
        logger.error('Failed to ingest VATSIM data', { 
            error: error.message,
            details: error.response?.data || error.stack
        });
    }
}

async function runLoop() {
    try {
        logger.info("Running database migrations...");
        await db.migrate.latest();
        logger.info("Database migrations completed");

        logger.info('Starting VATSIM data ingestion loop');
        
        while (!isShuttingDown) {
            const startTime = Date.now();
            
            await ingestVatsimData();
            
            // Calculate how long to wait until next run
            const elapsed = Date.now() - startTime;
            const waitTime = Math.max(0, INTERVAL_MS - elapsed);
            
            if (!isShuttingDown && waitTime > 0) {
                await new Promise(resolve => setTimeout(resolve, waitTime));
            }
        }
        
        logger.info('Gracefully shutting down ingestion loop');
        process.exit(0);
    } catch (error: any) {
        logger.error('Failed to start ingestion loop', { 
            error: error.message,
            stack: error.stack,
            code: error.code,
            details: error.response?.data
        });
        process.exit(1);
    }
}

// Start the loop if this file is run directly
if (require.main === module) {
    runLoop();
} 