import {
  pgTable,
  text,
  timestamp,
  integer,
  uuid,
  unique,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const bookingsTable = pgTable(
  "bookings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slot_id: text("slot_id").notNull(),
    user_name: text("user_name").notNull(),
    user_email: text("user_email").notNull(),
    notes: text("notes"),
    payment_tx_hash: text("payment_tx_hash"),
    mode: text("mode").notNull(),
    package_hours: integer("package_hours"),
    user_address: text("user_address"),
    created_at: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    unique("bookings_slot_id_unique").on(table.slot_id),
    unique("bookings_payment_tx_hash_unique").on(table.payment_tx_hash),
  ],
);

export const insertBookingSchema = createInsertSchema(bookingsTable).omit({
  id: true,
  created_at: true,
});

export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookingsTable.$inferSelect;
