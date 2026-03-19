import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { db } from '../db/drizzle';
import { media, posts } from '../db/schema';
import { and, eq } from 'drizzle-orm';

@Injectable()
export class MediaRecordService {
  async findByPostId(postId: string) {
    return db
      .select()
      .from(media)
      .where(and(eq(media.postId, postId), eq(media.isDeleted, false)));
  }

  async findOne(id: string) {
    const [row] = await db.select().from(media).where(eq(media.id, id));
    if (!row || row.isDeleted) {
      throw new NotFoundException('Media not found');
    }
    return row;
  }

  async create(
    postId: string,
    data: {
      url: string;
      title?: string | null;
      description?: string | null;
    },
  ) {
    const [post] = await db.select().from(posts).where(eq(posts.id, postId));
    if (!post || post.isDeleted) {
      throw new BadRequestException('Post not found');
    }

    const [created] = await db
      .insert(media)
      .values({
        postId,
        url: data.url,
        title: data.title ?? null,
        description: data.description ?? null,
      })
      .returning();

    return created;
  }

  async update(
    id: string,
    data: {
      title?: string | null;
      description?: string | null;
      url?: string;
    },
  ) {
    const existing = await this.findOne(id);

    const [updated] = await db
      .update(media)
      .set({
        title: data.title !== undefined ? data.title : existing.title,
        description: data.description !== undefined ? data.description : existing.description,
        url: data.url !== undefined ? data.url : existing.url,
      })
      .where(eq(media.id, id))
      .returning();

    return updated;
  }

  async delete(id: string) {
    await this.findOne(id);
    const [soft] = await db
      .update(media)
      .set({ isDeleted: true })
      .where(eq(media.id, id))
      .returning();
    return soft;
  }
}
