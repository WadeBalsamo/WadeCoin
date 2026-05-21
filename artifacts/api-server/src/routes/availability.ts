import { Router, type IRouter, type Request, type Response } from "express";
import { getAvailableSlots } from "../services/googleCalendar";
import { logger } from "../lib/logger";
import { z } from "zod";

const router: IRouter = Router();

const QuerySchema = z.object({
  start:    z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "start must be YYYY-MM-DD"),
  end:      z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "end must be YYYY-MM-DD"),
  duration: z.coerce.number().int().min(15).max(480).default(30),
  allowed_hours: z.string().optional(),
});

router.get("/availability", async (req: Request, res: Response): Promise<void> => {
  const parsed = QuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({
      code: "validation_error",
      message: parsed.error.errors.map((e) => e.message).join(", "),
    });
    return;
  }

  const { start, end, duration, allowed_hours } = parsed.data;
  const allowedHours = allowed_hours ? allowed_hours.split(",").map((h) => parseInt(h, 10)).filter((h) => !isNaN(h)) : undefined;

  try {
    const slots = await getAvailableSlots(start, end, duration, undefined, allowedHours);
    res.json({ slots });
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === "calendar_unconfigured") {
      res.status(503).json({ code, message: (err as Error).message });
      return;
    }
    logger.error({ err }, "Error fetching availability");
    res.status(500).json({ code: "internal_error", message: "Failed to fetch availability" });
  }
});

export default router;
