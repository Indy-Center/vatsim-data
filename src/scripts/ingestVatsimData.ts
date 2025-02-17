import axios from "axios";
import { process as processVatsimData } from "../process";
import "dotenv/config";

async function ingestVatsimData() {
    const response = await axios.get("https://data.vatsim.net/v3/vatsim-data.json");
    
    await processVatsimData(response.data);
}

ingestVatsimData().then(() => process.exit(0));
