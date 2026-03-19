"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { fetchMySubscription, mySubscriptionQueryKey } from "@/api/subscription";
import { fetchPlans, plansQueryKey } from "@/api/plan";

type BillingInterval = "monthly" | "yearly";

export default function ProfilePlanPage() {
  const router = useRouter();
  const [billingInterval, setBillingInterval] = useState<BillingInterval>("monthly");
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  const { data: plans = [] } = useQuery({
    queryKey: plansQueryKey,
    queryFn: fetchPlans,
  });

  useEffect(() => {
    const pending = localStorage.getItem("pending_plan_id");
    if (pending) return setSelectedPlanId(pending);
    if (!selectedPlanId && plans.length) {
      setSelectedPlanId(plans[1]?.id ?? plans[0]?.id ?? null);
    }
  }, [plans, selectedPlanId]);

  const selectedPlan = useMemo(
    () => plans.find((p) => p.id === selectedPlanId) ?? null,
    [plans, selectedPlanId]
  );

  const token = localStorage.getItem("serena_token");

  const { data } = useQuery({
    queryKey: mySubscriptionQueryKey,
    queryFn: fetchMySubscription,
    enabled: !!token,
  });

  const currentPlan = useMemo(() => {
    if (!data?.subscription) return null;
    return plans.find((p) => p.id === data.subscription.planId) ?? null;
  }, [data, plans]);

  const onProceedToPayment = () => {
    if (!token) {
      router.replace(`/auth/login?next=/profile/plan`);
      return;
    }
    if (!selectedPlanId) return toast.error("Select a plan first");

    localStorage.setItem("pending_plan_id", selectedPlanId);
    localStorage.setItem("pending_billing_interval", billingInterval);

    router.push("/checkout");
  };

  return (
    <div className="min-h-screen bg-background px-4 py-12 md:px-6 md:py-16">
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-10 space-y-4 text-center">
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Choose the plan that fits
          </h1>
          <p className="mx-auto max-w-2xl text-sm text-muted-foreground md:text-base">
            Upgrade your access with a simple pricing structure inspired by Cursor.
          </p>
          {currentPlan ? (
            <p className="text-sm text-muted-foreground">
              Current plan: <span className="font-medium text-foreground">{currentPlan.name}</span>
            </p>
          ) : null}
        </div>

        <div className="mb-8 flex items-center justify-center">
          <div className="inline-flex items-center rounded-lg border border-border bg-muted/30 p-1">
            <button
              type="button"
              onClick={() => setBillingInterval("monthly")}
              className={`rounded-md px-4 py-2 text-sm font-medium transition ${
                billingInterval === "monthly"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setBillingInterval("yearly")}
              className={`rounded-md px-4 py-2 text-sm font-medium transition ${
                billingInterval === "yearly"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Yearly
              <span className="ml-2 rounded bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-600">
                Save
              </span>
            </button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {plans.map((plan, idx) => {
            const price = billingInterval === "monthly" ? plan.priceMonthly : plan.priceYearly;
            const isSelected = selectedPlanId === plan.id;
            const isCurrent = currentPlan?.id === plan.id;
            const isRecommended = plans.length > 2 && idx === 1;

            return (
              <div
                key={plan.id}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedPlanId(plan.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") setSelectedPlanId(plan.id);
                }}
                className={`relative rounded-2xl border bg-card p-6 text-left transition-all ${
                  isSelected
                    ? "border-indigo-500 shadow-[0_0_0_1px_rgba(99,102,241,0.4)]"
                    : "border-border hover:border-foreground/20"
                }`}
              >
                <div className="mb-4 flex min-h-6 items-center gap-2">
                  {isCurrent ? (
                    <span className="rounded-full border border-indigo-500/30 bg-indigo-500/10 px-2 py-0.5 text-[11px] font-medium text-indigo-600">
                      Current plan
                    </span>
                  ) : null}
                  {!isCurrent && isRecommended ? (
                    <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-600">
                      Recommended
                    </span>
                  ) : null}
                </div>

                <h3 className="text-lg font-medium">{plan.name}</h3>
                <p className="mt-3 text-3xl font-semibold tracking-tight">
                  ${price}
                  <span className="ml-1 text-sm font-normal text-muted-foreground">
                    /{billingInterval === "monthly" ? "month" : "year"}
                  </span>
                </p>

                <p className="mt-5 min-h-[40px] text-sm text-muted-foreground">
                  {plan.description || "Standard access"}
                </p>

                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onProceedToPayment();
                  }}
                  className={`mt-6 h-10 w-full rounded-lg text-sm font-medium transition ${
                    isSelected
                      ? "bg-indigo-600 text-white hover:bg-indigo-500"
                      : "border border-border bg-background hover:bg-muted"
                  }`}
                >
                  {isSelected ? "Continue" : "Select plan"}
                </button>
              </div>
            );
          })}
        </div>

        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={() => router.push("/pricing")}
            className="text-sm text-muted-foreground hover:text-foreground hover:underline"
          >
            View full pricing details
          </button>
          <button
            disabled={!selectedPlan}
            onClick={onProceedToPayment}
            className="h-10 rounded-lg bg-indigo-600 px-6 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {selectedPlan ? `Continue with ${selectedPlan.name}` : "Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}