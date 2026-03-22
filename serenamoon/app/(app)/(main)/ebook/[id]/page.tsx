"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { ArrowLeft, BookOpen, FileWarning, Loader2 } from "lucide-react";
import {
  ebookCatalogItemQueryKey,
  fetchEbookCatalogItem,
  fetchEbookReadForViewer,
} from "@/api/ebook";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const EbookPdfViewer = dynamic(
  () => import("@/components/ebook-pdf-viewer").then((m) => m.EbookPdfViewer),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[50vh] items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin opacity-70" />
          <p className="text-sm">Preparing reader…</p>
        </div>
      </div>
    ),
  },
);

function apiMessage(e: unknown, fallback: string) {
  if (isAxiosError(e)) {
    const m = (e.response?.data as { message?: string } | undefined)?.message;
    if (typeof m === "string" && m) return m;
    if (e.message) return e.message;
  }
  return fallback;
}

function ReaderChromeSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-9 w-40 rounded-lg bg-muted" />
      <div className="flex flex-col gap-6 rounded-2xl border border-border/80 bg-card/80 p-6 shadow-sm sm:flex-row sm:items-start">
        <div className="mx-auto h-44 w-28 shrink-0 rounded-xl bg-muted sm:mx-0" />
        <div className="min-w-0 flex-1 space-y-3 text-center sm:text-left">
          <div className="mx-auto h-8 max-w-lg rounded-lg bg-muted sm:mx-0" />
          <div className="mx-auto h-4 w-48 rounded bg-muted sm:mx-0" />
          <div className="mx-auto h-5 w-24 rounded-full bg-muted sm:mx-0" />
        </div>
      </div>
      <div className="min-h-[55vh] rounded-2xl border border-border/60 bg-muted/25" />
    </div>
  );
}

export default function EbookReaderPage() {
  const params = useParams<{ id: string }>();
  const id = params.id ?? "";

  const metaQuery = useQuery({
    queryKey: ebookCatalogItemQueryKey(id),
    queryFn: () => fetchEbookCatalogItem(id),
    enabled: Boolean(id),
  });

  const [buffer, setBuffer] = useState<ArrayBuffer | null>(null);
  const [displayMime, setDisplayMime] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [fileLoading, setFileLoading] = useState(false);

  useEffect(() => {
    if (!id || !metaQuery.isSuccess) return;
    let cancelled = false;

    (async () => {
      setFileLoading(true);
      setFileError(null);
      setBuffer(null);
      setDisplayMime(null);
      try {
        const { data, displayMime: mime } = await fetchEbookReadForViewer(id);
        if (cancelled) return;
        setBuffer(data);
        setDisplayMime(mime);
      } catch (e) {
        if (cancelled) return;
        setFileError(apiMessage(e, "Could not open this book."));
      } finally {
        if (!cancelled) setFileLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id, metaQuery.isSuccess]);

  const book = metaQuery.data;
  const showPdf = buffer && displayMime === "application/pdf";
  const showEpub = buffer && displayMime === "application/epub+zip";

  return (
    <div className="mx-auto w-full max-w-4xl pb-20">
      <nav className="mb-6">
        <Button variant="ghost" size="sm" className="-ml-2 gap-1.5 text-muted-foreground" asChild>
          <Link href="/ebook">
            <ArrowLeft className="h-4 w-4" />
            Ebooks
          </Link>
        </Button>
      </nav>

      {metaQuery.isPending ? (
        <ReaderChromeSkeleton />
      ) : metaQuery.isError ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center">
          <FileWarning className="mx-auto h-10 w-10 text-destructive/80" />
          <h1 className="mt-4 text-lg font-semibold tracking-tight">We couldn&apos;t open this book</h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            {apiMessage(metaQuery.error, "You may not have access, or this title may have been removed.")}
          </p>
          <Button className="mt-6" asChild>
            <Link href="/ebook">Back to library</Link>
          </Button>
        </div>
      ) : book ? (
        <div className="space-y-8">
          <header className="overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-br from-card via-card to-muted/40 p-6 shadow-sm ring-1 ring-border/40 sm:p-8">
            <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
              <div className="shrink-0">
                {book.coverImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={book.coverImage}
                    alt=""
                    className="h-48 w-32 rounded-xl border border-border/60 object-cover shadow-md"
                  />
                ) : (
                  <div className="flex h-48 w-32 items-center justify-center rounded-xl border border-dashed border-border bg-muted/50 text-muted-foreground">
                    <BookOpen className="h-10 w-10 opacity-40" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1 text-center sm:text-left">
                <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                  Reading
                </p>
                <h1 className="mt-1 text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">
                  {book.title}
                </h1>
                {book.author ? (
                  <p className="mt-2 text-sm text-muted-foreground">by {book.author}</p>
                ) : null}
                {book.planName ? (
                  <Badge variant="secondary" className="mt-3">
                    {book.planName}
                  </Badge>
                ) : null}
                {book.description ? (
                  <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-muted-foreground sm:line-clamp-4">
                    {book.description}
                  </p>
                ) : null}
              </div>
            </div>
          </header>

          <section aria-label="Book content">
            {fileLoading ? (
              <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-muted/15 py-16">
                <Loader2 className="h-9 w-9 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Loading pages…</p>
              </div>
            ) : fileError ? (
              <div className="rounded-2xl border border-border bg-muted/20 p-8 text-center">
                <p className="text-sm font-medium text-foreground">Couldn&apos;t load the file</p>
                <p className="mt-2 text-sm text-muted-foreground">{fileError}</p>
                <Button variant="outline" className="mt-6" asChild>
                  <Link href="/ebook">Return to library</Link>
                </Button>
              </div>
            ) : showPdf ? (
              <EbookPdfViewer data={buffer} title={book.title} />
            ) : showEpub ? (
              <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
                <div className="mx-auto max-w-md text-center">
                  <BookOpen className="mx-auto h-12 w-12 text-muted-foreground/60" />
                  <h2 className="mt-4 text-lg font-semibold">EPUB edition</h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    In-app reading is available for PDFs. This title is an EPUB — we don&apos;t show a
                    download link here; contact support if you need another format.
                  </p>
                </div>
              </div>
            ) : buffer ? (
              <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
                <div className="mx-auto max-w-md text-center">
                  <FileWarning className="mx-auto h-12 w-12 text-muted-foreground/60" />
                  <h2 className="mt-4 text-lg font-semibold">Unsupported format</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    This file isn&apos;t a PDF we can display in the reader.
                  </p>
                </div>
              </div>
            ) : null}
          </section>
        </div>
      ) : null}
    </div>
  );
}
