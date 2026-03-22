import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import axios from "axios";
import { count, desc, eq } from "drizzle-orm";
import type { Response } from "express";
import { pipeline } from "node:stream/promises";
import { db } from "../db/drizzle";
import { ebooks, plans } from "../db/schema";
import { MediaService } from "../media/media.service";
import { SubscriptionService } from "../subscription/subscription.service";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export type EbookAdminRow = {
  id: string;
  title: string;
  author: string | null;
  description: string | null;
  coverImage: string | null;
  hasAsset: boolean;
  planId: string | null;
  planName: string | null;
  createdAt: Date | null;
};

export type EbookCatalogItem = {
  id: string;
  title: string;
  author: string | null;
  description: string | null;
  coverImage: string | null;
  planId: string | null;
  planName: string | null;
  createdAt: Date | null;
};

@Injectable()
export class EbookService {
  private readonly logger = new Logger(EbookService.name);

  constructor(
    private readonly mediaService: MediaService,
    private readonly subscriptionService: SubscriptionService,
  ) {}
  async listAdminPaginated(pageRaw?: number, limitRaw?: number) {
    const page = Math.max(1, Number(pageRaw) || DEFAULT_PAGE);
    const limit = Math.min(MAX_LIMIT, Math.max(1, Number(limitRaw) || DEFAULT_LIMIT));
    const offset = (page - 1) * limit;

    const [totalRow] = await db.select({ value: count() }).from(ebooks);
    const total = Number(totalRow?.value ?? 0);

    const rows = await db
      .select({
        id: ebooks.id,
        title: ebooks.title,
        author: ebooks.author,
        description: ebooks.description,
        coverImage: ebooks.coverImage,
        fileUrl: ebooks.fileUrl,
        planId: ebooks.planId,
        planName: plans.name,
        createdAt: ebooks.createdAt,
      })
      .from(ebooks)
      .leftJoin(plans, eq(ebooks.planId, plans.id))
      .orderBy(desc(ebooks.createdAt))
      .limit(limit)
      .offset(offset);

    const items: EbookAdminRow[] = rows.map((row) => {
      const { fileUrl, ...rest } = row;
      return {
        ...rest,
        hasAsset: Boolean(fileUrl?.trim()),
      };
    });

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return {
      items,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async listCatalogPaginated(pageRaw?: number, limitRaw?: number) {
    const page = Math.max(1, Number(pageRaw) || DEFAULT_PAGE);
    const limit = Math.min(MAX_LIMIT, Math.max(1, Number(limitRaw) || DEFAULT_LIMIT));
    const offset = (page - 1) * limit;

    const [totalRow] = await db.select({ value: count() }).from(ebooks);
    const total = Number(totalRow?.value ?? 0);

    const rows = await db
      .select({
        id: ebooks.id,
        title: ebooks.title,
        author: ebooks.author,
        description: ebooks.description,
        coverImage: ebooks.coverImage,
        planId: ebooks.planId,
        planName: plans.name,
        createdAt: ebooks.createdAt,
      })
      .from(ebooks)
      .leftJoin(plans, eq(ebooks.planId, plans.id))
      .orderBy(desc(ebooks.createdAt))
      .limit(limit)
      .offset(offset);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return {
      items: rows as EbookCatalogItem[],
      total,
      page,
      limit,
      totalPages,
    };
  }

  async getCatalogItemById(id: string, userId: string, role: string): Promise<EbookCatalogItem> {
    const ebook = await this.getEbookById(id);
    await this.assertUserCanReadEbook(userId, role, ebook);

    const [row] = await db
      .select({
        id: ebooks.id,
        title: ebooks.title,
        author: ebooks.author,
        description: ebooks.description,
        coverImage: ebooks.coverImage,
        planId: ebooks.planId,
        planName: plans.name,
        createdAt: ebooks.createdAt,
      })
      .from(ebooks)
      .leftJoin(plans, eq(ebooks.planId, plans.id))
      .where(eq(ebooks.id, id));

    if (!row) throw new NotFoundException("Ebook not found");
    return row as EbookCatalogItem;
  }

  async assertUserCanReadEbook(
    userId: string,
    role: string,
    ebook: { planId: string | null },
  ) {
    if (role === "admin") return;
    if (!ebook.planId) return;
    const { subscription } = await this.subscriptionService.getMySubscription(userId);
    if (!subscription || subscription.planId !== ebook.planId) {
      throw new ForbiddenException("Your subscription does not include this ebook");
    }
  }


  async pipeEbookFileToResponse(ebookId: string, userId: string, role: string, res: Response) {
    const ebook = await this.getEbookById(ebookId);
    await this.assertUserCanReadEbook(userId, role, ebook);
    if (!ebook.fileUrl?.trim()) {
      throw new NotFoundException("Ebook file missing");
    }

    try {
      const axiosRes = await axios.get<NodeJS.ReadableStream>(ebook.fileUrl, {
        responseType: "stream",
        maxRedirects: 5,
        timeout: 0,
        validateStatus: (s) => s >= 200 && s < 400,
      });
      const upstream = axiosRes.data;
      const rawType = axiosRes.headers["content-type"];
      const contentType = this.resolveStreamContentType(
        typeof rawType === "string" ? rawType : undefined,
        ebook.fileUrl,
      );

      res.setHeader("Content-Type", contentType);
      res.setHeader("Content-Disposition", "inline");
      res.setHeader("Cache-Control", "private, no-store, max-age=0");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("X-Content-Type-Options", "nosniff");

      upstream.on("error", (err) => {
        this.logger.warn("Upstream ebook stream error", err);
        if (!res.headersSent) {
          res.status(502).end();
        } else {
          res.destroy(err as Error);
        }
      });

      await pipeline(upstream, res);
    } catch (err) {
      if (!res.headersSent) {
        this.logger.error("Failed to stream ebook file", err as Error);
        throw new InternalServerErrorException("Failed to load ebook file");
      }
      this.logger.warn("Ebook stream ended with error after headers sent", err as Error);
    }
  }

  private guessContentTypeFromUrl(url: string): string {
    const u = url.toLowerCase();
    if (u.includes(".pdf")) return "application/pdf";
    if (u.includes(".epub")) return "application/epub+zip";
    return "application/octet-stream";
  }


  private resolveStreamContentType(upstreamRaw: string | undefined, fileUrl: string): string {
    const fromUpstream =
      typeof upstreamRaw === "string" && upstreamRaw.length > 0
        ? upstreamRaw.split(";")[0].trim().toLowerCase()
        : "";
    const generic =
      !fromUpstream ||
      fromUpstream === "application/octet-stream" ||
      fromUpstream === "binary/octet-stream";
    if (generic) {
      const guessed = this.guessContentTypeFromUrl(fileUrl).toLowerCase();
      if (guessed !== "application/octet-stream") {
        return guessed;
      }
    }
    if (fromUpstream && !generic) {
      return fromUpstream;
    }
    return "application/octet-stream";
  }

  async uploadCoverImage(fileBuffer: Buffer | undefined, mimetype?: string) {
    if (!fileBuffer?.length) {
      throw new BadRequestException("file is required");
    }
    if (!mimetype?.startsWith("image/")) {
      throw new BadRequestException("Cover must be an image file");
    }
    return this.mediaService.uploadMedia(fileBuffer, "serenamoon/ebook-covers", "image");
  }

  async uploadEbookFile(fileBuffer: Buffer | undefined) {
    if (!fileBuffer?.length) {
      throw new BadRequestException("file is required");
    }
    return this.mediaService.uploadMedia(fileBuffer, "serenamoon/ebook-files", "raw");
  }

  async createEbook(input: {
    title: string;
    fileUrl: string;
    author?: string | null;
    description?: string | null;
    coverImage?: string | null;
    planId?: string | null;
  }) {
    if (!input.title?.trim() || !input.fileUrl?.trim()) {
      throw new BadRequestException("Missing required fields: title, fileUrl");
    }

    if (input.planId) {
      const [plan] = await db.select({ id: plans.id }).from(plans).where(eq(plans.id, input.planId));
      if (!plan) throw new NotFoundException("Plan not found");
    }

    const [created] = await db
      .insert(ebooks)
      .values({
        title: input.title.trim(),
        fileUrl: input.fileUrl.trim(),
        author: input.author?.trim() || null,
        description: input.description?.trim() || null,
        coverImage: input.coverImage?.trim() || null,
        planId: input.planId ?? null,
      })
      .returning();

    return this.ebookRowToApi(created);
  }

  async getEbookById(id: string) {
    const [row] = await db.select().from(ebooks).where(eq(ebooks.id, id));
    if (!row) throw new NotFoundException("Ebook not found");
    return row;
  }

  async updateEbook(
    id: string,
    input: {
      title?: string;
      fileUrl?: string;
      author?: string | null;
      description?: string | null;
      coverImage?: string | null;
      planId?: string | null;
    },
  ) {
    const existing = await this.getEbookById(id);

    const title =
      input.title !== undefined ? input.title.trim() : existing.title;
    if (!title) {
      throw new BadRequestException("title cannot be empty");
    }

    const fileUrl =
      input.fileUrl !== undefined ? input.fileUrl.trim() : existing.fileUrl;
    if (!fileUrl) {
      throw new BadRequestException("fileUrl cannot be empty");
    }

    const planId =
      input.planId !== undefined ? input.planId : existing.planId;
    if (planId) {
      const [plan] = await db.select({ id: plans.id }).from(plans).where(eq(plans.id, planId));
      if (!plan) throw new NotFoundException("Plan not found");
    }

    const [updated] = await db
      .update(ebooks)
      .set({
        title,
        fileUrl,
        author:
          input.author !== undefined
            ? input.author?.trim() || null
            : existing.author,
        description:
          input.description !== undefined
            ? input.description?.trim() || null
            : existing.description,
        coverImage:
          input.coverImage !== undefined
            ? input.coverImage?.trim() || null
            : existing.coverImage,
        planId,
      })
      .where(eq(ebooks.id, id))
      .returning();

    return this.ebookRowToApi(updated);
  }

  ebookRowToApi(row: typeof ebooks.$inferSelect) {
    const { fileUrl, ...rest } = row;
    return {
      ...rest,
      hasAsset: Boolean(fileUrl?.trim()),
    };
  }

  async deleteEbook(id: string) {
    await this.getEbookById(id);
    await db.delete(ebooks).where(eq(ebooks.id, id));
    return { success: true };
  }
}
