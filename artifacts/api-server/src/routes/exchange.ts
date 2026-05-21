import { Router, type IRouter, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { transactionLogsTable } from "@workspace/db";
import { logger } from "../lib/logger";
import { z } from "zod";

const router: IRouter = Router();

/** Exchange rate — 1 WADE = 0.1 ETH on testnet (contracts undeployed) */
router.get("/exchange/rate", (_req: Request, res: Response): void => {
  res.json({
    eth_per_wade: "1",
    wade_per_eth: ".1",
    network: "testnet",
    deployed: false,
    note: "Smart contracts are not yet deployed. Exchange is in demo mode.",
  });
});

const ExchangeSimulateSchema = z.object({
  wallet_address: z.string().min(1),
  wade_amount: z.string().min(1),
  eth_amount_wei: z.string().min(1),
});

/**
 * Records a simulated exchange attempt (no real contract call — contracts
 * are undeployed). Used for the demo and transaction log.
 */
router.post(
  "/exchange/simulate",
  async (req: Request, res: Response): Promise<void> => {
    const parsed = ExchangeSimulateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        code: "validation_error",
        message: parsed.error.errors.map((e) => e.message).join(", "),
      });
      return;
    }

    const { wallet_address, wade_amount, eth_amount_wei } = parsed.data;

    try {
      await db.insert(transactionLogsTable).values({
        event_type: "exchange_attempt",
        wallet_address: wallet_address.toLowerCase(),
        amount_wei: eth_amount_wei,
        token_symbol: "ETH",
        notes: JSON.stringify({
          wade_requested: wade_amount,
          rate: "0.1 ETH per WADE",
          status: "simulated — contract undeployed",
        }),
      });

      logger.info({ wallet_address, wade_amount }, "Exchange simulation recorded");

      res.status(201).json({
        simulated: true,
        wade_amount,
        eth_amount_wei,
        message: "Exchange recorded in demo log. Actual WADE transfer will execute once contracts are deployed.",
      });
    } catch (err) {
      logger.error({ err }, "Error recording exchange simulation");
      res.status(500).json({ code: "internal_error", message: "Failed to record exchange" });
    }
  },
);

export default router;
