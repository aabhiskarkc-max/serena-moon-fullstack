import {
  pgTable,
  uuid,
  timestamp,
  boolean
} from "drizzle-orm/pg-core";

import { subscriptionStatusEnum } from "./enums";

export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),

  userId: uuid("user_id").notNull(),

  planId: uuid("plan_id").notNull(),
  
  status: subscriptionStatusEnum("status").default("active"),

  startDate: timestamp("start_date").defaultNow(),
  isDeleted:boolean("is_deleted").default(false),
  endDate: timestamp("end_date"),
});