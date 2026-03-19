import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { visibilityEnum } from "./enums";

export const ebooks = pgTable("ebooks", {
  id: uuid("id").primaryKey().defaultRandom(),

  title: text("title").notNull(),

  author: text("author"),

  description: text("description"),

  coverImage: text("cover_image"),

  fileUrl: text("file_url").notNull(),

  visibility: visibilityEnum("visibility").default("free"),

  createdAt: timestamp("created_at").defaultNow(),
});