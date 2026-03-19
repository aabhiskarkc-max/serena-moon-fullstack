"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { fetchPlans, plansQueryKey, type Plan } from "@/api/plan";
import { fetchMySubscription, mySubscriptionQueryKey } from "@/api/subscription";

type BillingInterval = "monthly" | "yearly";

export default function PricingPage() {
  const router = useRouter();
  const [billingInterval, setBillingInterval] = useState<BillingInterval>("monthly");
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const token =
    typeof window !== "undefined" ? localStorage.getItem("serena_token") : null;

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

  useEffect(() => {
    const pending = typeof window !== "undefined" ? localStorage.getItem("pending_plan_id") : null;
    if (pending) {
      setSelectedPlanId(pending);
      return;
    }
    if (selectedPlanId) return;
    if (plans.length === 0) return;
    setSelectedPlanId((plans[1] ?? plans[0])?.id ?? null);
  }, [plans, selectedPlanId]);

  const onSubscribe = (planId: string) => {
    if (!token) {
      localStorage.setItem("pending_plan_id", planId);
      localStorage.setItem("pending_billing_interval", billingInterval);
      router.push(`/auth/register?next=${encodeURIComponent("/checkout")}`);
      return;
    }
    localStorage.setItem("pending_plan_id", planId);
    localStorage.setItem("pending_billing_interval", billingInterval);
    const hasSubscription = Boolean(subQuery.data?.subscription);
    router.push(hasSubscription ? "/profile/plan" : "/checkout");
  };

  return (
    <div className="px-6 md:px-12 py-16 md:py-24 flex flex-col items-center justify-center text-center">
      <section
        id="pricing"
        className="w-full text-center relative bg-transparent dark:bg-transparent"
      >
        <div className="px-10 w-full">
          <h2 className="text-6xl md:text-8xl serif italic text-slate-900 dark:text-slate-100 mb-16 leading-none">
            Become the Patron.
          </h2>
          <p className="text-slate-600 dark:text-slate-400 fine-serif text-xl italic mb-12 leading-loose">
            Directly support the creation of art. Gain access to the full digital vault, high-resolution visual essays, and behind-the-scenes poetry.
          </p>

          <div className="flex items-center justify-center gap-3 mb-16">
            <span
              className={`text-sm font-medium transition-colors ${
                billingInterval === "monthly"
                  ? "text-slate-900 dark:text-slate-100"
                  : "text-slate-500 dark:text-slate-400"
              }`}
            >
              Monthly
            </span>

            <button
              type="button"
              role="switch"
              aria-checked={billingInterval === "yearly"}
              onClick={() =>
                setBillingInterval((prev) => (prev === "monthly" ? "yearly" : "monthly"))
              }
              className={[
                "relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border transition-all duration-300",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2",
                billingInterval === "yearly"
                  ? "border-indigo-500 bg-indigo-500/20"
                  : "border-slate-300 dark:border-slate-600 bg-slate-200 dark:bg-slate-700",
              ].join(" ")}
            >
              <span
                className={[
                  "pointer-events-none inline-block h-5 w-5 transform rounded-full shadow transition duration-300",
                  billingInterval === "yearly"
                    ? "translate-x-6 bg-indigo-500"
                    : "translate-x-1 bg-white dark:bg-slate-100",
                ].join(" ")}
              />
            </button>

            <span
              className={`text-sm font-medium transition-colors ${
                billingInterval === "yearly"
                  ? "text-indigo-600 dark:text-indigo-400"
                  : "text-slate-500 dark:text-slate-400"
              }`}
            >
              Yearly
            </span>

            {billingInterval === "yearly" && (
              <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-600 dark:text-green-400">
                Save more
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-8 w-full">
            {plansQuery.isPending ? (
              <div className="rounded-2xl border bg-card p-8 text-center sm:col-span-3 lg:col-span-4">
                <p className="text-sm text-muted-foreground">Loading plans…</p>
              </div>
            ) : plans.length > 0 ? (
              plans.map((plan) => {
                const price =
                  billingInterval === "monthly" ? plan.priceMonthly : plan.priceYearly;
                const isSelected = selectedPlanId === plan.id;
                return (
                  <div
                    key={plan.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedPlanId(plan.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") setSelectedPlanId(plan.id);
                    }}
                    aria-pressed={isSelected}
                    className={[
                      "p-8 py-14 rounded-3xl border transition-all duration-300 transform group cursor-pointer outline-none",
                      "focus-visible:ring-2 focus-visible:ring-primary/70 focus-visible:ring-offset-2",
                      "border-slate-200/70 dark:border-white/5 bg-white/70 dark:bg-transparent",
                      "hover:!border-purple-800 hover:scale-105 hover:z-10 hover:shadow-xl",
                      isSelected
                        ? [
                            "!border-indigo-500 ring-2 ring-indigo-200/70 dark:ring-indigo-500/20",
                            "bg-indigo-50/70 dark:bg-indigo-500/10",
                            "z-10 scale-105",
                          ].join(" ")
                        : "",
                    ].join(" ")}
                  >
                    <p className="text-[20px] tracking-widest uppercase mb-6 text-pink-600 group-hover:text-pink-500">
                      {plan.name}
                    </p>
                    <p className="text-4xl serif italic text-slate-900 dark:text-slate-100 mb-1">
                      {price.toLocaleString(undefined, {
                        style: "currency",
                        currency: "USD",
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      })}
                    </p>
                    <p className="text-[10px] tracking-widest uppercase text-slate-500 dark:text-slate-400 mb-6">
                      per {billingInterval === "monthly" ? "month" : "year"}
                    </p>
                    <div className="w-12 h-px mx-auto my-6 bg-gradient-to-r from-primary/60 via-primary/20 to-transparent" />
                    {plan.description ? (
                      <p className="text-md text-slate-600 dark:text-slate-400 line-clamp-2">
                        {plan.description}
                      </p>
                    ) : (
                      <p className="text-[10px] tracking-widest uppercase text-slate-500 dark:text-slate-400">
                        {plan.allowPremium ? "Premium content included" : "Standard access"}
                      </p>
                    )}

                    <div className="mt-8 flex justify-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPlanId(plan.id);
                          onSubscribe(plan.id);
                        }}
                        className={[
                          "cursor-pointer h-11 w-full rounded-full border text-sm font-medium tracking-wide transition-colors",
                          "bg-background/60 hover:bg-background/90 dark:bg-white/5 dark:hover:bg-white/10",
                          "border-slate-300/70 dark:border-white/10",
                          "group-hover:border-indigo-400/70",
                          isSelected
                            ? "!border-indigo-500 text-indigo-700 dark:text-indigo-300"
                            : "text-slate-700 dark:text-slate-200",
                        ].join(" ")}
                      >
                        {`Get ${plan.name}`}
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="rounded-2xl border bg-card p-8 text-center">
                <p className="text-sm text-muted-foreground">No plans available.</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

