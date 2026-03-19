import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean
} from "drizzle-orm/pg-core";

import { postTypeEnum, visibilityEnum } from "./enums";

export const posts = pgTable("posts", {
  id: uuid("id").primaryKey().defaultRandom(),

  userId: uuid("user_id").notNull(),

  caption: text("caption"),

  description: text("description"),

  type: postTypeEnum("type").notNull(),

  visibility: visibilityEnum("visibility").default("free"),
  isPublished:boolean("is_published").default(false),
  thumbnail: text("thumbnail"),
  isDeleted:boolean("is_deleted").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});