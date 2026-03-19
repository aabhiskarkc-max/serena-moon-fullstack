import { apiClient } from "./client";

export type MediaItem = {
  id: string;
  postId: string;
  url: string;
  title: string | null;
  description: string | null;
};

export const mediaByPostQueryKey = (postId: string) => ["media", postId] as const;

export async function fetchMediaByPostId(postId: string) {
  try {
    const res = await apiClient.get<MediaItem[]>(`/media`, {
      params: { postId },
    });
    return res.data;
  } catch (error) {
    throw error;
  }
}

/** Timeout for uploads (2 min) so large video/files can complete. */
const UPLOAD_TIMEOUT_MS = 120_000;

export async function createMedia(formData: FormData) {
  try {
    const res = await apiClient.post<MediaItem>("/media", formData, {
      timeout: UPLOAD_TIMEOUT_MS,
    });
    return res.data;
  } catch (error) {
    throw error;
  }
}

export async function updateMedia(id: string, formData: FormData) {
  try {
    const res = await apiClient.put<MediaItem>(`/media/${id}`, formData, {
      timeout: UPLOAD_TIMEOUT_MS,
    });
    return res.data;
  } catch (error) {
    throw error;
  }
}

export async function deleteMedia(id: string) {
  try {
    await apiClient.delete(`/media/${id}`);
  } catch (error) {
    throw error;
  }
}
