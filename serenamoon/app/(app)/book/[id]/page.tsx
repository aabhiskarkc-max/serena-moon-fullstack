"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import {  BookOpen, FileWarning, Loader2 } from "lucide-react";
import {
  ebookCatalogItemQueryKey,
  fetchEbookCatalogItem,
  fetchEbookReadForViewer,
} from "@/api/ebook";
import { Button } from "@/components/ui/button";

const EbookPdfViewer = dynamic(
  () => import("@/components/ebook-pdf-viewer").then((m) => m.EbookPdfViewer),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[60vh] flex-col items-center justify-center rounded-3xl border-2 border-dashed border-border/60 bg-muted/10">
        <Loader2 className="h-10 w-10 animate-spin text-primary/40" />
        <p className="mt-4 text-sm font-medium text-muted-foreground">Initializing reader engine...</p>
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
    <div className="animate-pulse space-y-2">
      <div className="flex items-center justify-between">
        <div className="h-8 w-32 rounded-full bg-muted" />
        <div className="h-8 w-8 rounded-full bg-muted" />
      </div>
      <div className="h-[70vh] rounded-3xl bg-muted/30" />
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
    <div className="mx-auto min-h-screen w-full max-w-5xl ">

      {metaQuery.isPending ? (
        <ReaderChromeSkeleton />
      ) : metaQuery.isError ? (
        <div className="flex flex-col items-center justify-center  bg-destructive/5  text-center">
          <div className=" bg-destructive/10 ">
            <FileWarning className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="mt-6 text-xl font-bold tracking-tight">Access Denied</h1>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            {apiMessage(metaQuery.error, "You may not have access, or this title may have been removed.")}
          </p>
          <Button className="mt-8 rounded-full px-8" asChild>
            <Link href="/ebook">Back to library</Link>
          </Button>
        </div>
      ) : book ? (
        <main className="">
          <section aria-label="Book content" className="relative">
            {fileLoading ? (
              <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4  bg-muted/5 py-20">
                <div className="relative flex items-center justify-center">
                   <Loader2 className="h-12 w-12 animate-spin text-primary" />
                   <BookOpen className="absolute h-5 w-5 text-primary/40" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold uppercase tracking-widest text-foreground/80">Fetching Content</p>
                  <p className="text-xs text-muted-foreground mt-1">Downloading encrypted pages...</p>
                </div>
              </div>
            ) : fileError ? (
              <div className="rounded-3xl border border-border bg-card p-12 text-center shadow-sm">
                <p className="text-base font-bold text-foreground">Loading Failed</p>
                <p className="mt-2 text-sm text-muted-foreground">{fileError}</p>
                <Button variant="outline" className="mt-8 rounded-full" onClick={() => window.location.reload()}>
                  Refresh Reader
                </Button>
              </div>
            ) : showPdf ? (
              <div className="overflow-hidden rounded-2xl  bg-card shadow-2xl transition-all">
                <EbookPdfViewer data={buffer} title={book.title} />
              </div>
            ) : showEpub ? (
              <div className="flex flex-col items-center justify-center rounded-3xl border border-border bg-card p-12 shadow-sm text-center">
                <div className="mb-6 rounded-full bg-primary/5 p-6">
                   <BookOpen className="h-12 w-12 text-primary/60" />
                </div>
                <h2 className="text-2xl font-bold italic serif">EPUB Edition</h2>
                <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
                  Our in-app reader currently optimizes for <span className="font-bold text-foreground">PDF flow</span>. 
                  This title is available in EPUB format. Please contact support if you require a PDF conversion for in-app viewing.
                </p>
                <Button variant="secondary" className="mt-8 rounded-full" asChild>
                  <Link href="/ebook">Return to library</Link>
                </Button>
              </div>
            ) : buffer ? (
              <div className="rounded-3xl border border-border bg-card p-12 text-center shadow-sm">
                <FileWarning className="mx-auto h-12 w-12 text-muted-foreground/40" />
                <h2 className="mt-4 text-lg font-bold">Format Not Supported</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  This specific file extension is not yet compatible with the web reader.
                </p>
              </div>
            ) : null}
          </section>
        </main>
      ) : null}
      
     
    </div>
  );
}