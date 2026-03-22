import { apiClient } from "./client";

const UPLOAD_TIMEOUT_MS = 120_000;

export type EbookUploadResult = {
  url: string;
  publicId: string;
};

export type EbookAdminRow = {
  id: string;
  title: string;
  author: string | null;
  description: string | null;
  coverImage: string | null;
  hasAsset: boolean;
  planId: string | null;
  planName: string | null;
  createdAt: string | null;
};

export type EbookCatalogItem = {
  id: string;
  title: string;
  author: string | null;
  description: string | null;
  coverImage: string | null;
  planId: string | null;
  planName: string | null;
  createdAt: string | null;
};

export type PaginatedEbooks = {
  items: EbookAdminRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type PaginatedEbookCatalog = {
  items: EbookCatalogItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export const ebooksAdminQueryKey = (page: number, limit: number) =>
  ["ebooks", "admin", page, limit] as const;

export const ebooksCatalogQueryKey = (page: number, limit: number) =>
  ["ebooks", "catalog", page, limit] as const;

export async function fetchEbooksAdmin(params: { page: number; limit: number }) {
  const res = await apiClient.get<PaginatedEbooks>("/ebooks", {
    params: { page: params.page, limit: params.limit },
  });
  return res.data;
}

export async function fetchEbookCatalog(params: { page: number; limit: number }) {
  const res = await apiClient.get<PaginatedEbookCatalog>("/ebooks/catalog", {
    params: { page: params.page, limit: params.limit },
  });
  return res.data;
}

export const ebookCatalogItemQueryKey = (id: string) =>
  ["ebooks", "catalog", "item", id] as const;

export async function fetchEbookCatalogItem(id: string) {
  const res = await apiClient.get<EbookCatalogItem>(`/ebooks/catalog/${id}`);
  return res.data;
}

export type EbookReadForViewer = {
  data: ArrayBuffer;
  headerMime: string;
  displayMime: string;
};

function normalizeContentTypeHeader(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) return "";
  return value.split(";")[0].trim().toLowerCase();
}

function sniffPdfMagic(buf: ArrayBuffer): boolean {
  if (buf.byteLength < 5) return false;
  const u = new Uint8Array(buf.slice(0, 5));
  return u[0] === 0x25 && u[1] === 0x50 && u[2] === 0x44 && u[3] === 0x46 && u[4] === 0x2d;
}

function sniffZipMagic(buf: ArrayBuffer): boolean {
  if (buf.byteLength < 4) return false;
  const u = new Uint8Array(buf.slice(0, 4));
  return u[0] === 0x50 && u[1] === 0x4b;
}


export async function fetchEbookReadForViewer(id: string): Promise<EbookReadForViewer> {
  const res = await apiClient.get<ArrayBuffer>(`/ebooks/${id}/read`, {
    responseType: "arraybuffer",
    timeout: UPLOAD_TIMEOUT_MS,
  });
  const data = res.data;
  let headerMime = normalizeContentTypeHeader(res.headers["content-type"]);
  let displayMime = headerMime;

  if (sniffPdfMagic(data)) {
    displayMime = "application/pdf";
  } else if (headerMime === "application/epub+zip") {
    displayMime = "application/epub+zip";
  } else if (
    (!headerMime || headerMime === "application/octet-stream") &&
    sniffZipMagic(data)
  ) {
    displayMime = "application/epub+zip";
  } else if (!headerMime || headerMime === "application/octet-stream") {
    displayMime = "application/octet-stream";
  }

  return { data, headerMime, displayMime };
}

export async function uploadEbookCover(formData: FormData) {
  const res = await apiClient.post<EbookUploadResult>("/ebooks/upload/cover", formData, {
    timeout: UPLOAD_TIMEOUT_MS,
  });
  return res.data;
}

export async function uploadEbookFile(formData: FormData) {
  const res = await apiClient.post<EbookUploadResult>("/ebooks/upload/file", formData, {
    timeout: UPLOAD_TIMEOUT_MS,
  });
  return res.data;
}

export type CreateEbookBody = {
  title: string;
  fileUrl: string;
  author?: string | null;
  description?: string | null;
  coverImage?: string | null;
  planId?: string | null;
};

export type UpdateEbookBody = {
  title?: string;
  fileUrl?: string;
  author?: string | null;
  description?: string | null;
  coverImage?: string | null;
  planId?: string | null;
};

export async function createEbook(body: CreateEbookBody) {
  const res = await apiClient.post("/ebooks", body);
  return res.data;
}

export async function updateEbook(id: string, body: UpdateEbookBody) {
  const res = await apiClient.put(`/ebooks/${id}`, body);
  return res.data;
}

export async function deleteEbook(id: string) {
  const res = await apiClient.delete<{ success: boolean }>(`/ebooks/${id}`);
  return res.data;
}
