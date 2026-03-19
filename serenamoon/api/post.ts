import { apiClient } from "./client";

export type AdminPost = {
  id: string;
  caption: string | null;
  description: string | null;
  type: "image" | "video" | "text" | "reel";
  visibility: "free" | "subscriber" | "premium";
  thumbnail: string | null;
  isPublished: boolean;
};

export const postsQueryKey = ["posts"] as const;

export const postDetailQueryKey = (id: string) => ["posts", id] as const;

export type PublicPost = {
  id: string;
  caption: string | null;
  description: string | null;
  type: "image" | "video" | "text" | "reel";
  visibility: "free" | "subscriber" | "premium";
  thumbnail: string | null;
  createdAt?: string | null;
};

export type FeedItem = PublicPost & {
  mediaCount: number;
  mediaPreviewUrl: string | null;
};

export type FeedFilter = "all" | "image" | "video" | "reel";

export type FeedPage = {
  items: FeedItem[];
  nextCursor: string | null;
};

export const feedQueryKey = (params: { q: string; type: FeedFilter }) =>
  ["feed", params] as const;

export async function fetchFeedPage(params: {
  limit?: number;
  cursor?: string | null;
  q?: string;
  type?: FeedFilter;
}): Promise<FeedPage> {
  const res = await apiClient.get<{
    items: FeedItem[];
    nextCursor?: string | null;
  }>("/posts/feed", {
    params: {
      limit: params.limit ?? 15,
      cursor: params.cursor ?? undefined,
      q: params.q?.trim() || undefined,
      type: params.type && params.type !== "all" ? params.type : undefined,
    },
  });

  return {
    items: Array.isArray(res.data.items) ? res.data.items : [],
    nextCursor: typeof res.data.nextCursor === "string" ? res.data.nextCursor : null,
  };
}

export type PublicMediaItem = {
  id: string;
  postId: string;
  url: string;
  title: string | null;
  description: string | null;
};

export type PublicPostDetail = {
  post: PublicPost | null;
  media: PublicMediaItem[];
};

export const publicPostDetailQueryKey = (id: string) =>
  ["public-post", id] as const;

export async function fetchPublicPostDetail(id: string): Promise<PublicPostDetail> {
  const res = await apiClient.get<{ post?: PublicPost | null; media?: PublicMediaItem[] }>(
    `/posts/public/${id}`,
  );
  return {
    post: (res.data.post ?? null) as PublicPost | null,
    media: Array.isArray(res.data.media) ? res.data.media : [],
  };
}

export async function fetchPostById(id: string) {
  try {
    const res = await apiClient.get<AdminPost>(`/posts/${id}`);
    return res.data;
  } catch (error) {
    throw error;
  }
}

export async function fetchAllPost() {
  try {
    const res = await apiClient.get<AdminPost[]>("/posts");
    return res.data;
  } catch (error) {
    throw error;
  }
}

export async function createPost(formData: FormData) {
  try {
    const res = await apiClient.post<AdminPost>("/posts", formData);
    return res.data;
  } catch (error) {
    throw error;
  }
}

export async function updatePost(id: string, formData: FormData) {
  try {
    const res = await apiClient.put<AdminPost>(`/posts/${id}`, formData);
    return res.data;
  } catch (error) {
    throw error;
  }
}

export async function deletePost(id: string) {
  try {
    await apiClient.delete(`/posts/${id}`);
  } catch (error) {
    throw error;
  }
}

export async function setPostPublish(id: string, isPublished: boolean) {
  try {
    const res = await apiClient.patch<AdminPost>(`/posts/${id}/publish`, {
      isPublished,
    });
    return res.data;
  } catch (error) {
    throw error;
  }
}
