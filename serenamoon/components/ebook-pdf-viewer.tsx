"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Must match the pdf.js API bundled with `react-pdf` (not a separately installed `pdfjs-dist`).
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

type Props = {
  data: ArrayBuffer;
  /** Used for accessible labeling only */
  title?: string;
};

export function EbookPdfViewer({ data, title }: Props) {
  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageWidth, setPageWidth] = useState(840);
  const [pageInput, setPageInput] = useState("1");

  useEffect(() => {
    const update = () => {
      setPageWidth(Math.max(280, Math.min(900, window.innerWidth - 56)));
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const onDocumentLoadSuccess = useCallback(({ numPages: n }: { numPages: number }) => {
    setNumPages(n);
    setPageNumber(1);
    setPageInput("1");
  }, []);

  useEffect(() => {
    setPageInput(String(pageNumber));
  }, [pageNumber]);

  // Copy bytes so pdf.js worker transfer doesn't detach the parent ArrayBuffer; memoize the
  // `file` object so <Document /> doesn't see a new reference every render.
  const file = useMemo(() => ({ data: new Uint8Array(data.slice(0)) }), [data]);

  const goToPage = useCallback(() => {
    const n = Number.parseInt(pageInput, 10);
    if (!Number.isFinite(n) || numPages <= 0) return;
    const clamped = Math.min(numPages, Math.max(1, n));
    setPageNumber(clamped);
    setPageInput(String(clamped));
  }, [pageInput, numPages]);

  const label = title ? `PDF: ${title}` : "PDF document";

  return (
    <div
      className="overflow-hidden rounded-2xl border border-border/80 bg-muted/30 shadow-sm ring-1 ring-black/5 dark:ring-white/10"
      onContextMenu={(e) => e.preventDefault()}
      style={{ userSelect: "none" }}
    >
      <div className="sticky top-0 z-10 flex flex-col gap-3 border-b border-border/80 bg-background/85 px-3 py-3 backdrop-blur-md supports-[backdrop-filter]:bg-background/70 sm:flex-row sm:items-center sm:justify-between sm:px-4">
        <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-9 w-9 shrink-0"
            disabled={pageNumber <= 1}
            onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground sm:text-sm">Page</span>
            <Input
              className="h-9 w-14 text-center tabular-nums"
              inputMode="numeric"
              aria-label="Page number"
              value={pageInput}
              onChange={(e) => setPageInput(e.target.value.replace(/\D/g, ""))}
              onKeyDown={(e) => {
                if (e.key === "Enter") goToPage();
              }}
              onBlur={goToPage}
            />
            <span className="text-xs tabular-nums text-muted-foreground sm:text-sm">
              of {numPages > 0 ? numPages : "—"}
            </span>
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-9 w-9 shrink-0"
            disabled={numPages === 0 || pageNumber >= numPages}
            onClick={() => setPageNumber((p) => Math.min(numPages, p + 1))}
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <p className="hidden text-center text-[11px] text-muted-foreground sm:block sm:text-left sm:text-xs">
          Read in app · selection and context menu limited
        </p>
      </div>

      <div
        className="flex justify-center overflow-auto bg-[#e8e4dc] py-8 dark:bg-zinc-950/80"
        aria-label={label}
      >
        <Document
          className="max-w-full"
          file={file}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={
            <p className="px-4 py-16 text-sm text-muted-foreground dark:text-zinc-400">
              Opening PDF…
            </p>
          }
          error={
            <p className="px-4 py-16 text-sm text-destructive">
              We couldn&apos;t render this PDF. Try again later.
            </p>
          }
        >
          <Page
            pageNumber={pageNumber}
            width={pageWidth}
            renderTextLayer={false}
            renderAnnotationLayer={false}
            className="shadow-lg ring-1 ring-black/10 dark:ring-white/10"
          />
        </Document>
      </div>
    </div>
  );
}
