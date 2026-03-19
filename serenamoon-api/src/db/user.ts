
import {
  pgTable,
  uuid,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import { userRoleEnum } from "./enums";
import { boolean } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  password: text("password"),
  username: text("username").notNull().unique(),
  avatar: text("avatar"),
  role: userRoleEnum("role").default("user"),
  isDeleted:boolean("is_deleted").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt:timestamp("updated_at").defaultNow()
});
