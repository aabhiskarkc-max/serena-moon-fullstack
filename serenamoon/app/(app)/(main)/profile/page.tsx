"use client";

import { useQuery } from "@tanstack/react-query";
import { getProfile, profileQueryKey } from "@/api/user";

export default function ProfileOverviewPage() {
  const profileQuery = useQuery({
    queryKey: profileQueryKey,
    queryFn: getProfile,
  });

  if (profileQuery.isPending) {
    return (
      <div className="rounded-2xl border bg-card p-8">
        <p className="text-sm text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  if (profileQuery.isError || !profileQuery.data) {
    return (
      <div className="rounded-2xl border bg-card p-8">
        <p className="text-sm text-destructive">Failed to load profile information.</p>
      </div>
    );
  }

  const profile = profileQuery.data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
        <p className="text-sm text-muted-foreground">
          Your account information and current profile details.
        </p>
      </div>

      <div className="rounded-2xl border bg-card p-6 md:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
          {profile.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.avatar}
              alt={profile.username ?? profile.email}
              className="h-20 w-20 rounded-full object-cover border border-border"
            />
          ) : (
            <div className="h-20 w-20 rounded-full border border-border bg-muted flex items-center justify-center text-xl font-semibold">
              {(profile.username ?? profile.email).slice(0, 2).toUpperCase()}
            </div>
          )}

          <div className="min-w-0">
            <h2 className="text-lg font-semibold truncate">
              {profile.username || "User"}
            </h2>
            <p className="text-sm text-muted-foreground truncate">{profile.email}</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-border p-4 bg-background/40">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Username</p>
            <p className="mt-1 text-sm font-medium">{profile.username || "Not set"}</p>
          </div>

          <div className="rounded-xl border border-border p-4 bg-background/40">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Email</p>
            <p className="mt-1 text-sm font-medium break-all">{profile.email}</p>
          </div>

          <div className="rounded-xl border border-border p-4 bg-background/40">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Joined</p>
            <p className="mt-1 text-sm font-medium">
              {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : "—"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}