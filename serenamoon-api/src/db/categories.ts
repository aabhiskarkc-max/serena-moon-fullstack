import {
  pgTable,
  uuid,
text
} from "drizzle-orm/pg-core";
export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),

  name: text("name").notNull(),
});

export const postCategories = pgTable("post_categories", {
  postId: uuid("post_id").notNull(),
  categoryId: uuid("category_id").notNull(),
});