import { pgTable, uuid, text, boolean } from "drizzle-orm/pg-core";

export const media = pgTable("media", {
  id: uuid("id").primaryKey().defaultRandom(),

  postId: uuid("post_id").notNull(),

  url: text("url").notNull(),

  title: text("title"),
  description: text("description"),
  isDeleted:boolean("is_deleted").default(false),
});