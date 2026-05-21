import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const transactionLogsTable = pgTable("transaction_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  event_type: text("event_type").notNull(), // 'booking_created' | 'exchange_attempt' | 'faucet_drip'
  user_name: text("user_name"),
  user_email: text("user_email"),
  wallet_address: text("wallet_address"),
  tx_hash: text("tx_hash"),
  amount_wei: text("amount_wei"),
  token_symbol: text("token_symbol"),   // 'WADE' | 'ETH'
  booking_id: uuid("booking_id"),
  mode: text("mode"),                   // 'discovery' | 'consulting'
  notes: text("notes"),
  created_at: timestamp("created_at").notNull().defaultNow(),
});

export type TransactionLog = typeof transactionLogsTable.$inferSelect;
