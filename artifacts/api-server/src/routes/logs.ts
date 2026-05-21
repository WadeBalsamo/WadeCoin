import { Router, type IRouter, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { transactionLogsTable } from "@workspace/db";
import { bookingsTable } from "@workspace/db";
import { desc, sql } from "drizzle-orm";
import { logger } from "../lib/logger";

const router: IRouter = Router();

/** Returns recent transaction logs + booking summary stats */
router.get("/logs", async (_req: Request, res: Response): Promise<void> => {
  try {
    const logs = await db
      .select()
      .from(transactionLogsTable)
      .orderBy(desc(transactionLogsTable.created_at))
      .limit(50);

    const bookings = await db
      .select({
        id: bookingsTable.id,
        user_name: bookingsTable.user_name,
        mode: bookingsTable.mode,
        created_at: bookingsTable.created_at,
        has_payment: sql<boolean>`(${bookingsTable.payment_tx_hash} IS NOT NULL)`.as("has_payment"),
      })
      .from(bookingsTable)
      .orderBy(desc(bookingsTable.created_at))
      .limit(20);

    res.json({ logs, bookings });
  } catch (err) {
    logger.error({ err }, "Error fetching logs");
    res.status(500).json({ code: "internal_error", message: "Failed to fetch logs" });
  }
});

export default router;
