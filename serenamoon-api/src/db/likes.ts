import {
  pgTable,
  uuid,

} from "drizzle-orm/pg-core";
export const likes = pgTable("likes", {
  id: uuid("id").primaryKey().defaultRandom(),

  userId: uuid("user_id").notNull(),

  postId: uuid("post_id").notNull(),
});