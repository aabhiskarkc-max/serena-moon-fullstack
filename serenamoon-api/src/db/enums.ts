
import { pgEnum } from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", [
  "user",
  "creator",
  "admin",
]);

export const postTypeEnum = pgEnum("post_type", [
  "image",
  "video",
  "text",
  "reel",
]);

export const visibilityEnum = pgEnum("visibility", [
  "free",
  "subscriber",
  "premium",
]);

export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "active",
  "expired",
  "cancelled",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "success",
  "failed",
]);
