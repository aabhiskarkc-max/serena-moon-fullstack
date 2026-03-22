"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { isAxiosError } from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Toast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { fetchPlans, plansQueryKey } from "@/api/plan";
import {
  createEbook,
  deleteEbook,
  ebooksAdminQueryKey,
  fetchEbooksAdmin,
  type EbookAdminRow,
  type PaginatedEbooks,
  type UpdateEbookBody,
  updateEbook,
  uploadEbookCover,
  uploadEbookFile,
} from "@/api/ebook";
import {
  Plus,
  X,
  ChevronLeft,
  ChevronRight,
  Upload,
  Pencil,
  Trash2,
} from "lucide-react";

type FormMode = "create" | "edit";

function apiErr(e: unknown, fallback: string) {
  if (isAxiosError(e)) {
    const m = (e.response?.data as { message?: string } | undefined)?.message;
    if (m) return m;
  }
  if (e instanceof Error) return e.message;
  return fallback;
}

export default function AdminEbooksPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>("create");
  const [editingEbook, setEditingEbook] = useState<EbookAdminRow | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [ebookPendingDelete, setEbookPendingDelete] = useState<EbookAdminRow | null>(null);

  const [title, setTitle] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [ebookFileName, setEbookFileName] = useState("");
  const [author, setAuthor] = useState("");
  const [description, setDescription] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [planId, setPlanId] = useState<string>("");

  const [fileUploading, setFileUploading] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);

  const plansQuery = useQuery({
    queryKey: plansQueryKey,
    queryFn: fetchPlans,
  });

  const ebooksQuery = useQuery({
    queryKey: ebooksAdminQueryKey(page, limit),
    queryFn: () => fetchEbooksAdmin({ page, limit }),
  });

  const invalidateEbookLists = () => {
    void queryClient.invalidateQueries({ queryKey: ["ebooks", "admin"] });
    void queryClient.invalidateQueries({ queryKey: ["ebooks", "catalog"] });
  };

  const createMutation = useMutation({
    mutationFn: createEbook,
    onSuccess: async () => {
      await invalidateEbookLists();
      setToast({ message: "Ebook created.", type: "success" });
      resetForm();
      setShowForm(false);
    },
    onError: (e) => setToast({ message: apiErr(e, "Failed to create ebook"), type: "error" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Parameters<typeof updateEbook>[1] }) =>
      updateEbook(id, body),
    onSuccess: async () => {
      await invalidateEbookLists();
      setToast({ message: "Ebook updated.", type: "success" });
      resetForm();
      setShowForm(false);
      setEditingEbook(null);
    },
    onError: (e) => setToast({ message: apiErr(e, "Failed to update ebook"), type: "error" }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteEbook,
    onSuccess: async () => {
      const key = ebooksAdminQueryKey(page, limit);
      const prev = queryClient.getQueryData<PaginatedEbooks>(key);
      await invalidateEbookLists();
      if (prev && prev.items.length === 1 && page > 1) {
        setPage((p) => Math.max(1, p - 1));
      }
      setToast({ message: "Ebook deleted.", type: "success" });
      setEbookPendingDelete(null);
      setConfirmDeleteOpen(false);
    },
    onError: (e) => setToast({ message: apiErr(e, "Failed to delete ebook"), type: "error" }),
  });

  useEffect(() => {
    if (!plansQuery.isError || !plansQuery.error) return;
    setToast({ message: apiErr(plansQuery.error, "Failed to load plans"), type: "error" });
  }, [plansQuery.isError, plansQuery.error]);

  useEffect(() => {
    if (!ebooksQuery.isError || !ebooksQuery.error) return;
    setToast({ message: apiErr(ebooksQuery.error, "Failed to load ebooks"), type: "error" });
  }, [ebooksQuery.isError, ebooksQuery.error]);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(id);
  }, [toast]);

  const plans = plansQuery.data ?? [];

  const resetForm = () => {
    setTitle("");
    setFileUrl("");
    setEbookFileName("");
    setAuthor("");
    setDescription("");
    setCoverImage("");
    setPlanId("");
    setEditingEbook(null);
    setFormMode("create");
  };

  const openCreate = () => {
    resetForm();
    setFormMode("create");
    setShowForm(true);
  };

  const openEdit = (row: EbookAdminRow) => {
    setEditingEbook(row);
    setFormMode("edit");
    setTitle(row.title);
    setFileUrl("");
    setEbookFileName(
      row.hasAsset
        ? "File on server — upload a new file to replace"
        : "No file — upload required",
    );
    setAuthor(row.author ?? "");
    setDescription(row.description ?? "");
    setCoverImage(row.coverImage ?? "");
    setPlanId(row.planId ?? "");
    setShowForm(true);
  };

  const onEbookFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setFileUploading(true);
    setToast(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const { url } = await uploadEbookFile(formData);
      setFileUrl(url);
      setEbookFileName(file.name);
      setToast({ message: "Ebook file uploaded to Cloudinary.", type: "success" });
    } catch (err: unknown) {
      setToast({ message: apiErr(err, "Ebook file upload failed"), type: "error" });
      if (formMode === "create") {
        setFileUrl("");
        setEbookFileName("");
      }
    } finally {
      setFileUploading(false);
    }
  };

  const onCoverSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setToast({ message: "Cover must be an image.", type: "error" });
      return;
    }
    setCoverUploading(true);
    setToast(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const { url } = await uploadEbookCover(formData);
      setCoverImage(url);
      setToast({ message: "Cover uploaded to Cloudinary.", type: "success" });
    } catch (err: unknown) {
      setToast({ message: apiErr(err, "Cover upload failed"), type: "error" });
    } finally {
      setCoverUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (formMode === "create") {
      if (!fileUrl.trim()) {
        setToast({ message: "Upload an ebook file first.", type: "error" });
        return;
      }
      createMutation.mutate({
        title: title.trim(),
        fileUrl: fileUrl.trim(),
        author: author.trim() || null,
        description: description.trim() || null,
        coverImage: coverImage.trim() || null,
        planId: planId || null,
      });
      return;
    }

    if (formMode === "edit" && editingEbook) {
      if (!fileUrl.trim() && !editingEbook.hasAsset) {
        setToast({
          message: "Upload an ebook file — none is stored for this title yet.",
          type: "error",
        });
        return;
      }
      const body: UpdateEbookBody = {
        title: title.trim(),
        author: author.trim() || null,
        description: description.trim() || null,
        coverImage: coverImage.trim() || null,
        planId: planId || null,
      };
      if (fileUrl.trim()) body.fileUrl = fileUrl.trim();
      updateMutation.mutate({ id: editingEbook.id, body });
    }
  };

  const data = ebooksQuery.data;
  const items = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;
  const total = data?.total ?? 0;
  const listLoading = ebooksQuery.isPending;
  const formBusy = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            Per page
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="h-9 rounded-md border border-input bg-background px-2 text-sm"
            >
              {[10, 20, 50, 100].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <Button size="icon" variant="outline" onClick={openCreate}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-card">
        <table className="min-w-full text-sm">
          <thead className="border-b bg-muted/60">
            <tr className="text-left">
              <th className="px-4 py-2 font-medium">Title</th>
              <th className="px-4 py-2 font-medium">Plan</th>
              <th className="px-4 py-2 font-medium">Cover</th>
              <th className="px-4 py-2 font-medium">File</th>
              <th className="px-4 py-2 font-medium">Created</th>
              <th className="px-4 py-2 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {listLoading ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                  Loading…
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                  No ebooks yet. Create one with the + button.
                </td>
              </tr>
            ) : (
              items.map((row) => (
                <tr
                  key={row.id}
                  className="border-b last:border-0 hover:bg-muted/40 transition-colors"
                >
                  <td className="px-4 py-2">
                    <div className="font-medium">{row.title}</div>
                    {row.author ? (
                      <div className="text-xs text-muted-foreground">{row.author}</div>
                    ) : null}
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">
                    {row.planName ?? (row.planId ? "—" : "None")}
                  </td>
                  <td className="px-4 py-2">
                    {row.coverImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={row.coverImage}
                        alt=""
                        className="h-14 w-10 rounded object-cover border border-border"
                      />
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    {row.hasAsset ? (
                      <Button className="cursor-pointer p-2 bg-indigo-500 text-white">
                        <Link
                          href={`/ebook/${row.id}`}
                          className="cursor-pointer text-sm text-primary underline-offset-4 hover:underline"
                        >
                          Read in app
                        </Link>
                      </Button>

                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-muted-foreground whitespace-nowrap">
                    {row.createdAt
                      ? new Date(row.createdAt).toLocaleString(undefined, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })
                      : "—"}
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => openEdit(row)}
                        aria-label="Edit ebook"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          setEbookPendingDelete(row);
                          setConfirmDeleteOpen(true);
                        }}
                        aria-label="Delete ebook"
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!listLoading && data && total > 0 ? (
        <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <span className="text-sm tabular-nums text-muted-foreground">
              Page {page} / {totalPages}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : null}

      {showForm && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border bg-card p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">
                  {formMode === "create" ? "Create ebook" : "Edit ebook"}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {formMode === "create"
                    ? "Upload the ebook file and optional cover; URLs are stored from Cloudinary."
                    : "Change fields or upload new files to replace existing URLs."}
                </p>
              </div>
              <Button
                size="icon"
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
                <label className="text-sm font-medium" htmlFor="ebook-title">
                  Title
                </label>
                <Input
                  id="ebook-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Book title"
                  required
                />
              </div>

              <div className="space-y-2 rounded-lg border border-border bg-muted/20 p-3">
                <label className="text-sm font-medium">Ebook file (Cloudinary)</label>
                <p className="text-xs text-muted-foreground">
                  PDF, EPUB, or other documents. When editing, upload only if you want a new file.
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={fileUploading}
                    className="relative"
                    asChild
                  >
                    <label className="cursor-pointer">
                      <Upload className="mr-2 h-4 w-4" />
                      {fileUploading ? "Uploading…" : "Choose file"}
                      <input
                        type="file"
                        className="sr-only"
                        accept=".pdf,.epub,.mobi,.txt,application/pdf,application/epub+zip"
                        onChange={onEbookFileSelected}
                        disabled={fileUploading}
                      />
                    </label>
                  </Button>
                  {ebookFileName ? (
                    <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                      {ebookFileName}
                    </span>
                  ) : null}
                </div>
                {fileUrl ? (
                  <p className="text-[11px] text-muted-foreground">New file ready (sent to server on save only).</p>
                ) : null}
              </div>

              <div className="space-y-2 rounded-lg border border-border bg-muted/20 p-3">
                <label className="text-sm font-medium">Cover image (optional)</label>
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={coverUploading}
                    asChild
                  >
                    <label className="cursor-pointer">
                      <Upload className="mr-2 h-4 w-4" />
                      {coverUploading ? "Uploading…" : "Upload cover"}
                      <input
                        type="file"
                        className="sr-only"
                        accept="image/*"
                        onChange={onCoverSelected}
                        disabled={coverUploading}
                      />
                    </label>
                  </Button>
                  {coverImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={coverImage}
                      alt="Cover preview"
                      className="h-20 w-14 rounded border object-cover"
                    />
                  ) : null}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium" htmlFor="ebook-author">
                  Author
                </label>
                <Input
                  id="ebook-author"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="Optional"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium" htmlFor="ebook-desc">
                  Description
                </label>
                <textarea
                  id="ebook-desc"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional"
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium" htmlFor="ebook-plan">
                  Subscription plan
                </label>
                <select
                  id="ebook-plan"
                  value={planId}
                  onChange={(e) => setPlanId(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">None (not tied to a plan)</option>
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mt-2 flex justify-end gap-2">
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
                <Button
                  type="submit"
                  disabled={
                    formBusy ||
                    (formMode === "create"
                      ? !fileUrl.trim()
                      : !editingEbook?.hasAsset && !fileUrl.trim())
                  }
                >
                  {formBusy
                    ? formMode === "create"
                      ? "Creating…"
                      : "Saving…"
                    : formMode === "create"
                      ? "Create ebook"
                      : "Save changes"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmDeleteOpen}
        title="Delete ebook"
        description={
          ebookPendingDelete
            ? `Delete “${ebookPendingDelete.title}”? This cannot be undone.`
            : "Delete this ebook?"
        }
        confirmLabel="Delete"
        loading={deleteMutation.isPending}
        onCancel={() => {
          setConfirmDeleteOpen(false);
          setEbookPendingDelete(null);
        }}
        onConfirm={() => {
          if (ebookPendingDelete) {
            deleteMutation.mutate(ebookPendingDelete.id);
          }
        }}
      />

      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
}
