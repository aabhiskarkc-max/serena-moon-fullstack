"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import {
  createPost,
  deletePost,
  fetchAllPost,
  postsQueryKey,
  setPostPublish,
  updatePost,
  type AdminPost,
} from "@/api/post";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Toast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Plus, Trash2, Pencil, X, ImageIcon, ChevronDown } from "lucide-react";

type FormMode = "create" | "edit";

function apiErr(e: unknown, fallback: string) {
  if (isAxiosError(e)) {
    const m = (e.response?.data as { message?: string } | undefined)?.message;
    if (m) return m;
  }
  if (e instanceof Error) return e.message;
  return fallback;
}

export default function AdminPostsPage() {
  const queryClient = useQueryClient();
  const [caption, setCaption] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<AdminPost["type"]>("image");
  const [visibility, setVisibility] = useState<AdminPost["visibility"]>("free");
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>("create");
  const [activePost, setActivePost] = useState<AdminPost | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [publishMenu, setPublishMenu] = useState<{
    postId: string;
    top: number;
    left: number;
    width: number;
  } | null>(null);
  const publishMenuRef = useRef<HTMLDivElement | null>(null);

  const { data: posts = [], isLoading, isError, error } = useQuery({
    queryKey: postsQueryKey,
    queryFn: fetchAllPost,
  });

  const createMutation = useMutation({
    mutationFn: createPost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: postsQueryKey });
      setToast({ message: "Post created successfully.", type: "success" });
      resetForm();
      setShowForm(false);
    },
    onError: (e) =>
      setToast({ message: apiErr(e, "Failed to create post"), type: "error" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, formData }: { id: string; formData: FormData }) =>
      updatePost(id, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: postsQueryKey });
      setToast({ message: "Post updated successfully.", type: "success" });
      resetForm();
      setShowForm(false);
    },
    onError: (e) =>
      setToast({ message: apiErr(e, "Failed to update post"), type: "error" }),
  });

  const deleteMutation = useMutation({
    mutationFn: deletePost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: postsQueryKey });
      setToast({ message: "Post deleted.", type: "success" });
    },
    onError: (e) =>
      setToast({ message: apiErr(e, "Delete failed"), type: "error" }),
  });

  const publishMutation = useMutation({
    mutationFn: ({ id, isPublished }: { id: string; isPublished: boolean }) =>
      setPostPublish(id, isPublished),
    onSuccess: (_, { isPublished }) => {
      queryClient.invalidateQueries({ queryKey: postsQueryKey });
      setToast({
        message: isPublished ? "Post published." : "Post unpublished.",
        type: "success",
      });
      setPublishMenu(null);
    },
    onError: (e, { isPublished }) =>
      setToast({
        message: apiErr(e, isPublished ? "Failed to publish" : "Failed to unpublish"),
        type: "error",
      }),
  });

  const saving = createMutation.isPending || updateMutation.isPending;
  const togglingPublishId = publishMutation.isPending
    ? publishMutation.variables?.id ?? null
    : null;

  useEffect(() => {
    if (!isError || !error) return;
    setToast({ message: apiErr(error, "Failed to load posts"), type: "error" });
  }, [isError, error]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!publishMenu) return;
      const el = publishMenuRef.current;
      if (el && e.target instanceof Node && el.contains(e.target)) return;
      setPublishMenu(null);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [publishMenu]);

  useEffect(() => {
    if (!publishMenu) return;
    const close = () => setPublishMenu(null);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [publishMenu]);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(id);
  }, [toast]);

  const resetForm = () => {
    setCaption("");
    setDescription("");
    setType("image");
    setVisibility("free");
    setThumbnailFile(null);
    setThumbnailPreview(null);
    setActivePost(null);
  };

  useEffect(() => {
    if (!thumbnailFile) {
      if (formMode === "edit" && activePost?.thumbnail) {
        setThumbnailPreview(activePost.thumbnail);
      } else {
        setThumbnailPreview(null);
      }
      return;
    }
    const objectUrl = URL.createObjectURL(thumbnailFile);
    setThumbnailPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [thumbnailFile, formMode, activePost]);

  const buildFormData = () => {
    const formData = new FormData();
    formData.append("type", type);
    formData.append("visibility", visibility);
    if (caption) formData.append("caption", caption);
    if (description) formData.append("description", description);
    if (thumbnailFile) formData.append("thumbnail", thumbnailFile);
    return formData;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setToast(null);
    const token =
      typeof window !== "undefined" ? localStorage.getItem("serena_token") : null;
    if (!token) {
      setToast({
        message: `You must be logged in as admin or creator to ${
          formMode === "create" ? "create" : "update"
        } posts.`,
        type: "error",
      });
      return;
    }
    const fd = buildFormData();
    if (formMode === "create") {
      createMutation.mutate(fd);
    } else if (activePost) {
      updateMutation.mutate({ id: activePost.id, formData: fd });
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Posts</h2>
          <p className="text-sm text-muted-foreground">
            Manage content posts, thumbnails, and visibility.
          </p>
        </div>
        <Button
          size="icon"
          variant="outline"
          onClick={() => {
            resetForm();
            setFormMode("create");
            setShowForm(true);
          }}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-card">
        <table className="min-w-full text-sm">
          <thead className="border-b bg-muted/60">
            <tr className="text-left">
              <th className="px-4 py-2 font-medium">Thumbnail</th>
              <th className="px-4 py-2 font-medium">Caption</th>
              <th className="px-4 py-2 font-medium">Type</th>
              <th className="px-4 py-2 font-medium">Visibility</th>
              <th className="px-4 py-2 font-medium">Published</th>
              <th className="px-4 py-2 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  Loading posts…
                </td>
              </tr>
            ) : (
              posts.map((post) => (
                <tr
                  key={post.id}
                  className="border-b last:border-0 hover:bg-muted/40 transition-colors"
                >
                  <td className="px-4 py-2">
                    {post.thumbnail ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={post.thumbnail}
                        alt={post.caption ?? "Post thumbnail"}
                        className="h-10 w-16 rounded-md object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-16 items-center justify-center rounded-md border bg-muted/40 text-muted-foreground">
                        <ImageIcon className="h-4 w-4" />
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-2 max-w-xs truncate">
                    {post.caption || (
                      <span className="text-muted-foreground italic">No caption</span>
                    )}
                  </td>
                  <td className="px-4 py-2 capitalize">{post.type}</td>
                  <td className="px-4 py-2 capitalize">{post.visibility}</td>
                  <td className="px-4 py-2">
                    <div className="inline-flex">
                      <button
                        type="button"
                        onClick={(e) => {
                          if (togglingPublishId === post.id) return;
                          const rect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
                          const width = Math.max(176, rect.width);
                          const top = rect.bottom + 8;
                          const left = Math.min(
                            Math.max(8, rect.left),
                            Math.max(8, window.innerWidth - width - 8),
                          );
                          setPublishMenu((prev) =>
                            prev?.postId === post.id ? null : { postId: post.id, top, left, width },
                          );
                        }}
                        disabled={togglingPublishId === post.id}
                        className={[
                          "cursor-pointer inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition",
                          "disabled:opacity-60 disabled:cursor-not-allowed",
                          post.isPublished
                            ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                            : "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-300",
                        ].join(" ")}
                        title="Change publish status"
                      >
                        {togglingPublishId === post.id
                          ? "Updating…"
                          : post.isPublished
                            ? "Published"
                            : "Unpublished"}
                        <ChevronDown className="h-3.5 w-3.5 opacity-70" />
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/admin/posts/${post.id}`}>
                        <Button size="sm" variant="outline" className="cursor-pointer h-8 px-2">
                          View
                        </Button>
                      </Link>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="cursor-pointer"
                        onClick={() => {
                          setActivePost(post);
                          setCaption(post.caption ?? "");
                          setDescription(post.description ?? "");
                          setType(post.type);
                          setVisibility(post.visibility);
                          setFormMode("edit");
                          setShowForm(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        className="cursor-pointer"
                        variant="ghost"
                        onClick={() => {
                          setActivePost(post);
                          setConfirmDeleteOpen(true);
                        }}
                        disabled={
                          deleteMutation.isPending && deleteMutation.variables === post.id
                        }
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
            {!isLoading && posts.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-sm text-muted-foreground"
                >
                  No posts created yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-2xl border bg-card p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">
                  {formMode === "create" ? "Create post" : "Edit post"}
                </h3>
               
              </div>
              <Button
                size="icon"
                className="cursor-pointer"
                variant="ghost"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="grid gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium" htmlFor="caption">
                  Caption
                </label>
                <Input
                  id="caption"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Short title or caption..."
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium" htmlFor="description">
                  Description
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Longer description of the post..."
                  rows={3}
                  className="w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium" htmlFor="type">
                  Type
                </label>
                <div className="relative">
                  <select
                    id="type"
                    className="cursor-pointer h-8 w-full appearance-none rounded-lg border border-input bg-background dark:bg-neutral-900 text-foreground px-2.5 pr-8 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 [color-scheme:light] dark:bg-input/30 dark:[color-scheme:dark]"
                    value={type}
                    onChange={(e) => setType(e.target.value as AdminPost["type"])}
                  >
                    <option value="image">Image</option>
                    <option value="video">Video</option>
                    <option value="text">Text</option>
                    <option value="reel">Reel</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                </div>
              </div>\
              <div className="space-y-1">
                <label className="text-sm font-medium" htmlFor="visibility">
                  Visibility
                </label>
                <div className="relative">
                  <select
                    id="visibility"
                    className="cursor-pointer h-8 w-full appearance-none rounded-lg border border-input dark:bg-neutral-900 bg-background text-foreground px-2.5 pr-8 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 [color-scheme:light] dark:bg-input/30 dark:[color-scheme:dark]"
                    value={visibility}
                    onChange={(e) =>
                      setVisibility(e.target.value as AdminPost["visibility"])
                    }
                  >
                    <option value="free">Free</option>
                    <option value="subscriber">Subscriber</option>
                    <option value="premium">Premium</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium flex items-center gap-2" htmlFor="thumbnail">
                  {formMode === "create"
                    ? "Thumbnail (image)"
                    : "Replace thumbnail"}
                </label>
                <div className="flex items-center gap-2">
                  <label
                    htmlFor="thumbnail"
                    className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-input bg-background px-2 py-1.5 text-xs font-medium text-muted-foreground transition hover:border-ring hover:text-ring"
                  >
                    <ImageIcon className="h-3.5 w-3.5" />
                    Update thumbnail
                  </label>
                  <span className="text-xs text-muted-foreground">
                    {thumbnailFile?.name ?? "No file selected"}
                  </span>
                </div>
                <input
                  id="thumbnail"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    setThumbnailFile(file);
                  }}
                  className="sr-only"
                />
                {thumbnailPreview && (
                  <div className="flex items-center gap-2 rounded-md border border-border p-2 bg-background/60">
                    <img
                      src={thumbnailPreview}
                      alt="Thumbnail preview"
                      className="h-14 w-20 rounded-md object-cover"
                    />
                    <span className="text-xs text-muted-foreground">
                      {formMode === "edit" ? "Current / selected thumbnail" : "Selected thumbnail"}
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving
                    ? formMode === "create"
                      ? "Creating..."
                      : "Saving..."
                    : formMode === "create"
                      ? "Create post"
                      : "Save changes"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmDeleteOpen}
        title="Delete post"
        description={
          activePost
            ? `Are you sure you want to delete this post? This action cannot be undone.`
            : "Are you sure you want to delete this post?"
        }
        confirmLabel="Delete"
        loading={deleteMutation.isPending}
        onCancel={() => {
          setConfirmDeleteOpen(false);
        }}
        onConfirm={() => {
          if (activePost) {
            deleteMutation.mutate(activePost.id);
          }
          setConfirmDeleteOpen(false);
        }}
      />

      {toast && <Toast message={toast.message} type={toast.type} />}

      {publishMenu ? (
        <div
          ref={publishMenuRef}
          className="fixed z-[200] overflow-hidden rounded-xl border bg-card shadow-xl"
          style={{ top: publishMenu.top, left: publishMenu.left, width: publishMenu.width }}
        >
          {(() => {
            const post = posts.find((p) => p.id === publishMenu.postId);
            if (!post) return null;
            return (
              <>
                <button
                  type="button"
                  className="w-full px-3 py-2 text-left text-sm hover:bg-muted/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={togglingPublishId === post.id || post.isPublished}
                  onClick={() => {
                    setToast(null);
                    const token =
                      typeof window !== "undefined"
                        ? localStorage.getItem("serena_token")
                        : null;
                    if (!token) {
                      setToast({
                        message: "You must be logged in as admin/creator.",
                        type: "error",
                      });
                      return;
                    }
                    publishMutation.mutate({ id: post.id, isPublished: true });
                  }}
                >
                  Publish
                </button>
                <button
                  type="button"
                  className="w-full px-3 py-2 text-left text-sm hover:bg-muted/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={togglingPublishId === post.id || !post.isPublished}
                  onClick={() => {
                    setToast(null);
                    const token =
                      typeof window !== "undefined"
                        ? localStorage.getItem("serena_token")
                        : null;
                    if (!token) {
                      setToast({
                        message: "You must be logged in as admin/creator.",
                        type: "error",
                      });
                      return;
                    }
                    publishMutation.mutate({ id: post.id, isPublished: false });
                  }}
                >
                  Unpublish
                </button>
              </>
            );
          })()}
        </div>
      ) : null}
    </div>
  );
}
