"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createSubscription } from "@/api/subscription";
import { useQuery } from "@tanstack/react-query";
import { fetchPlans, plansQueryKey, type Plan } from "@/api/plan";
import { fetchMySubscription, mySubscriptionQueryKey } from "@/api/subscription";

type BillingInterval = "monthly" | "yearly";

export default function CheckoutPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [cardNumber, setCardNumber] = useState("");
  const [exp, setExp] = useState("");
  const [cvc, setCvc] = useState("");

  const token =
    typeof window !== "undefined" ? localStorage.getItem("serena_token") : null;
  const [pendingPlanId, setPendingPlanId] = useState<string | null>(
    typeof window !== "undefined" ? localStorage.getItem("pending_plan_id") : null,
  );
  const billingInterval = (typeof window !== "undefined"
    ? (localStorage.getItem("pending_billing_interval") as BillingInterval | null)
    : null) ?? "monthly";

  useEffect(() => {
    if (!token) {
      router.replace(`/auth/login?next=${encodeURIComponent("/checkout")}`);
      return;
    }
    if (!pendingPlanId) {
      router.replace("/pricing");
      return;
    }
  }, [pendingPlanId, router, token]);

  const plansQuery = useQuery({
    queryKey: plansQueryKey,
    queryFn: fetchPlans,
  });

  const plans = plansQuery.data ?? [];

  const subQuery = useQuery({
    queryKey: mySubscriptionQueryKey,
    queryFn: fetchMySubscription,
    enabled: Boolean(token),
    retry: false,
  });

  const hasSubscription = Boolean(subQuery.data?.subscription);

  const plan = useMemo(
    () => plans.find((p) => p.id === pendingPlanId) ?? null,
    [plans, pendingPlanId],
  );

  const amount = useMemo(() => {
    if (!plan) return null;
    return billingInterval === "monthly" ? plan.priceMonthly : plan.priceYearly;
  }, [billingInterval, plan]);

  const payMutation = useMutation({
    mutationFn: async () => {
      // Demo payment simulation
      await new Promise((r) => setTimeout(r, 900));
      if (!pendingPlanId) throw new Error("No plan selected");
      return createSubscription(pendingPlanId);
    },
    onSuccess: async () => {
      localStorage.removeItem("pending_plan_id");
      localStorage.removeItem("pending_billing_interval");
      localStorage.removeItem("pending_next_path");
      await queryClient.invalidateQueries({ queryKey: mySubscriptionQueryKey });
      toast.success("Payment successful. Subscription activated.");
      router.push("/");
    },
    onError: (e: any) => {
      toast.error(e?.message ?? "Payment failed");
    },
  });

  const canPay =
    cardNumber.replace(/\s+/g, "").length >= 12 && exp.trim().length >= 4 && cvc.trim().length >= 3;

  return (
    <div className="px-6 md:px-12 py-16 md:py-20 flex justify-center">
      <div className="w-full max-w-3xl rounded-3xl border border-border bg-card p-8 md:p-10 space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl serif italic text-slate-900 dark:text-slate-100">
            Demo checkout
          </h1>
          <p className="text-sm text-muted-foreground">
            This is a virtual payment page for testing the subscription flow.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-background/40 p-5 space-y-1">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Order</p>
          <p className="text-lg font-semibold text-foreground">
            {plan ? plan.name : "Selected plan"}
          </p>
          <p className="text-sm text-muted-foreground">
            {amount != null
              ? `${amount.toLocaleString(undefined, {
                  style: "currency",
                  currency: "USD",
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })} / ${billingInterval === "monthly" ? "month" : "year"}`
              : "Loading price…"}
          </p>
        </div>

        <div className="grid gap-2">
          <label className="text-xs uppercase tracking-widest text-muted-foreground">
            Change plan
          </label>
          <select
            value={pendingPlanId ?? ""}
            onChange={(e) => {
              const id = e.target.value || null;
              setPendingPlanId(id);
              if (id) localStorage.setItem("pending_plan_id", id);
            }}
            className="h-11 w-full appearance-none rounded-xl border border-input bg-background px-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40"
          >
            <option value="" disabled>
              Select a plan
            </option>
            {plans.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">
            You can change the plan here without going back.
          </p>
        </div>

        <div className="grid gap-4">
          <div className="grid gap-1.5">
            <label className="text-xs uppercase tracking-widest text-muted-foreground">
              Card number
            </label>
            <input
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value)}
              placeholder="4242 4242 4242 4242"
              className="h-11 rounded-xl border border-input bg-background px-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <label className="text-xs uppercase tracking-widest text-muted-foreground">
                Exp
              </label>
              <input
                value={exp}
                onChange={(e) => setExp(e.target.value)}
                placeholder="MM/YY"
                className="h-11 rounded-xl border border-input bg-background px-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40"
              />
            </div>
            <div className="grid gap-1.5">
              <label className="text-xs uppercase tracking-widest text-muted-foreground">
                CVC
              </label>
              <input
                value={cvc}
                onChange={(e) => setCvc(e.target.value)}
                placeholder="123"
                className="h-11 rounded-xl border border-input bg-background px-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-end">
          <button
            type="button"
            onClick={() => router.push(hasSubscription ? "/profile/plan" : "/pricing")}
            className="h-11 px-6 rounded-full border border-slate-300/70 bg-background/60 text-sm font-medium tracking-wide text-slate-700 transition-colors hover:bg-background/90 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
          >
            Back
          </button>
          <button
            type="button"
            disabled={!canPay || payMutation.isPending}
            onClick={() => payMutation.mutate()}
            className={[
              "h-11 px-8 rounded-full border text-sm font-semibold tracking-wide transition-colors",
              "border-indigo-500/40 hover:border-indigo-500/70 bg-indigo-500/10 hover:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300",
              (!canPay || payMutation.isPending) ? "opacity-70 cursor-not-allowed" : "",
            ].join(" ")}
          >
            {payMutation.isPending ? "Processing payment…" : "Pay & activate"}
          </button>
        </div>
      </div>
    </div>
  );
}

