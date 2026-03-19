"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import {
  createMedia,
  deleteMedia,
  fetchMediaByPostId,
  mediaByPostQueryKey,
  updateMedia,
  type MediaItem,
} from "@/api/media";
import { fetchPostById, postDetailQueryKey } from "@/api/post";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Toast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Plus, Trash2, Pencil, X, ImageIcon, Video, ArrowLeft } from "lucide-react";

function apiErr(e: unknown, fallback: string) {
  if (isAxiosError(e)) {
    const m = (e.response?.data as { message?: string } | undefined)?.message;
    if (m) return m;
  }
  if (e instanceof Error) return e.message;
  return fallback;
}

export default function AdminPostDetailPage() {
  const params = useParams<{ id: string }>();
  const postId = params.id ?? "";
  const queryClient = useQueryClient();

  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [showAddMedia, setShowAddMedia] = useState(false);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaTitle, setMediaTitle] = useState("");
  const [mediaDescription, setMediaDescription] = useState("");
  const [editingMedia, setEditingMedia] = useState<MediaItem | null>(null);
  const [editMediaTitle, setEditMediaTitle] = useState("");
  const [editMediaDescription, setEditMediaDescription] = useState("");
  const [editMediaFile, setEditMediaFile] = useState<File | null>(null);
  const [addMediaPreview, setAddMediaPreview] = useState<string | null>(null);
  const [editMediaPreview, setEditMediaPreview] = useState<string | null>(null);
  const [confirmDeleteMediaOpen, setConfirmDeleteMediaOpen] = useState(false);
  const [mediaToDelete, setMediaToDelete] = useState<MediaItem | null>(null);

  const postQuery = useQuery({
    queryKey: postDetailQueryKey(postId),
    queryFn: () => fetchPostById(postId),
    enabled: Boolean(postId),
  });

  const mediaQuery = useQuery({
    queryKey: mediaByPostQueryKey(postId),
    queryFn: () => fetchMediaByPostId(postId),
    enabled: Boolean(postId),
  });

  const addMediaMutation = useMutation({
    mutationFn: createMedia,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mediaByPostQueryKey(postId) });
      setToast({ message: "Media added.", type: "success" });
      setShowAddMedia(false);
      setMediaFile(null);
      setMediaTitle("");
      setMediaDescription("");
    },
    onError: (e) =>
      setToast({ message: apiErr(e, "Failed to add media"), type: "error" }),
  });

  const updateMediaMutation = useMutation({
    mutationFn: ({ id, formData }: { id: string; formData: FormData }) =>
      updateMedia(id, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mediaByPostQueryKey(postId) });
      setToast({ message: "Media updated.", type: "success" });
      setEditingMedia(null);
      setEditMediaFile(null);
    },
    onError: (e) =>
      setToast({ message: apiErr(e, "Failed to update media"), type: "error" }),
  });

  const deleteMediaMutation = useMutation({
    mutationFn: deleteMedia,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mediaByPostQueryKey(postId) });
      setToast({ message: "Media deleted.", type: "success" });
      setMediaToDelete(null);
      setConfirmDeleteMediaOpen(false);
    },
    onError: (e) =>
      setToast({ message: apiErr(e, "Delete failed"), type: "error" }),
  });

  const post = postQuery.data ?? null;
  const mediaList = mediaQuery.data ?? [];

  useEffect(() => {
    if (!mediaQuery.isError || !mediaQuery.error) return;
    setToast({ message: apiErr(mediaQuery.error, "Failed to load media"), type: "error" });
  }, [mediaQuery.isError, mediaQuery.error]);

  useEffect(() => {
    let objectUrl: string | null = null;
    if (mediaFile && mediaFile.type.startsWith("image/")) {
      objectUrl = URL.createObjectURL(mediaFile);
      setAddMediaPreview(objectUrl);
    } else {
      setAddMediaPreview(null);
    }
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [mediaFile]);

  useEffect(() => {
    let objectUrl: string | null = null;
    if (editMediaFile && editMediaFile.type.startsWith("image/")) {
      objectUrl = URL.createObjectURL(editMediaFile);
      setEditMediaPreview(objectUrl);
    } else {
      setEditMediaPreview(null);
    }
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [editMediaFile]);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(id);
  }, [toast]);

  const getToken = () =>
    typeof window !== "undefined" ? localStorage.getItem("serena_token") : null;

  const handleAddMedia = (e: React.FormEvent) => {
    e.preventDefault();
    if (!postId || !mediaFile) {
      setToast({ message: "Select a file to upload", type: "error" });
      return;
    }
    setToast(null);
    const token = getToken();
    if (!token) {
      setToast({ message: "You must be logged in.", type: "error" });
      return;
    }
    const formData = new FormData();
    formData.append("postId", postId);
    if (mediaTitle) formData.append("title", mediaTitle);
    if (mediaDescription) formData.append("description", mediaDescription);
    formData.append("file", mediaFile);
    addMediaMutation.mutate(formData);
  };

  const handleUpdateMedia = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMedia) return;
    setToast(null);
    const token = getToken();
    if (!token) {
      setToast({ message: "You must be logged in.", type: "error" });
      return;
    }
    const formData = new FormData();
    formData.append("title", editMediaTitle);
    formData.append("description", editMediaDescription);
    if (editMediaFile) formData.append("file", editMediaFile);
    updateMediaMutation.mutate({ id: editingMedia.id, formData });
  };

  const handleConfirmDeleteMedia = () => {
    if (!mediaToDelete) return;
    setToast(null);
    const token = getToken();
    if (!token) {
      setToast({ message: "You must be logged in.", type: "error" });
      setConfirmDeleteMediaOpen(false);
      return;
    }
    deleteMediaMutation.mutate(mediaToDelete.id);
  };

  if (postQuery.isPending) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">Loading post...</p>
      </div>
    );
  }

  if (postQuery.isError || !post) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-destructive">
          {postQuery.isError ? apiErr(postQuery.error, "Post not found.") : "Post not found."}
        </p>
        <Button variant="outline" asChild>
          <Link href="/admin/posts">Back to posts</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/posts">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Post &amp; media</h2>
          <p className="text-sm text-muted-foreground">
            View post details and manage media for this post.
          </p>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-4 space-y-4">
        <div className="flex gap-4">
          {post.thumbnail ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.thumbnail}
              alt=""
              className="h-24 w-36 rounded-lg object-cover shrink-0"
            />
          ) : (
            <div className="h-24 w-36 rounded-lg border flex items-center justify-center shrink-0 text-muted-foreground bg-muted/30">
              <ImageIcon className="h-10 w-10" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium capitalize">{post.type}</p>
            <p className="text-xs text-muted-foreground capitalize">{post.visibility}</p>
            <p className="text-sm mt-1">{post.caption || "No caption"}</p>
            {post.description && (
              <p className="text-sm text-muted-foreground mt-2">{post.description}</p>
            )}
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-medium">Media</h3>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setShowAddMedia(true);
              setMediaFile(null);
              setMediaTitle("");
              setMediaDescription("");
            }}
          >
            <Plus className="h-4 w-4 mr-1" /> Add media
          </Button>
        </div>
        {mediaQuery.isPending ? (
          <p className="text-sm text-muted-foreground">Loading media…</p>
        ) : mediaQuery.isError ? (
          <p className="text-sm text-destructive">Could not load media list.</p>
        ) : mediaList.length === 0 ? (
          <p className="text-sm text-muted-foreground">No media for this post.</p>
        ) : (
          <div className="overflow-x-auto border border-border rounded-lg bg-card">
            <table className="min-w-full text-sm">
              <thead className="bg-background/80 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-3 py-2">Preview</th>
                  <th className="px-3 py-2">Title</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2">Description</th>
                  <th className="px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {mediaList.map((m) => (
                  <tr key={m.id} className="border-t border-border">
                    <td className="px-3 py-2 align-top">
                      {m.url.match(/\.(mp4|webm|mov|m4v|ogg)(\?|#|$)/i) ? (
                        <div className="h-14 w-24 rounded border flex items-center justify-center bg-muted/50">
                          <Video className="h-5 w-5 text-muted-foreground" />
                        </div>
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={m.url}
                          alt={m.title ?? "Media preview"}
                          className="h-14 w-24 rounded object-cover"
                        />
                      )}
                    </td>
                    <td className="px-3 py-2 align-top max-w-[20rem]">
                      <p className="font-medium truncate">{m.title || "Untitled"}</p>
                      <p className="text-xs text-muted-foreground">{new Date(m.createdAt).toLocaleDateString()}</p>
                    </td>
                    <td className="px-3 py-2 align-top capitalize">{m.type ?? "media"}</td>
                    <td className="px-3 py-2 align-top">
                      <p className="text-xs text-muted-foreground line-clamp-2 max-w-[24rem]">
                        {m.description || "No description"}
                      </p>
                    </td>
                    <td className="px-3 py-2 align-top">
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => {
                            setEditingMedia(m);
                            setEditMediaTitle(m.title ?? "");
                            setEditMediaDescription(m.description ?? "");
                            setEditMediaFile(null);
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-destructive"
                          onClick={() => {
                            setMediaToDelete(m);
                            setConfirmDeleteMediaOpen(true);
                          }}
                          disabled={
                            deleteMediaMutation.isPending &&
                            deleteMediaMutation.variables === m.id
                          }
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showAddMedia && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4">
          <div className="bg-card border rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Add media</h3>
              <Button size="icon" variant="ghost" onClick={() => setShowAddMedia(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <form onSubmit={handleAddMedia} className="space-y-4">
              <div>
                <label className="text-sm font-medium">File</label>
                <input
                  type="file"
                  accept="image/*,video/*"
                  className="block w-full mt-1 text-sm text-muted-foreground"
                  onChange={(e) => setMediaFile(e.target.files?.[0] ?? null)}
                  required
                />
                {addMediaPreview && (
                  <div className="mt-2 flex items-center gap-2 rounded-md border border-border p-2 bg-background/60">
                    <img
                      src={addMediaPreview}
                      alt="Preview"
                      className="h-14 w-20 rounded-md object-cover"
                    />
                    <span className="text-xs text-muted-foreground">Selected image preview</span>
                  </div>
                )}
              </div>
              <div>
                <label className="text-sm font-medium">Title (optional)</label>
                <Input
                  className="mt-1"
                  value={mediaTitle}
                  onChange={(e) => setMediaTitle(e.target.value)}
                  placeholder="e.g. Behind the scenes"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description (optional)</label>
                <textarea
                  rows={3}
                  value={mediaDescription}
                  onChange={(e) => setMediaDescription(e.target.value)}
                  placeholder="Short description (optional)"
                  className="mt-1 flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setShowAddMedia(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={addMediaMutation.isPending || !mediaFile}>
                  {addMediaMutation.isPending ? "Uploading..." : "Add media"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingMedia && !confirmDeleteMediaOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4">
          <div className="bg-card border rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Edit media</h3>
              <Button size="icon" variant="ghost" onClick={() => setEditingMedia(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <form onSubmit={handleUpdateMedia} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Replace file (optional)</label>
                <input
                  type="file"
                  accept="image/*,video/*"
                  className="block w-full mt-1 text-sm text-muted-foreground"
                  onChange={(e) => setEditMediaFile(e.target.files?.[0] ?? null)}
                />
                {editMediaPreview && (
                  <div className="mt-2 flex items-center gap-2 rounded-md border border-border p-2 bg-background/60">
                    <img
                      src={editMediaPreview}
                      alt="Preview"
                      className="h-14 w-20 rounded-md object-cover"
                    />
                    <span className="text-xs text-muted-foreground">Selected image preview</span>
                  </div>
                )}
              </div>
              <div>
                <label className="text-sm font-medium">Title (optional)</label>
                <Input
                  className="mt-1"
                  value={editMediaTitle}
                  onChange={(e) => setEditMediaTitle(e.target.value)}
                  placeholder="e.g. Behind the scenes"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description (optional)</label>
                <textarea
                  rows={3}
                  value={editMediaDescription}
                  onChange={(e) => setEditMediaDescription(e.target.value)}
                  placeholder="Short description (optional)"
                  className="mt-1 flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setEditingMedia(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateMediaMutation.isPending}>
                  {updateMediaMutation.isPending ? "Saving..." : "Save"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmDeleteMediaOpen}
        title="Delete media"
        description="Are you sure you want to remove this media from the post?"
        confirmLabel="Delete"
        loading={deleteMediaMutation.isPending}
        onCancel={() => {
          setConfirmDeleteMediaOpen(false);
          setMediaToDelete(null);
        }}
        onConfirm={handleConfirmDeleteMedia}
      />

      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
}
