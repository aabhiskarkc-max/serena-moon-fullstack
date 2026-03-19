-- Feed performance indexes
-- Posts: support cursor pagination + filtering
CREATE INDEX IF NOT EXISTS "idx_posts_feed_created_at_id"
  ON "posts" ("created_at" DESC, "id" DESC)
  WHERE "is_deleted" = false;

CREATE INDEX IF NOT EXISTS "idx_posts_feed_type_created_at_id"
  ON "posts" ("type", "created_at" DESC, "id" DESC)
  WHERE "is_deleted" = false;

-- Media: support preview/media queries by post
CREATE INDEX IF NOT EXISTS "idx_media_post_id_not_deleted"
  ON "media" ("post_id")
  WHERE "is_deleted" = false;

