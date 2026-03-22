"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

type Props = {
  data: ArrayBuffer;
  title?: string;
};

export function EbookPdfViewer({ data, title }: Props) {
  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageWidth, setPageWidth] = useState(840);
  const [pageInput, setPageInput] = useState("1");

  useEffect(() => {
    const update = () => {
      setPageWidth(Math.min(900, window.innerWidth - 32));
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
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [pageNumber]);

  const file = useMemo(() => ({ data: new Uint8Array(data.slice(0)) }), [data]);

  const goToPage = useCallback(() => {
    const n = Number.parseInt(pageInput, 10);
    if (!Number.isFinite(n) || numPages <= 0) return;
    const clamped = Math.min(numPages, Math.max(1, n));
    setPageNumber(clamped);
    setPageInput(String(clamped));
  }, [pageInput, numPages]);

  return (
    <div className="relative flex flex-col w-full bg-[#e8e4dc] dark:bg-zinc-950">
      <div className="flex justify-center pb-2">
        <Document
          file={file}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={<div className="h-[60vh] flex items-center justify-center text-sm">Loading...</div>}
        >
          <Page
            pageNumber={pageNumber}
            width={pageWidth}
            renderTextLayer={false}
            renderAnnotationLayer={false}
            className="shadow-md border border-black/5"
          />
        </Document>
      </div>

      <div className="sticky bottom-4 mx-auto mb-6 z-50">
        <div className="flex items-center gap-1.5 rounded-full border border-border/50 bg-background/90 p-1.5 shadow-2xl backdrop-blur-md ring-1 ring-black/5">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-full"
            disabled={pageNumber <= 1}
            onClick={() => setPageNumber((p) => p - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="flex items-center px-1 text-[12px] font-medium tabular-nums">
            <Input
              className="h-6 w-9 border-none bg-transparent p-0 text-center text-[12px] focus-visible:ring-0"
              value={pageInput}
              onChange={(e) => setPageInput(e.target.value.replace(/\D/g, ""))}
              onKeyDown={(e) => e.key === "Enter" && goToPage()}
              onBlur={goToPage}
            />
            <span className="text-muted-foreground mx-1">/</span>
            <span>{numPages || "—"}</span>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-full"
            disabled={pageNumber >= numPages}
            onClick={() => setPageNumber((p) => p + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}