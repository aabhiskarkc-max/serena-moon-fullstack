"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Toast } from "@/components/ui/toast";
import Image from "next/image";
import {
  fetchPublicPostDetail,
  publicPostDetailQueryKey,
  type PublicMediaItem,
  type PublicPost,
} from "@/api/post";

function apiErr(e: unknown, fallback: string) {
  if (isAxiosError(e)) {
    const m = (e.response?.data as { message?: string } | undefined)?.message;
    if (m) return m;
  }
  if (e instanceof Error) return e.message;
  return fallback;
}

function extractIdFromSlug(slug: string) {
  const uuidMatch = slug.match(
    /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i,
  );
  if (uuidMatch) return uuidMatch[0];

  const idx = slug.lastIndexOf("--");
  if (idx !== -1) return slug.slice(idx + 2);

  const dashIdx = slug.lastIndexOf("-");
  if (dashIdx === -1) return slug;
  return slug.slice(dashIdx + 1);
}


export default function FeedPostPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const postId = useMemo(() => extractIdFromSlug(slug), [slug]);

  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(id);
  }, [toast]);

  const postQuery = useQuery({
    queryKey: publicPostDetailQueryKey(postId),
    queryFn: () => fetchPublicPostDetail(postId),
    enabled: Boolean(postId),
  });

  useEffect(() => {
    if (!postQuery.isError) return;
    setToast({ message: apiErr(postQuery.error, "Failed to load post"), type: "error" });
  }, [postQuery.isError, postQuery.error]);

  const post: PublicPost | null = postQuery.data?.post ?? null;
  const media: PublicMediaItem[] = postQuery.data?.media ?? [];

  if (postQuery.isPending && !post) {
    return (
      <div className="mx-auto max-w-4xl px-6 md:px-10 py-10">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="mx-auto max-w-4xl px-6 md:px-10 py-10 space-y-4">
        <p className="text-sm text-destructive">Post not found.</p>
        <Button asChild variant="outline">
          <Link href="/feed">Back to feed</Link>
        </Button>
        {toast && <Toast message={toast.message} type={toast.type} />}
      </div>
    );
  }



  return (
    <div>
   <header className="relative w-full aspect-video md:aspect-[21/9] lg:aspect-[3/1] overflow-hidden rounded-sm bg-muted">
  {post.thumbnail ? (
    <Image
      src={post.thumbnail}
      alt={post.caption ?? "Post thumbnail"}
      fill
      priority
      sizes="100vw"
      className="object-cover"
    />
  ) : (
    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
      No thumbnail
    </div>
  )}

  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

  <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-12 2xl:p-16">
    <div className="max-w-4xl space-y-2 md:space-y-4 text-white">
      <h1 className="text-2xl md:text-5xl 2xl:text-6xl font-bold tracking-tight">
        {post.caption || "Untitled post"}
      </h1>

      {post.description && (
        <p className="hidden md:block text-base md:text-lg 2xl:text-xl text-white/90 leading-relaxed max-w-2xl line-clamp-2">
          {post.description}
        </p>
      )}
    </div>
  </div>
</header>

      <div className="mx-auto w-full max-w-[1800px] px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 py-10 2xl:py-14 space-y-8 2xl:space-y-10">

        <section className="space-y-6 2xl:space-y-8 relative">
          <div className="h-px w-full bg-border/70" />
          {media.length === 0 ? (
            <div className="rounded-2xl border bg-card p-8 text-center text-sm text-muted-foreground">
              Nothing to show yet.
            </div>
          ) : (
            <div className="space-y-10 2xl:space-y-14">
              {media.map((m, idx) => {
                const isVideo = /\.(mp4|webm|mov|m4v|ogg)(\?|#|$)/i.test(m.url);
                const flipped = idx % 2 === 1;

                const textBlock = (
                  <div
                    className={[
                      "space-y-3",
                      flipped ? "lg:pl-6 2xl:pl-10" : "lg:pr-6 2xl:pr-10",
                    ].join(" ")}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] tracking-widest uppercase text-muted-foreground">
                        Media {String(idx + 1).padStart(2, "0")}
                      </span>
                      <span className="h-3 w-px bg-border" />
                      <Badge variant="secondary" className="bg-muted/50">
                        {isVideo ? "Video" : "Image"}
                      </Badge>
                    </div>

                    <h3 className="text-2xl 2xl:text-3xl font-semibold tracking-tight leading-tight">
                      {m.title || "Untitled media"}
                    </h3>
                    {m.description ? (
                      <p className="text-sm 2xl:text-base text-muted-foreground leading-relaxed max-w-prose">
                        {m.description}
                      </p>
                    ) : (
                      <p className="text-sm 2xl:text-base text-muted-foreground leading-relaxed">
                      </p>
                    )}
                  </div>
                );

                const mediaBlock = (
                  <div className="overflow-hidden rounded-3xl">
                    <div className="bg-muted/40">
                      {isVideo ? (
                        <video
                          className="w-full h-[260px] sm:h-[340px] lg:h-[360px] 2xl:h-[440px] object-cover"
                          src={m.url}
                          controls
                          playsInline
                        />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          className="w-full h-[260px] sm:h-[340px] lg:h-[360px] 2xl:h-[440px] object-cover"
                          src={m.url}
                          alt={m.title ?? "Media"}
                          loading="lazy"
                        />
                      )}
                    </div>
                  </div>
                );

                return (
                  <div key={m.id} className="space-y-8 2xl:space-y-10">
                    {idx > 0 ? <div className="-mt-2 h-px w-full bg-border/70" /> : null}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 2xl:gap-10 items-start">
                      <div
                        className={[
                          flipped ? "lg:col-start-8" : "lg:col-start-1",
                          "lg:col-span-5 lg:row-start-1 self-start",
                        ].join(" ")}
                      >
                        {textBlock}
                      </div>
                      <div
                        className={[
                          flipped ? "lg:col-start-1" : "lg:col-start-6",
                          "lg:col-span-7 lg:row-start-1 self-start",
                        ].join(" ")}
                      >
                        {mediaBlock}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {toast && <Toast message={toast.message} type={toast.type} />}
      </div>
    </div>

  );
}

