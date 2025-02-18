import { Router, Request, Response } from "express";
import { db } from "../db";
import {
  asyncHandler,
  NotFoundError,
  ValidationError,
  isValidUUID,
} from "../utils/errors";

const router = Router();

router.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const pilots = await db("pilots").select();
    res.json(pilots || []);
  })
);

router.get(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!isValidUUID(id)) {
      throw new ValidationError("Invalid pilot ID format");
    }

    const pilot = await db("pilots").where("id", id).first();

    if (!pilot) {
      throw new NotFoundError(`Pilot ${id} not found`);
    }

    res.json(pilot);
  })
);

export default router;
