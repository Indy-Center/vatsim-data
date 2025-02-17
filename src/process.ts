import { createHash } from "crypto";
import { db } from "./db";
import { VatsimDataResponse } from "./types";
import { Pilot } from "./db/schema";
import logger from "./logger";

export async function process(data: VatsimDataResponse) {
  const hash = hashVatsimData(data);

  logger.info(`Processing data with hash ${hash}`);
  if (await db("vatsim_data").where("hash", hash).first()) {
    logger.info(`Skipping duplicate data`);
    return;
  }

  logger.info(`Processing new data`);
  // Insert the new record
  await db("vatsim_data").insert({
    hash: hash,
    data: data,
  });

  // Process sub-records
  await processPilots(data);

  // Remove all vatsim data entries for the last 10 minutes
  await db("vatsim_data")
    .where("created_at", "<", new Date(Date.now() - 10 * 60 * 1000))
    .delete();
}

async function processPilots(data: VatsimDataResponse) {
  const pilots = data.pilots;
  logger.info(`Processing ${pilots.length} pilots`);

  await db.transaction(async (tx) => {
    // Clear existing pilots
    await tx("pilots").truncate();

    // Insert all current pilots
    const pilotRecords = pilots.map((pilot) => ({
      cid: pilot.cid,
      hash: hashPilot(pilot),
      callsign: pilot.callsign,
      name: pilot.name,
      qnh_mb: pilot.qnh_mb,
      qnh_i_hg: pilot.qnh_i_hg,
      heading: pilot.heading,
      altitude: pilot.altitude,
      latitude: pilot.latitude,
      longitude: pilot.longitude,
      groundspeed: pilot.groundspeed,
      transponder: pilot.transponder,
      military_rating: pilot.military_rating,
      pilot_rating: pilot.pilot_rating,
    }));

    await tx("pilots").insert(pilotRecords);
    logger.info(`Processed ${pilots.length} pilots`);
  });
}

function hashPilot(pilot: VatsimDataResponse["pilots"][number]) {
  const key = {
    cid: pilot.cid,
    callsign: pilot.callsign,
    logon_time: pilot.logon_time,
  };
  return createHash("sha256").update(JSON.stringify(key)).digest("hex");
}

function hashVatsimData(data: VatsimDataResponse) {
  return createHash("sha256").update(JSON.stringify(data)).digest("hex");
}
