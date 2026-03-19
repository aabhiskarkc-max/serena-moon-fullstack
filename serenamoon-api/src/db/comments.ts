import {
  pgTable,
  uuid,
  text,
  timestamp
} from "drizzle-orm/pg-core";

export const comments = pgTable("comments", {
  id: uuid("id").primaryKey().defaultRandom(),

  userId: uuid("user_id").notNull(),

  postId: uuid("post_id").notNull(),

  message: text("message"),

  createdAt: timestamp("created_at").defaultNow(),
});