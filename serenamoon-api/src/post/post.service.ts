import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { db } from '../db/drizzle';
import { media, posts, users } from '../db/schema';
import {
  and,
  desc,
  eq,
  ilike,
  inArray,
  lt,
  or,
  sql,
} from 'drizzle-orm';
import { MediaService } from '../media/media.service';

@Injectable()
export class PostService {
  constructor(private readonly mediaService: MediaService) {}

  async getAllPosts() {
    return db.select().from(posts).where(eq(posts.isDeleted, false)).orderBy(desc(posts.createdAt));
  }

  private encodeCursor(input: { createdAt: Date; id: string }) {
    // ISO + '_' + uuid
    return `${input.createdAt.toISOString()}_${input.id}`;
  }

  private decodeCursor(cursor: string): { createdAt: Date; id: string } | null {
    const [iso, id] = cursor.split('_');
    if (!iso || !id) return null;
    const dt = new Date(iso);
    if (Number.isNaN(dt.getTime())) return null;
    return { createdAt: dt, id };
  }

  async getFeed(input: {
    limit?: number;
    cursor?: string;
    q?: string;
    type?: 'image' | 'video' | 'reel';
  }) {
    const limit = Math.max(1, Math.min(Number(input.limit ?? 15), 50));
    const q = (input.q ?? '').trim();
    const type = input.type;
    const cursor = input.cursor ? this.decodeCursor(input.cursor) : null;

    const where = and(
      eq(posts.isDeleted, false),
      eq(posts.isPublished, true),
      type ? eq(posts.type, type) : undefined,
      q
        ? or(
            ilike(posts.caption, `%${q}%`),
            ilike(posts.description, `%${q}%`),
          )
        : undefined,
      cursor
        ? or(
            lt(posts.createdAt, cursor.createdAt),
            and(eq(posts.createdAt, cursor.createdAt), lt(posts.id, cursor.id)),
          )
        : undefined,
    );

    const page = await db
      .select()
      .from(posts)
      .where(where)
      .orderBy(desc(posts.createdAt), desc(posts.id))
      .limit(limit);

    if (page.length === 0) {
      return { items: [], nextCursor: null };
    }

    const postIds = page.map((p) => p.id);

    const mediaRows = await db
      .select({
        id: media.id,
        postId: media.postId,
        url: media.url,
      })
      .from(media)
      .where(and(eq(media.isDeleted, false), inArray(media.postId, postIds)));

    const mediaPreviewByPostId: Record<
      string,
      { url: string } | null
    > = {};
    const mediaCountByPostId: Record<string, number> = {};

    for (const pid of postIds) {
      mediaPreviewByPostId[pid] = null;
      mediaCountByPostId[pid] = 0;
    }

    for (const row of mediaRows) {
      mediaCountByPostId[row.postId] = (mediaCountByPostId[row.postId] ?? 0) + 1;
      if (!mediaPreviewByPostId[row.postId]) {
        mediaPreviewByPostId[row.postId] = { url: row.url };
      }
    }

    const items = page.map((p) => ({
      ...p,
      mediaCount: mediaCountByPostId[p.id] ?? 0,
      mediaPreviewUrl: mediaPreviewByPostId[p.id]?.url ?? null,
    }));

    const last = page[page.length - 1];
    const nextCursor = page.length === limit ? this.encodeCursor({ createdAt: last.createdAt!, id: last.id }) : null;

    return { items, nextCursor };
  }

  async getPublicPostWithMedia(id: string) {
    const post = await this.getPostById(id);
    if (!post.isPublished) {
      throw new NotFoundException('Post not found');
    }

    const mediaRows = await db
      .select()
      .from(media)
      .where(and(eq(media.isDeleted, false), eq(media.postId, id)));

    return { post, media: mediaRows };
  }

  async togglePublish(id: string) {
    const [updated] = await db.transaction(async (tx) => {
      const [row] = await tx
        .update(posts)
        .set({ isPublished: sql<boolean>`NOT ${posts.isPublished}` })
        .where(and(eq(posts.id, id), eq(posts.isDeleted, false)))
        .returning();
      return [row] as const;
    });

    if (!updated) {
      throw new NotFoundException('Post not found');
    }

    return updated;
  }

  async setPublish(id: string, isPublished: boolean) {
    const [updated] = await db.transaction(async (tx) => {
      const [row] = await tx
        .update(posts)
        .set({ isPublished })
        .where(and(eq(posts.id, id), eq(posts.isDeleted, false)))
        .returning();
      return [row] as const;
    });

    if (!updated) {
      throw new NotFoundException('Post not found');
    }

    return updated;
  }

  async getPostById(id: string) {
    const [post] = await db.select().from(posts).where(eq(posts.id, id));
    if (!post || post.isDeleted) {
      throw new NotFoundException('Post not found');
    }
    return post;
  }

  async createPost(
    userId: string,
    data: {
      caption?: string;
      description?: string;
      type: 'image' | 'video' | 'text' | 'reel';
      visibility?: 'free' | 'subscriber' | 'premium';
      thumbnailBuffer?: Buffer;
    },
  ) {
    if (!data.type) {
      throw new BadRequestException('Post type is required');
    }

    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) {
      throw new BadRequestException('User not found');
    }

    let thumbnailUrl: string | undefined;
    if (data.thumbnailBuffer) {
      const upload = await this.mediaService.uploadImage(
        data.thumbnailBuffer,
        'serenamoon/thumbnails',
      );
      thumbnailUrl = upload.url;
    }

    const [created] = await db
      .insert(posts)
      .values({
        userId,
        caption: data.caption ?? null,
        description: data.description ?? null,
        type: data.type,
        visibility: data.visibility ?? 'free',
        thumbnail: thumbnailUrl,
      })
      .returning();

    return created;
  }

  async updatePost(
    id: string,
    data: {
      caption?: string;
      description?: string;
      visibility?: 'free' | 'subscriber' | 'premium';
      thumbnailBuffer?: Buffer;
    },
  ) {
    const existing = await this.getPostById(id);

    let thumbnailUrl = existing.thumbnail;
    if (data.thumbnailBuffer) {
      const upload = await this.mediaService.uploadImage(
        data.thumbnailBuffer,
        'serenamoon/thumbnails',
      );
      thumbnailUrl = upload.url;
    }

    const [updated] = await db
      .update(posts)
      .set({
        caption: data.caption ?? existing.caption,
        description: data.description !== undefined ? data.description : existing.description,
        visibility: data.visibility ?? existing.visibility,
        thumbnail: thumbnailUrl,
      })
      .where(eq(posts.id, id))
      .returning();

    return updated;
  }

  async deletePost(id: string) {
    await this.getPostById(id);
    const [deleted] = await db
      .update(posts)
      .set({ isDeleted: true })
      .where(eq(posts.id, id))
      .returning();
    return deleted;
  }
}

