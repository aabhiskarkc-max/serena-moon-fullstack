import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import type { Response } from "express";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { EbookService } from "./ebook.service";

type AuthedRequest = {
  user?: { userId: string; role?: string };
};

@Controller("ebooks")
export class EbookController {
  constructor(private readonly ebookService: EbookService) {}

  @Post("upload/cover")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  @UseInterceptors(
    FileInterceptor("file", {
      limits: { fileSize: 15 * 1024 * 1024 },
    }),
  )
  async uploadCover(@UploadedFile() file?: { buffer: Buffer; mimetype?: string }) {
    if (!file?.buffer) {
      throw new BadRequestException("file is required");
    }
    const result = await this.ebookService.uploadCoverImage(file.buffer, file.mimetype);
    return { url: result.url, publicId: result.publicId };
  }

  @Post("upload/file")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  @UseInterceptors(
    FileInterceptor("file", {
      limits: { fileSize: 80 * 1024 * 1024 },
    }),
  )
  async uploadFile(@UploadedFile() file?: { buffer: Buffer }) {
    if (!file?.buffer) {
      throw new BadRequestException("file is required");
    }
    const result = await this.ebookService.uploadEbookFile(file.buffer);
    return { url: result.url, publicId: result.publicId };
  }

  @Get("catalog")
  @UseGuards(JwtAuthGuard)
  async catalog(@Query("page") page?: string, @Query("limit") limit?: string) {
    return this.ebookService.listCatalogPaginated(
      page ? Number(page) : undefined,
      limit ? Number(limit) : undefined,
    );
  }

  @Get("catalog/:id")
  @UseGuards(JwtAuthGuard)
  async catalogItem(@Param("id") id: string, @Req() req: AuthedRequest) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new BadRequestException("Unauthorized");
    }
    return this.ebookService.getCatalogItemById(id, userId, req.user?.role ?? "user");
  }

 
  @Get(":id/read")
  @UseGuards(JwtAuthGuard)
  async read(
    @Param("id") id: string,
    @Req() req: AuthedRequest,
    @Res() res: Response,
  ) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new BadRequestException("Unauthorized");
    }
    await this.ebookService.pipeEbookFileToResponse(
      id,
      userId,
      req.user?.role ?? "user",
      res,
    );
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  async listAdmin(
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    return this.ebookService.listAdminPaginated(
      page ? Number(page) : undefined,
      limit ? Number(limit) : undefined,
    );
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  async create(
    @Body()
    body: {
      title: string;
      fileUrl: string;
      author?: string | null;
      description?: string | null;
      coverImage?: string | null;
      planId?: string | null;
    },
  ) {
    return this.ebookService.createEbook(body);
  }

  @Put(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  async update(
    @Param("id") id: string,
    @Body()
    body: {
      title?: string;
      fileUrl?: string;
      author?: string | null;
      description?: string | null;
      coverImage?: string | null;
      planId?: string | null;
    },
  ) {
    return this.ebookService.updateEbook(id, body);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  async remove(@Param("id") id: string) {
    return this.ebookService.deleteEbook(id);
  }
}
