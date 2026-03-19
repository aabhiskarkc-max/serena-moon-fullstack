import {
  pgTable,
  uuid,
  integer,
  text,
  timestamp
} from "drizzle-orm/pg-core";
import { paymentStatusEnum } from "./enums";
export const payments = pgTable("payments", {
  id: uuid("id").primaryKey().defaultRandom(),

  userId: uuid("user_id"),

  planId: uuid("plan_id"),

  amount: integer("amount"),

  status: paymentStatusEnum("status"),

  provider: text("provider"),

  createdAt: timestamp("created_at").defaultNow(),
});