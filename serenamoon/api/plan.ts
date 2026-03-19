import { apiClient } from "./client";

export type Plan = {
  id: string;
  name: string;
  description: string | null;
  priceMonthly: number;
  priceYearly: number;
  allowPremium: boolean | null;
};

export const plansQueryKey = ["plans"] as const;

export async function fetchPlans() {
  const res = await apiClient.get<Plan[]>("/plans");
  return Array.isArray(res.data) ? res.data : [];
}

