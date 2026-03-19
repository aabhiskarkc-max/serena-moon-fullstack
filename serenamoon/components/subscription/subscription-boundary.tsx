"use client";

import { ReactNode, useEffect, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { fetchMySubscription, mySubscriptionQueryKey } from "@/api/subscription";

const AUTH_PATHS = new Set(["/auth/login", "/auth/register"]);

function isPublicPath(pathname: string) {
  if (pathname === "/") return true;
  if (pathname === "/pricing") return true;
  if (pathname === "/checkout") return true;
  if (AUTH_PATHS.has(pathname)) return true;
  return false;
}

function FullscreenLoader() {
  return (
    <div className="min-h-[60vh] w-full flex items-center justify-center py-16">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin" />
        <p className="text-xs tracking-widest uppercase text-muted-foreground">
          Checking access…
        </p>
      </div>
    </div>
  );
}

export function SubscriptionBoundary({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname() || "/";
  const searchParams = useSearchParams();

  const token =
    typeof window !== "undefined" ? localStorage.getItem("serena_token") : null;

  const subQuery = useQuery({
    queryKey: mySubscriptionQueryKey,
    queryFn: fetchMySubscription,
    enabled: Boolean(token) && !isPublicPath(pathname),
    retry: false,
  });

  const fullPath = useMemo(() => {
    const qs = searchParams?.toString();
    return `${pathname}${qs ? `?${qs}` : ""}`;
  }, [pathname, searchParams]);

  const shouldBlock =
    (!token && !isPublicPath(pathname)) || (token && !isPublicPath(pathname) && subQuery.isPending);

  useEffect(() => {
    // Not logged in: block protected routes.
    if (!token) {
      if (isPublicPath(pathname)) return;
      router.replace(`/auth/login?next=${encodeURIComponent(fullPath)}`);
      return;
    }

    // Logged in and on auth pages: send away.
    if (AUTH_PATHS.has(pathname)) {
      router.replace("/pricing");
      return;
    }

    // Public paths are always allowed.
    if (isPublicPath(pathname)) return;

    // Wait for subscription fetch.
    if (subQuery.isPending) return;

    const subscription = subQuery.data?.subscription ?? null;
    if (!subscription) {
      // Logged in but unsubscribed: force pricing.
      router.replace("/pricing");
    }
  }, [fullPath, pathname, router, subQuery.data, subQuery.isPending, token]);

  if (shouldBlock) return <FullscreenLoader />;

  // Logged in but no subscription (after fetch) → redirecting; keep loader to prevent flash.
  if (token && !isPublicPath(pathname) && !subQuery.isPending && !(subQuery.data?.subscription ?? null)) {
    return <FullscreenLoader />;
  }

  return <>{children}</>;
}

