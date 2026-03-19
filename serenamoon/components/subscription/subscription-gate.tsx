"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { fetchMySubscription, mySubscriptionQueryKey } from "@/api/subscription";

const AUTH_PATHS = new Set(["/auth/login", "/auth/register"]);
const SUBSCRIPTION_SETUP_PATHS = new Set(["/pricing", "/checkout"]);

function isPublicPath(pathname: string) {
  if (pathname === "/") return true;
  if (pathname === "/pricing") return true;
  if (AUTH_PATHS.has(pathname)) return true;
  return false;
}

export function SubscriptionGate() {
  const router = useRouter();
  const pathname = usePathname() || "/";
  const searchParams = useSearchParams();

  const token = typeof window !== "undefined" ? localStorage.getItem("serena_token") : null;

  const subQuery = useQuery({
    queryKey: mySubscriptionQueryKey,
    queryFn: fetchMySubscription,
    enabled: Boolean(token),
    retry: false,
  });

  useEffect(() => {
    const fullPath = `${pathname}${searchParams?.toString() ? `?${searchParams.toString()}` : ""}`;

    // If user is not logged in:
    // - allow public paths
    // - otherwise push them to login
    if (!token) {
      if (isPublicPath(pathname)) return;
      router.replace(`/auth/login?next=${encodeURIComponent(fullPath)}`);
      return;
    }

    // If logged in and on auth pages, redirect away.
    if (AUTH_PATHS.has(pathname)) {
      router.replace("/pricing");
      return;
    }

    // If we haven't fetched subscription yet, wait.
    if (subQuery.isPending) return;

    const subscription = subQuery.data?.subscription ?? null;

    // Logged in but no subscription: force pricing before accessing anything else.
    if (!subscription && !SUBSCRIPTION_SETUP_PATHS.has(pathname)) {
      localStorage.setItem("pending_next_path", fullPath);
      router.replace("/pricing");
      return;
    }
  }, [pathname, router, searchParams, subQuery.data, subQuery.isPending, token]);

  return null;
}

