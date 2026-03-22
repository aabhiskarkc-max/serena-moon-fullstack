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
import { AlertCircle, BookOpen, ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";

function CatalogSkeleton({ count }: { count: number }) {
  return (
    <ul className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {Array.from({ length: count }).map((_, i) => (
        <li key={i} className="animate-pulse rounded-2xl border border-border bg-muted/40 h-[320px]" />
      ))}
    </ul>
  );
}

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
    <div className="mx-auto min-h-screen w-full max-w-7xl px-6 py-12 lg:px-10">
      <header className="relative mb-12 flex flex-col items-start justify-between gap-6 border-b border-border/40 pb-10 sm:flex-row sm:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <div className="h-1 w-8 rounded-full bg-primary/60" />
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground/80">
              Digital Library
            </p>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            My Ebooks
          </h1>
          <p className="mt-4 max-w-xl text-balance text-base text-muted-foreground">
            Explore your collection. Click a cover to start reading.
          </p>
        </div>
      </header>

      {catalogQuery.isPending ? (
        <CatalogSkeleton count={10} />
      ) : catalogQuery.isError ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-destructive/20 bg-destructive/5 py-20 text-center">
          <AlertCircle className="h-10 w-10 text-destructive mb-4" />
          <h3 className="text-lg font-semibold">Could not load library</h3>
          <Button variant="outline" className="mt-4" onClick={() => catalogQuery.refetch()}>Retry</Button>
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 sm:gap-x-6 lg:grid-cols-4 xl:grid-cols-5">
          {items.map((book: EbookCatalogItem) => (
            <li key={book.id}>
              <Link href={`/book/${book.id}`} className="group block"
               target="_blank"
              >
                <article className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all duration-300 hover:border-primary/50 hover:shadow-xl hover:-translate-y-1">
                  
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
                    {book.coverImage ? (
                      <Image
                        src={book.coverImage}
                        fill
                        alt={book.title}
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                      />
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center bg-muted/50">
                        <BookOpen className="h-10 w-10 text-muted-foreground/30" />
                      </div>
                    )}

                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 opacity-0 backdrop-blur-[2px] transition-opacity duration-300 group-hover:opacity-100">
                      <span className="translate-y-2 rounded-full bg-white px-3 py-1.5 text-[10px] font-bold text-black transition-transform duration-300 group-hover:translate-y-0">
                        OPEN READER
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col p-3 pb-4">
                    <h2 className="line-clamp-2 text-[13px] font-bold leading-tight text-foreground transition-colors group-hover:text-primary">
                      {book.title}
                    </h2>
                    
                    <div className="mt-auto pt-2 space-y-2">
                      {book.author && (
                        <p className="line-clamp-1 text-[11px] font-medium text-muted-foreground">
                          {book.author}
                        </p>
                      )}
                      
                      {book.planName && (
                        <div className="pt-1">
                          <span className="inline-block rounded bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary ring-1 ring-inset ring-primary/20">
                            {book.planName}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {data && total > 0 && (
        <nav className="mt-16 flex flex-col items-center justify-between gap-6 border-t border-border/40 pt-10 sm:flex-row">
          <p className="text-sm font-medium text-muted-foreground">
            Showing <span className="text-foreground">{items.length}</span> of {total}
          </p>
          
          <div className="flex items-center gap-1 rounded-xl bg-muted/30 p-1 ring-1 ring-border">
            <Button
              variant="ghost"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <span className="px-4 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
              Page {page} / {totalPages}
            </span>

            <Button
              variant="ghost"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </nav>
      )}
    </div>
  );
}