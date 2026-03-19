'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { login, register } from '@/api/auth';
import { useMutation, useQuery } from '@tanstack/react-query';
import { fetchPlans, plansQueryKey, type Plan } from '@/api/plan';

type BillingInterval = "monthly" | "yearly";

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/pricing";
  const showPlanPicker = next === "/checkout";

  const [billingInterval, setBillingInterval] = useState<BillingInterval>(() => {
    if (typeof window === "undefined") return "monthly";
    return (localStorage.getItem("pending_billing_interval") as BillingInterval | null) ?? "monthly";
  });

  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("pending_plan_id");
  });

  const plansQuery = useQuery({
    queryKey: plansQueryKey,
    queryFn: fetchPlans,
    enabled: showPlanPicker,
  });

  const plans = plansQuery.data ?? [];

  useEffect(() => {
    if (!showPlanPicker) return;
    if (selectedPlanId) return;
    if (plans.length === 0) return;
    setSelectedPlanId((plans[1] ?? plans[0])?.id ?? null);
  }, [plans, selectedPlanId, showPlanPicker]);

  useEffect(() => {
    if (!showPlanPicker) return;
    if (!selectedPlanId) return;
    localStorage.setItem("pending_plan_id", selectedPlanId);
  }, [selectedPlanId, showPlanPicker]);

  useEffect(() => {
    if (!showPlanPicker) return;
    localStorage.setItem("pending_billing_interval", billingInterval);
  }, [billingInterval, showPlanPicker]);

  const selectedPlan = useMemo(
    () => plans.find((p) => p.id === selectedPlanId) ?? null,
    [plans, selectedPlanId],
  );

const mutation = useMutation({
    mutationFn: register,
    onSuccess: async () => {
      try {
        // Auto-login after successful registration so user can immediately pick a plan.
        const data = await login({ email, password });
        if (data?.access_token) {
          localStorage.setItem("serena_token", data.access_token);
        }
        toast.success("Registered successfully");
        router.replace(next);
      } catch (e: any) {
        // Fallback to login page if auto-login fails for any reason.
        toast.success("Registered successfully");
        router.replace(`/auth/login?next=${encodeURIComponent(next)}`);
      }
    },
    onError: (error) => {
      toast.error(error.message)
    }})

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({
      email,
      password,
      username
    })
  };

  const RegisterForm = (
    <div className="bg-white/80 dark:bg-[#050b14]/40 backdrop-blur-3xl border border-slate-200 dark:border-white/5 p-12 pt-5 shadow-2xl rounded-sm">
      <form onSubmit={handleRegister} className="space-y-8">
        <div className="space-y-2">
          <label className="text-[9px] tracking-widest uppercase text-slate-500 ml-1">Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-4 text-slate-900 dark:text-slate-200 focus:outline-none focus:border-blue-400 dark:focus:border-white/30 text-sm font-light transition-all"
            placeholder="Ex. Moongazer_01"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[9px] tracking-widest uppercase text-slate-500 ml-1">Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-4 text-slate-900 dark:text-slate-200 focus:outline-none focus:border-blue-400 dark:focus:border-white/30 text-sm font-light transition-all"
            placeholder="name@ocean.com"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[9px] tracking-widest uppercase text-slate-500 ml-1">Secret Key</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-4 text-slate-900 dark:text-slate-200 focus:outline-none focus:border-blue-400 dark:focus:border-white/30 text-sm font-light transition-all"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={mutation.isPending}
          className="cursor-pointer w-full bg-slate-900 dark:bg-white text-white dark:text-black py-5 uppercase text-[10px] font-bold tracking-[0.5em] mt-4 disabled:opacity-50 transition-all hover:tracking-[0.6em] active:scale-[0.98]"
        >
          {mutation.isPending ? 'Processing...' : 'Complete Registration'}
        </button>
      </form>
    </div>
  );

  return (
    <div className="min-h-screen pt-12 pb-20 px-6 flex items-center justify-center relative overflow-hidden bg-white dark:bg-[#020617] transition-colors duration-500">
      {/* Dynamic Background Gradient */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-100/50 dark:bg-slate-800/10 rounded-full blur-[120px]"></div>
      </div>

      <div className={`relative z-10 w-full ${showPlanPicker ? "max-w-6xl" : "max-w-lg"}`}>
        <div className={showPlanPicker ? "grid grid-cols-1 lg:grid-cols-2 gap-10 items-start" : ""}>
          <div>
            <div className="text-center mb-16">
              <span className="text-[10px] tracking-widest uppercase text-slate-400 dark:text-slate-500 block mb-6">
                Create Account
              </span>
              <h2 className="text-6xl font-serif italic text-slate-900 dark:text-slate-100">
                Join the Tide
              </h2>
            </div>
            {RegisterForm}

            <div className="mt-12 text-center">
              <p className="text-[10px] tracking-widest uppercase text-slate-400">
                Already have an identity?{" "}
                <Link
                  href={`/auth/login?next=${encodeURIComponent(next)}`}
                  className="cursor-pointer text-blue-600 dark:text-cyan-400 hover:text-blue-400 dark:hover:text-white font-bold transition-colors ml-1"
                >
                  Enter here
                </Link>
              </p>
            </div>
          </div>

          {showPlanPicker ? (
            <div className="rounded-sm border border-slate-200 dark:border-white/5 bg-white/70 dark:bg-[#050b14]/30 backdrop-blur-3xl p-8 md:p-10 shadow-2xl">
              <div className="flex items-start justify-between gap-6 mb-8">
                <div className="text-left">
                  <p className="text-[10px] tracking-widest uppercase text-slate-500 dark:text-slate-400">
                    Selected plan
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">
                    {selectedPlan ? selectedPlan.name : "Choose a plan"}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    You can change this anytime before payment.
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
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
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2",
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
                </div>
              </div>

              {plansQuery.isPending ? (
                <div className="rounded-xl border border-border bg-background/40 p-6 text-center">
                  <p className="text-sm text-muted-foreground">Loading plans…</p>
                </div>
              ) : plans.length === 0 ? (
                <div className="rounded-xl border border-border bg-background/40 p-6 text-center">
                  <p className="text-sm text-muted-foreground">No plans available.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {plans.map((plan: Plan) => {
                    const isSelected = selectedPlanId === plan.id;
                    const price = billingInterval === "monthly" ? plan.priceMonthly : plan.priceYearly;
                    return (
                      <button
                        key={plan.id}
                        type="button"
                        onClick={() => setSelectedPlanId(plan.id)}
                        className={[
                          "text-left rounded-2xl border p-5 transition-all",
                          "hover:shadow-lg hover:-translate-y-0.5",
                          isSelected
                            ? "!border-indigo-500 ring-2 ring-indigo-200/70 dark:ring-indigo-500/20 bg-indigo-50/70 dark:bg-indigo-500/10"
                            : "border-slate-200/70 dark:border-white/10 bg-white/60 dark:bg-white/5 hover:border-indigo-400/60",
                        ].join(" ")}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-[12px] tracking-widest uppercase text-pink-600">
                              {plan.name}
                            </p>
                            <p className="mt-2 text-2xl serif italic text-slate-900 dark:text-slate-100">
                              {price.toLocaleString(undefined, {
                                style: "currency",
                                currency: "USD",
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 0,
                              })}
                            </p>
                            <p className="text-[10px] tracking-widest uppercase text-slate-500 dark:text-slate-400">
                              per {billingInterval === "monthly" ? "month" : "year"}
                            </p>
                          </div>
                          {isSelected ? (
                            <span className="mt-1 text-[10px] uppercase tracking-widest font-semibold text-indigo-700 dark:text-indigo-300">
                              Selected
                            </span>
                          ) : null}
                        </div>
                        {plan.description ? (
                          <p className="mt-3 text-sm text-muted-foreground line-clamp-2">
                            {plan.description}
                          </p>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}