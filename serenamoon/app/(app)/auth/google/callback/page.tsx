"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function GoogleCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");
    if (token && typeof window !== "undefined") {
      localStorage.setItem("serena_token", token);
      router.replace("/");
      router.refresh();
    } else {
      router.replace("/auth/login");
    }
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <p className="text-sm text-muted-foreground">
        Completing Google sign-in...
      </p>
    </div>
  );
}

