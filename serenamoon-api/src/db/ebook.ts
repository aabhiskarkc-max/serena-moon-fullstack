import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { plans } from "./plan";

export const ebooks = pgTable("ebooks", {
  id: uuid("id").primaryKey().defaultRandom(),

  title: text("title").notNull(),

  author: text("author"),

  description: text("description"),

  coverImage: text("cover_image"),

  fileUrl: text("file_url").notNull(),

  planId: uuid("plan_id").references(() => plans.id, { onDelete: "set null" }),

  createdAt: timestamp("created_at").defaultNow(),
});