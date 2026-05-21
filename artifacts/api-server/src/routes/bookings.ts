import { Router, type IRouter, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { bookingsTable, transactionLogsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { verifyErc20Transfer } from "../services/wallet";
import { buildAppConfig } from "../services/config";
import { sendBookingNotification } from "../services/email";
import { logger } from "../lib/logger";
import { ethers } from "ethers";
import { z } from "zod";

function handleDbUniqueViolation(err: unknown): { code: string; message: string } | null {
  if (
    typeof err === "object" && err !== null && "code" in err &&
    (err as { code: unknown }).code === "23505"
  ) {
    const constraint = (err as { constraint?: string }).constraint ?? "";
    if (constraint === "bookings_slot_id_unique")
      return { code: "slot_taken", message: "This time slot has already been booked" };
    if (constraint === "bookings_payment_tx_hash_unique")
      return { code: "payment_already_used", message: "This payment transaction has already been used for another booking" };
    return { code: "conflict", message: "A unique constraint was violated" };
  }
  return null;
}

const router: IRouter = Router();

const BookingRequestSchema = z.object({
  user_name: z.string().min(1),
  user_email: z.string().email(),
  notes: z.string().nullable().optional(),
  payment_tx_hash: z.string().nullable().optional(),
  mode: z.enum(["discovery", "consulting"]),
  package_hours: z.number().int().positive().nullable().optional(),
  user_address: z.string().nullable().optional(),
});

router.post("/bookings", async (req: Request, res: Response): Promise<void> => {
  const parsed = BookingRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      code: "validation_error",
      message: parsed.error.errors.map((e) => e.message).join(", "),
    });
    return;
  }

  const body = parsed.data;

  try {
    const normalizedAddress = body.user_address?.toLowerCase() ?? null;

    // ── Discovery ───────────────────────────────────────────────────────────
    if (body.mode === "discovery") {
      if (!body.payment_tx_hash) {
        res.status(400).json({ code: "missing_payment", message: "A WadeCoin testnet payment is required to book a discovery call" });
        return;
      }

      const existingTx = await db
        .select({ id: bookingsTable.id })
        .from(bookingsTable)
        .where(eq(bookingsTable.payment_tx_hash, body.payment_tx_hash))
        .limit(1);

      if (existingTx.length > 0) {
        res.status(409).json({ code: "payment_already_used", message: "This payment transaction has already been used for another booking" });
        return;
      }

      const rpcUrlTestnet = process.env["RPC_URL_TESTNET"];
      if (!rpcUrlTestnet) {
        res.status(503).json({ code: "rpc_unavailable", message: "Testnet RPC not configured; cannot verify discovery payment" });
        return;
      }

      const config = buildAppConfig();
      const valid = await verifyErc20Transfer(
        body.payment_tx_hash, config.wadecoin_testnet.owner_address,
        config.wadecoin_testnet.contract_address,
        BigInt(config.wadecoin_testnet.payment_amount_wei), rpcUrlTestnet,
        { exactAmount: true },
      );
      if (!valid) {
        res.status(409).json({ code: "payment_invalid", message: "Testnet payment transaction could not be verified" });
        return;
      }

      const slotId = `disc_${body.payment_tx_hash}`;

      const [booking] = await db
        .insert(bookingsTable)
        .values({
          slot_id: slotId,
          user_name: body.user_name,
          user_email: body.user_email,
          notes: body.notes ?? null,
          payment_tx_hash: body.payment_tx_hash,
          mode: body.mode,
          package_hours: null,
          user_address: normalizedAddress,
        })
        .returning();

      Promise.all([
        sendBookingNotification({
          booking_id: booking.id,
          user_name: booking.user_name,
          user_email: booking.user_email,
          mode: booking.mode,
          slot_id: booking.slot_id,
          notes: booking.notes,
          payment_tx_hash: booking.payment_tx_hash,
          package_hours: booking.package_hours,
          user_address: booking.user_address,
        }),
        db.insert(transactionLogsTable).values({
          event_type: "booking_created",
          user_name: booking.user_name,
          user_email: booking.user_email,
          wallet_address: booking.user_address,
          tx_hash: booking.payment_tx_hash,
          mode: booking.mode,
          booking_id: booking.id,
          notes: booking.notes,
        }),
      ]).catch((err) => logger.error({ err }, "Post-booking async tasks failed"));

      res.status(201).json({
        booking_id: booking.id,
        message: "Discovery call booked. Wade will confirm your preferred time shortly.",
      });
      return;
    }

    // ── Consulting ──────────────────────────────────────────────────────────
    if (!body.package_hours) {
      res.status(400).json({ code: "missing_package_hours", message: "package_hours is required for consulting bookings" });
      return;
    }
    if (!normalizedAddress) {
      res.status(400).json({ code: "missing_user_address", message: "user_address is required for consulting bookings" });
      return;
    }
    if (!body.payment_tx_hash) {
      res.status(400).json({ code: "missing_payment", message: "payment_tx_hash is required for consulting bookings" });
      return;
    }
    if (!ethers.isAddress(normalizedAddress)) {
      res.status(400).json({ code: "invalid_user_address", message: "user_address is not a valid Ethereum address" });
      return;
    }

    const existingTx = await db
      .select({ id: bookingsTable.id })
      .from(bookingsTable)
      .where(eq(bookingsTable.payment_tx_hash, body.payment_tx_hash))
      .limit(1);

    if (existingTx.length > 0) {
      res.status(409).json({ code: "payment_already_used", message: "This payment transaction has already been used for another booking" });
      return;
    }

    const config = buildAppConfig();
    const rpcUrl = process.env["RPC_URL_MAINNET"];
    if (!rpcUrl) {
      res.status(503).json({ code: "rpc_unavailable", message: "Mainnet RPC not configured; cannot verify payment" });
      return;
    }

    const expectedAmountWei = BigInt(body.package_hours) * BigInt(config.wadecoin_mainnet.hourly_rate_wei);
    const valid = await verifyErc20Transfer(
      body.payment_tx_hash, config.wadecoin_mainnet.owner_address,
      config.wadecoin_mainnet.contract_address, expectedAmountWei, rpcUrl,
      { expectedFrom: normalizedAddress, exactAmount: true },
    );

    if (!valid) {
      res.status(409).json({ code: "payment_invalid", message: "Payment transaction could not be verified." });
      return;
    }

    const slotId = `cons_${body.payment_tx_hash}`;

    const [booking] = await db
      .insert(bookingsTable)
      .values({
        slot_id: slotId,
        user_name: body.user_name,
        user_email: body.user_email,
        notes: body.notes ?? null,
        payment_tx_hash: body.payment_tx_hash ?? null,
        mode: body.mode,
        package_hours: body.package_hours ?? null,
        user_address: normalizedAddress,
      })
      .returning();

    Promise.all([
      sendBookingNotification({
        booking_id: booking.id,
        user_name: booking.user_name,
        user_email: booking.user_email,
        mode: booking.mode,
        slot_id: booking.slot_id,
        notes: booking.notes,
        payment_tx_hash: booking.payment_tx_hash,
        package_hours: booking.package_hours,
        user_address: booking.user_address,
      }),
      db.insert(transactionLogsTable).values({
        event_type: "booking_created",
        user_name: booking.user_name,
        user_email: booking.user_email,
        wallet_address: booking.user_address,
        tx_hash: booking.payment_tx_hash,
        mode: booking.mode,
        booking_id: booking.id,
        notes: booking.notes,
      }),
    ]).catch((err) => logger.error({ err }, "Post-booking async tasks failed"));

    res.status(201).json({
      booking_id: booking.id,
      message: "Booking confirmed! Wade will be in touch to schedule your session.",
    });
  } catch (err) {
    const uniqueErr = handleDbUniqueViolation(err);
    if (uniqueErr) { res.status(409).json(uniqueErr); return; }
    logger.error({ err }, "Unexpected error in POST /api/bookings");
    res.status(500).json({
      code: "internal_error",
      message: err instanceof Error ? err.message : "An unexpected error occurred",
    });
  }
});

export default router;
