"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useInfiniteQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Toast } from "@/components/ui/toast";
import { ImageIcon, Video, Sparkles, Lock } from "lucide-react";
import { feedQueryKey, fetchFeedPage, type FeedFilter, type FeedItem, type PublicPost } from "@/api/post";

function apiErr(e: unknown, fallback: string) {
  if (isAxiosError(e)) {
    const m = (e.response?.data as { message?: string } | undefined)?.message;
    if (m) return m;
  }
  if (e instanceof Error) return e.message;
  return fallback;
}

function formatVisibility(v: PublicPost["visibility"]) {
  if (v === "free") return { label: "Free", icon: null as any, className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" };
  if (v === "subscriber") return { label: "Subscriber", icon: Lock as any, className: "bg-sky-500/10 text-sky-700 dark:text-sky-300" };
  return { label: "Premium", icon: Sparkles as any, className: "bg-amber-500/15 text-amber-800 dark:text-amber-300" };
}

function formatType(t: PublicPost["type"]) {
  if (t === "video" || t === "reel") return { label: t === "reel" ? "Reel" : "Video", Icon: Video };
  if (t === "text") return { label: "Text", Icon: null as any };
  return { label: "Image", Icon: ImageIcon };
}

function isVideoUrl(url: string | null | undefined) {
  if (!url) return false;
  return /\.(mp4|webm|mov|m4v|ogg)(\?|#|$)/i.test(url);
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function postHref(post: PublicPost) {
  const base = slugify(post.caption || "post") || "post";
  // Use `--` delimiter so UUID dashes don't break parsing
  return `/feed/${base}--${post.id}`;
}

export default function FeedPage() {
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [filter, setFilter] = useState<FeedFilter>("all");
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(id);
  }, [toast]);

  useEffect(() => {
    const id = setTimeout(() => setDebouncedQuery(query.trim()), 350);
    return () => clearTimeout(id);
  }, [query]);

  const feedQuery = useInfiniteQuery({
    queryKey: feedQueryKey({ q: debouncedQuery, type: filter }),
    queryFn: ({ pageParam }) =>
      fetchFeedPage({
        limit: 15,
        cursor: typeof pageParam === "string" ? pageParam : null,
        q: debouncedQuery,
        type: filter,
      }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (!first?.isIntersecting) return;
        if (feedQuery.isFetchingNextPage) return;
        if (!feedQuery.hasNextPage) return;
        feedQuery.fetchNextPage();
      },
      { rootMargin: "800px 0px" },
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [feedQuery]);

  useEffect(() => {
    if (!feedQuery.isError) return;
    setToast({ message: apiErr(feedQuery.error, "Failed to load feed"), type: "error" });
  }, [feedQuery.isError, feedQuery.error]);

  const items = useMemo(() => {
    const pages = feedQuery.data?.pages ?? [];
    return pages.flatMap((p) => p.items);
  }, [feedQuery.data?.pages]);

  const visibleItems = useMemo(() => items.filter((p) => Boolean(p?.id)), [items]);

  return (
    <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 xl:px-10 py-8 2xl:py-10 space-y-7 md:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-2xl md:text-3xl 2xl:text-5xl font-semibold tracking-tight">
            Serena <span className="text-red-400">posts</span>
          </h1>
          
        </div>

      </div>

      <div className="flex flex-col xl:flex-row xl:items-center gap-3 2xl:gap-4 ">

        <div className="flex flex-wrap items-center gap-4 2xl:gap-5">
          {(
            [
              ["all", "All"],
              ["image", "Image"],
              ["video", "Video"],
              ["reel", "Reels"],
            ] as const
          ).map(([key, label]) => {
            const active = filter === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                className={[
                  "cursor-pointer h-11 2xl:h-13 px-6 2xl:px-8 rounded-full border text-base 2xl:text-medium font-medium transition",
                  "bg-muted/40 hover:bg-muted",
                  "dark:bg-white/5 dark:hover:bg-white/10",
                  active
                    ? "border-indigo-400 bg-indigo-100 text-primary"
                    : "border-border text-foreground/90",
                ].join(" ")}
              >
                {label}
              </button>
            );
          })}
        </div>
        <div className="relative flex-1">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search posts…"
            className="w-full h-12 2xl:h-14 rounded-full border bg-background px-5 2xl:px-6 pr-12 text-sm 2xl:text-base shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full px-3 py-1 text-xs 2xl:text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition"
            >
              Clear
            </button>
          ) : null}
        </div>


      </div>

      {feedQuery.isPending ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 2xl:gap-7">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl border bg-card overflow-hidden">
              <div className="h-36 xl:h-40 2xl:h-44 bg-muted animate-pulse" />
              <div className="p-4 space-y-3">
                <div className="h-4 w-2/3 bg-muted animate-pulse rounded" />
                <div className="h-3 w-full bg-muted animate-pulse rounded" />
                <div className="h-3 w-5/6 bg-muted animate-pulse rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : visibleItems.length === 0 ? (
        <div className="rounded-2xl border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">No posts yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-6 2xl:gap-7">
          {visibleItems.map((post) => {
            const vis = formatVisibility(post.visibility);
            const typeMeta = formatType(post.type);
            const TypeIcon = typeMeta.Icon;
            const VisIcon = vis.icon;

            const previewUrl = post.thumbnail || post.mediaPreviewUrl || null;
            const previewKind =
              isVideoUrl(previewUrl) || post.type === "video" || post.type === "reel"
                ? "video"
                : "image";

            return (
              <article
                key={post.id}
                className="group rounded-2xl border bg-card overflow-hidden shadow-sm hover:shadow-lg transition-shadow"
              >
                <div className="relative h-36 xl:h-40 2xl:h-44 bg-muted">
                  {previewUrl ? (
                    previewKind === "video" ? (
                      <video
                        className="h-full w-full object-cover"
                        src={previewUrl}
                        muted
                        playsInline
                        preload="metadata"
                        controls={false}
                      />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={previewUrl}
                        alt={post.caption ?? "Post thumbnail"}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    )
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                      {TypeIcon ? <TypeIcon className="h-8 w-8 opacity-60" /> : <span className="text-sm">No media</span>}
                    </div>
                  )}

                  <div className="absolute left-3 top-3 flex items-center gap-2">
                    <Badge className={vis.className}>
                      {VisIcon ? <VisIcon className="h-3.5 w-3.5 mr-1" /> : null}
                      {vis.label}
                    </Badge>
                    <Badge variant="secondary" className="bg-background/70 dark:bg-background/30 backdrop-blur">
                      {TypeIcon ? <TypeIcon className="h-3.5 w-3.5 mr-1 opacity-70" /> : null}
                      {typeMeta.label}
                    </Badge>
                  </div>
                </div>

                <div className="p-4 2xl:p-5 space-y-3">
                  <div className="space-y-1">
                    <h3 className="font-semibold leading-snug line-clamp-2 2xl:text-lg">
                      {post.caption || "Untitled post"}
                    </h3>
                    {post.description ? (
                      <p className="text-sm 2xl:text-[15px] text-muted-foreground line-clamp-3">{post.description}</p>
                    ) : (
                      <p className="text-sm 2xl:text-[15px] text-muted-foreground line-clamp-3">
                        {post.mediaCount > 0
                          ? `${post.mediaCount} media item${post.mediaCount === 1 ? "" : "s"} attached`
                          : "No description provided."}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-xs 2xl:text-sm text-muted-foreground">
                      {post.mediaCount > 0 ? `${post.mediaCount} media` : "No media"}
                    </p>
                    <Button asChild variant="outline" size="sm" className="group-hover:border-primary/60">
                      <Link href={postHref(post)}>View</Link>
                    </Button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <div ref={sentinelRef} className="h-10" />
      {feedQuery.isFetchingNextPage ? (
        <div className="text-center text-sm text-muted-foreground">Loading more…</div>
      ) : null}
      {!feedQuery.isPending && visibleItems.length > 0 && !feedQuery.hasNextPage ? (
        <div className="text-center text-sm text-muted-foreground">You’re all caught up.</div>
      ) : null}

      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
}