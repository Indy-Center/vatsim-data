import { Router } from "express";
import { db } from "../db";

const router = Router();

router.get("/", async (req, res) => {
  const data = await db("vatsim_data")
    .select()
    .orderBy("created_at", "desc")
    .first();

  res.json(data);
});

export default router;
