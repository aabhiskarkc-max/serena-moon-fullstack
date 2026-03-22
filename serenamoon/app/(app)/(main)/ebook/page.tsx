"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ebooksCatalogQueryKey,
  fetchEbookCatalog,
  type EbookCatalogItem,
} from "@/api/ebook";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function EbookLibraryPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const catalogQuery = useQuery({
    queryKey: ebooksCatalogQueryKey(page, limit),
    queryFn: () => fetchEbookCatalog({ page, limit }),
  });

  const data = catalogQuery.data;
  const items = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;
  const total = data?.total ?? 0;

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8 pb-16">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Ebooks</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Open a title to read in the app. Files are streamed from the server — direct download links
          are not exposed.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <span>Per page</span>
        <select
          value={limit}
          onChange={(e) => {
            setLimit(Number(e.target.value));
            setPage(1);
          }}
          className="h-9 rounded-md border border-input bg-background px-2"
        >
          {[10, 20, 50].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>

      {catalogQuery.isPending ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : catalogQuery.isError ? (
        <p className="text-sm text-destructive">Could not load ebooks.</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No ebooks available yet.</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {items.map((book: EbookCatalogItem) => (
            <li
              key={book.id}
              className="flex gap-4 rounded-xl border border-border bg-card p-4 transition-colors hover:bg-muted/30"
            >
              <div className="shrink-0">
                {book.coverImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={book.coverImage}
                    alt=""
                    className="h-24 w-16 rounded-md border object-cover"
                  />
                ) : (
                  <div className="flex h-24 w-16 items-center justify-center rounded-md border bg-muted text-xs text-muted-foreground">
                    No cover
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="font-medium leading-snug">{book.title}</h2>
                {book.author ? (
                  <p className="mt-0.5 text-xs text-muted-foreground">{book.author}</p>
                ) : null}
                {book.planName ? (
                  <p className="mt-1 text-[11px] uppercase tracking-wide text-muted-foreground">
                    {book.planName}
                  </p>
                ) : null}
                <Button className="mt-3" size="sm" asChild>
                  <Link href={`/ebook/${book.id}`}>Read</Link>
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {data && total > 0 ? (
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
    </div>
  );
}
