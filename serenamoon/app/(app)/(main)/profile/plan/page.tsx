"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { Check } from "lucide-react";
import { fetchMySubscription, mySubscriptionQueryKey } from "@/api/subscription";
import { fetchPlans, plansQueryKey, type Plan } from "@/api/plan";

type BillingInterval = "monthly" | "yearly";

function planDescriptionLines(description: string | null, maxLines: number): string[] {
  if (!description?.trim()) return [];
  const sentences = description
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const lines = sentences.length ? sentences : [description.trim()];
  return lines.slice(0, maxLines);
}

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
    const sub = data?.subscription;
    if (!sub) return null;
    return plans.find((p) => p.id === sub.planId) ?? null;
  }, [data, plans]);

  const goToCheckoutForPlan = (planId: string) => {
    if (!token) {
      router.replace(`/auth/login?next=${encodeURIComponent("/profile/plan")}`);
      return;
    }
    if (currentPlan?.id === planId) {
      toast.message("You're already on this plan.");
      return;
    }

    setSelectedPlanId(planId);
    localStorage.setItem("pending_plan_id", planId);
    localStorage.setItem("pending_billing_interval", billingInterval);
    localStorage.setItem("pending_next_path", "/profile/plan");

    router.push("/checkout");
  };

  const goToCheckoutForSelection = () => {
    if (!selectedPlanId) return toast.error("Select a plan first");
    goToCheckoutForPlan(selectedPlanId);
  };

  return (
    <div className="w-full pb-16">
      <div className="border-b border-border/70 pb-12">
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Plans
        </p>
        <div className="mt-4 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl space-y-3">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl lg:text-[2.75rem] lg:leading-[1.1]">
              Choose a plan
            </h1>
            <p className="text-[15px] leading-relaxed text-muted-foreground">
              Pick a billing interval, then use <span className="font-medium text-foreground">Select</span> on a tier
              to open the virtual checkout. Completing payment replaces your current subscription with the new plan.
            </p>
            {currentPlan ? (
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground">
                <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden />
                Current:{" "}
                <span className="font-medium text-foreground">{currentPlan.name}</span>
              </div>
            ) : null}
          </div>

          <div
            className="shrink-0 rounded-full border border-border bg-muted/50 p-1 shadow-inner"
            role="group"
            aria-label="Billing interval"
          >
            <div className="flex rounded-full">
              <button
                type="button"
                onClick={() => setBillingInterval("monthly")}
                className={`rounded-full px-5 py-2 text-sm font-medium transition-colors ${
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
                className={`rounded-full px-5 py-2 text-sm font-medium transition-colors ${
                  billingInterval === "yearly"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Yearly
                <span className="ml-2 text-[10px] font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                  Save
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3 xl:gap-6">
        {plans.map((plan, idx) => {
          const price = billingInterval === "monthly" ? plan.priceMonthly : plan.priceYearly;
          const isSelected = selectedPlanId === plan.id;
          const isCurrent = currentPlan?.id === plan.id;
          const isPopular = plans.length > 2 && idx === 1;
          const lines = planDescriptionLines(plan.description, 5);

          return (
            <PlanTierCard
              key={plan.id}
              plan={plan}
              price={price}
              billingInterval={billingInterval}
              lines={lines}
              isSelected={isSelected}
              isCurrent={isCurrent}
              isPopular={isPopular}
              onSelect={() => setSelectedPlanId(plan.id)}
              onCheckoutPlan={goToCheckoutForPlan}
            />
          );
        })}
      </div>

      <div className="mt-12 flex flex-col items-center gap-4 border-t border-border/60 pt-10 text-center">
        <p className="max-w-md text-sm text-muted-foreground">
          {selectedPlan ? (
            <>
              <span className="font-medium text-foreground">{selectedPlan.name}</span>
              {" · "}
              {billingInterval === "monthly" ? "Billed monthly" : "Billed yearly"}
            </>
          ) : (
            "Select a plan to continue."
          )}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/pricing")}
            className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            Full pricing details
          </button>
          <button
            type="button"
            disabled={!selectedPlan}
            onClick={goToCheckoutForSelection}
            className="h-10 rounded-full bg-foreground px-8 text-sm font-medium text-background transition hover:opacity-90 disabled:pointer-events-none disabled:opacity-40"
          >
            Continue to checkout
          </button>
        </div>
      </div>
    </div>
  );
}

type PlanTierCardProps = {
  plan: Plan;
  price: number;
  billingInterval: BillingInterval;
  lines: string[];
  isSelected: boolean;
  isCurrent: boolean;
  isPopular: boolean;
  onSelect: () => void;
  onCheckoutPlan: (planId: string) => void;
};

function PlanTierCard({
  plan,
  price,
  billingInterval,
  lines,
  isSelected,
  isCurrent,
  isPopular,
  onSelect,
  onCheckoutPlan,
}: PlanTierCardProps) {
  const period = billingInterval === "monthly" ? "month" : "year";

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect();
        }
      }}
      className={`relative flex min-h-[420px] flex-col rounded-2xl border bg-card p-7 text-left transition-[border-color,box-shadow,background-color] duration-200 md:min-h-[440px] ${
        isSelected
          ? "border-foreground/25 bg-muted/20 shadow-[0_0_0_1px_hsl(var(--foreground)/0.12)]"
          : "border-border hover:border-foreground/15 hover:bg-muted/10"
      } ${isPopular && !isCurrent ? "xl:ring-1 xl:ring-foreground/10" : ""}`}
    >
      <div className="mb-6 flex min-h-[28px] flex-wrap items-center gap-2">
        {isPopular ? (
          <span className="rounded-full border border-foreground/15 bg-foreground/[0.06] px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wide text-foreground">
            Popular
          </span>
        ) : null}
        {isCurrent ? (
          <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
            Current plan
          </span>
        ) : null}
      </div>

      <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {plan.name}
      </h2>

      <div className="mt-4 flex items-baseline gap-1.5">
        <span className="font-mono text-4xl font-medium tracking-tight text-foreground tabular-nums md:text-[2.5rem]">
          ${price}
        </span>
        <span className="text-sm text-muted-foreground">/ {period}</span>
      </div>

      <ul className="mt-8 flex flex-1 flex-col gap-3 text-[13px] leading-snug text-muted-foreground">
        {lines.map((line) => (
          <li key={line} className="flex gap-2.5">
            <Check
              className="mt-0.5 size-4 shrink-0 text-foreground/70"
              strokeWidth={2}
              aria-hidden
            />
            <span>{line}</span>
          </li>
        ))}
        {plan.allowPremium ? (
          <li className="flex gap-2.5">
            <Check
              className="mt-0.5 size-4 shrink-0 text-foreground/70"
              strokeWidth={2}
              aria-hidden
            />
            <span>Premium access included</span>
          </li>
        ) : null}
      </ul>

      <div className="mt-8 space-y-2">
        {isCurrent ? (
          <button
            type="button"
            disabled
            onClick={(event) => event.stopPropagation()}
            className="h-11 w-full cursor-not-allowed rounded-full border border-border bg-muted/30 text-sm font-medium text-muted-foreground"
          >
            Current plan
          </button>
        ) : (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onCheckoutPlan(plan.id);
            }}
            className={`h-11 w-full rounded-full text-sm font-medium transition ${
              isSelected
                ? "bg-foreground text-background hover:opacity-90"
                : "border border-border bg-transparent text-foreground hover:bg-muted/60"
            }`}
          >
            {isSelected ? "Continue to pay" : "Select"}
          </button>
        )}
      </div>
    </article>
  );
}
