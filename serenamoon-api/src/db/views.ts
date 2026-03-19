import {
  pgTable,
  uuid,
timestamp
} from "drizzle-orm/pg-core";
export const views = pgTable("views", {
  id: uuid("id").primaryKey().defaultRandom(),

  userId: uuid("user_id"),

  postId: uuid("post_id"),

  watchedAt: timestamp("watched_at").defaultNow(),
});