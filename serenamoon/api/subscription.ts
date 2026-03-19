import { apiClient } from "./client";

export type Subscription = {
  id: string;
  userId: string;
  planId: string;
  status: "active" | "canceled" | "expired";
  startDate: string | null;
  endDate: string | null;
  isDeleted: boolean;
};

export const mySubscriptionQueryKey = ["subscription", "me"] as const;

export async function createSubscription(planId: string) {
  const res = await apiClient.post<{ subscription: Subscription } | any>("/subscriptions", {
    planId,
  });
  return res.data;
}

export async function fetchMySubscription() {
  const res = await apiClient.get<{ subscription: Subscription | null }>("/subscriptions/me");
  return res.data;
}

