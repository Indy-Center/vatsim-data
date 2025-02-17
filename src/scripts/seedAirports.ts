import { createWriteStream, unlink } from "fs";
import { createInterface } from "readline";
import { createReadStream } from "fs";
import { db } from "../db";
import axios from "axios";
import { mkdir } from "fs/promises";
import { dirname, join } from "path";

const AIRPORT_DB_URL = "https://raw.githubusercontent.com/ip2location/ip2location-iata-icao/master/iata-icao.csv";
const DATA_DIR = "./data";
const DOWNLOAD_PATH = join(DATA_DIR, "airports.csv");

interface AirportRecord {
    icao: string;
    iata: string;
    name: string;
    city: string;
    country: string;
    latitude: number;
    longitude: number;
    altitude: number;
}

async function downloadFile(url: string, path: string): Promise<void> {
    const response = await axios({
        method: 'GET',
        url: url,
        responseType: 'stream'
    });

    // Ensure directory exists
    await mkdir(dirname(path), { recursive: true });
    
    const writer = createWriteStream(path);
    response.data.pipe(writer);

    return new Promise<void>((resolve, reject) => {
        writer.on('finish', () => resolve());
        writer.on('error', (error) => reject(error));
    });
}

async function parseAirportLine(line: string): Promise<AirportRecord | null> {
    // Skip header line
    if (line.startsWith("country")) return null;

    // Format: country,region,iata,icao,airport,latitude,longitude
    const parts = line.split(",").map(p => p.trim().replace(/^"|"$/g, ''));
    if (parts.length !== 7) return null;

    const [country, region, iata, icao, name, lat, lon] = parts;
    
    // Skip records without ICAO codes
    if (!icao) return null;

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);

    // Validate coordinates
    if (isNaN(latitude) || isNaN(longitude) || 
        latitude < -90 || latitude > 90 || 
        longitude < -180 || longitude > 180) {
        console.warn(`Invalid coordinates for airport ${icao}: ${latitude}, ${longitude}`);
        return null;
    }

    return {
        icao: icao.toUpperCase(),  // Normalize ICAO codes to uppercase
        iata: iata ? iata.toUpperCase() : "",  // Normalize IATA codes to uppercase
        name,
        city: region,
        country,
        latitude,
        longitude,
        altitude: 0  // Altitude not provided in this dataset
    };
}

async function seedAirports() {
    console.log("Starting airport database seeding...");

    try {
        console.log("Downloading airport database...");
        await downloadFile(AIRPORT_DB_URL, DOWNLOAD_PATH);
        
        console.log("Processing airport data...");
        const fileStream = createReadStream(DOWNLOAD_PATH);
        const rl = createInterface({
            input: fileStream,
            crlfDelay: Infinity
        });

        // Use a Map to deduplicate by ICAO code
        const airportMap = new Map<string, AirportRecord>();
        let lineCount = 0;
        let duplicateCount = 0;
        
        for await (const line of rl) {
            lineCount++;
            try {
                const airport = await parseAirportLine(line);
                if (airport) {
                    if (airportMap.has(airport.icao)) {
                        duplicateCount++;
                        console.warn(`Duplicate ICAO code found: ${airport.icao} (line ${lineCount})`);
                    } else {
                        airportMap.set(airport.icao, airport);
                    }
                }
            } catch (error: any) {
                console.warn(`Error parsing line ${lineCount}: ${error.message}`);
            }
        }

        const airports = Array.from(airportMap.values());
        console.log(`Found ${airports.length} valid airports from ${lineCount} total records (${duplicateCount} duplicates removed)`);

        // Insert in batches of 100
        const BATCH_SIZE = 100;
        for (let i = 0; i < airports.length; i += BATCH_SIZE) {
            const batch = airports.slice(i, i + BATCH_SIZE);
            try {
                await db("airports").insert(batch).onConflict("icao").merge();
                console.log(`Processed ${Math.min(i + BATCH_SIZE, airports.length)}/${airports.length} airports`);
            } catch (error) {
                console.error(`Error inserting batch ${i}-${i + BATCH_SIZE}:`, error);
                throw error;
            }
        }

        // Cleanup
        console.log("Cleaning up temporary files...");
        try {
            await unlink(DOWNLOAD_PATH, () => {});
        } catch (error) {
            console.warn("Could not delete temporary file:", DOWNLOAD_PATH);
        }

        console.log("Airport database seeding completed successfully!");
    } catch (error) {
        console.error("Error seeding airport database:", error);
        throw error;
    }
}

// Run if called directly
if (require.main === module) {
    seedAirports()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
} 