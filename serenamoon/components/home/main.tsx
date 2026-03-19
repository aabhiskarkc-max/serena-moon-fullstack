"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { fetchPlans, plansQueryKey, type Plan } from "@/api/plan";
import { fetchMySubscription, mySubscriptionQueryKey } from "@/api/subscription";

type BillingInterval = "monthly" | "yearly";

const LandingPage: React.FC = () => {
  const router = useRouter();
  const [scrollY, setScrollY] = useState(0);
  const [billingInterval, setBillingInterval] = useState<BillingInterval>("monthly");
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  const handleJoin = () => {
    console.log("joined");
  };

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const plansQuery = useQuery({
    queryKey: plansQueryKey,
    queryFn: fetchPlans,
  });

  const plans = plansQuery.data ?? [];

  const token =
    typeof window !== "undefined" ? localStorage.getItem("serena_token") : null;

  const subQuery = useQuery({
    queryKey: mySubscriptionQueryKey,
    queryFn: fetchMySubscription,
    enabled: Boolean(token),
    retry: false,
  });

  useEffect(() => {
    if (selectedPlanId) return;
    if (plans.length === 0) return;
    const defaultPlan = plans[1] ?? plans[0];
    setSelectedPlanId(defaultPlan?.id ?? null);
  }, [plans, selectedPlanId]);

  const onSubscribe = (planId: string) => {
    localStorage.setItem("pending_plan_id", planId);
    localStorage.setItem("pending_billing_interval", billingInterval);
    if (!token) {
      router.push(`/auth/register?next=${encodeURIComponent("/checkout")}`);
      return;
    }
    const hasSubscription = Boolean(subQuery.data?.subscription);
    router.push(hasSubscription ? "/profile/plan" : "/checkout");
  };
  return (
    <div className="relative overflow-hidden bg-background text-foreground dark:bg-[#03070a]">
      {/* Editorial Hero */}
      <section className="h-screen relative flex items-start justify-center p-16">
        <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
          <div
            className="w-full h-full transition-transform duration-[3s] ease-out opacity-40 scale-110 dark:grayscale"
            style={{ transform: `scale(${1.1 + scrollY * 0.0002}) translateY(${scrollY * 0.1}px)` }}
          >
            {/* Cinematic Ocean Breeze Video */}
            <video
              autoPlay
              muted
              loop
              playsInline
              className="w-full h-full object-cover brightness-90 contrast-110 dark:grayscale dark:brightness-50 dark:contrast-125"
            >
              <source src="https://assets.mixkit.co/videos/preview/mixkit-waves-coming-to-the-shore-in-a-gentle-breeze-4841-large.mp4" type="video/mp4" />
              <img
                src="https://images.unsplash.com/photo-1515161352723-74d119335f62?auto=format&fit=crop&q=80&w=1920&grayscale=true"
                alt="Artistic landscape"
                className="w-full h-full object-cover"
              />
            </video>
          </div>
          {/* Overlay for better text readability and atmosphere */}
          <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/10 via-background/45 to-background dark:from-indigo-500/10 dark:via-black/20 dark:to-[#03070a]" />
        </div>

        <div className="relative z-10 text-center flex flex-col items-center">
          <div className="overflow-hidden mb-6">
            <span className="text-[10px] tracking-widest-plus uppercase text-slate-500/90 dark:text-slate-300/80 block opacity-95 antialiased">
              Private <span className="text-pink-500/90">Digital</span> Exhibition
            </span>
          </div>
          <h1 className="text-8xl md:text-[12rem] leading-none italic serif text-transparent bg-clip-text bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 dark:from-slate-100 dark:via-slate-200 dark:to-slate-100 mb-4 drop-shadow-[0_10px_30px_rgba(2,6,23,0.25)]">
            Moon
          </h1>
          <h1 className="text-8xl md:text-[12rem] leading-none italic serif text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-fuchsia-500 to-indigo-500 -mt-8 md:-mt-20 ml-20 md:ml-40 drop-shadow-[0_10px_30px_rgba(2,6,23,0.25)]">
            Tides
          </h1>

          <p className="mt-12 text-sm md:text-base font-medium text-slate-700/90 dark:text-slate-200/80 tracking-[0.18em] uppercase max-w-xs mx-auto leading-relaxed fine-serif italic">
            Visual poetry by Serena Moon
          </p>

          <div className="mt-20 group relative overflow-hidden">
            <button
              onClick={handleJoin}
              className="relative z-10 px-16 py-6 text-[10px] tracking-[0.5em] uppercase text-slate-900 dark:text-slate-100 border border-indigo-500/30 hover:border-indigo-500/60 transition-colors duration-700 bg-white/10 dark:bg-transparent"
            >
              Enter Private View
            </button>
            <div className="absolute inset-0 bg-white/5 translate-y-full group-hover:translate-y-0 transition-transform duration-700"></div>
          </div>
        </div>

        <div className="absolute bottom-12 left-12 flex flex-col gap-3 rounded-xl bg-indigo-950/35 dark:bg-indigo-950/45 px-4 py-3 text-[11px] tracking-[0.18em] uppercase text-white/95 font-semibold antialiased drop-shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-700">
          <span>01 — THE STILLNESS</span>
          <span>02 — THE MOVEMENT</span>
          <span>03 — THE SHADOW</span>
        </div>

        {/* Dynamic Ocean Tide Animation at the very bottom of the Hero */}
        <div className="absolute bottom-0 left-0 w-full h-32 md:h-48 pointer-events-none z-20 overflow-hidden">
          <svg className="waves" xmlns="http://www.w3.org/2000/svg" viewBox="0 24 150 28" preserveAspectRatio="none" shapeRendering="auto">
            <defs>
              <path id="gentle-wave" d="M-160 44c30 0 58-18 88-18s 58 18 88 18 58-18 88-18 58 18 88 18 v44h-352z" />
            </defs>
            <g className="parallax">
              <use xlinkHref="#gentle-wave" x="48" y="0" fill="rgba(3, 7, 10, 0.7)" />
              <use xlinkHref="#gentle-wave" x="48" y="3" fill="rgba(3, 7, 10, 0.5)" />
              <use xlinkHref="#gentle-wave" x="48" y="5" fill="rgba(3, 7, 10, 0.3)" />
              <use xlinkHref="#gentle-wave" x="48" y="7" fill="rgba(3, 7, 10, 1)" />
            </g>
          </svg>
        </div>
      </section>

      {/* Narrative Section - Large Offset Text */}
      <section className="py-60 px-6 md:px-12 grid grid-cols-1 md:grid-cols-12 gap-12 items-center max-w-7xl mx-auto">
        <div className="md:col-span-7">
          <div className="aspect-[4/5] overflow-hidden rounded-3xl shadow-xl grayscale opacity-80 dark:opacity-60 reveal-frame active">
            <img
              src="https://images.unsplash.com/photo-1549490349-8643362247b5?auto=format&fit=crop&q=80&w=800&grayscale=true"
              alt="Form study"
              className="w-full h-full object-cover transition-transform duration-1000 hover:scale-105"
            />
          </div>
        </div>
        <div className="md:col-span-5 md:pl-12 flex flex-col justify-center">
          <h2 className="text-5xl md:text-7xl serif italic text-slate-900 dark:text-slate-100 mb-6 leading-tight">
            The Body is a <br /> Landscape.
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-500 font-light fine-serif italic leading-relaxed mb-6">
            "I photograph not as a record, but as a conversation between the transient self and the eternal tide."
          </p>
          <div className="w-24 h-px bg-gradient-to-r from-primary/60 via-primary/20 to-transparent mb-10" />
          <p className="text-xs tracking-[0.2em] text-slate-500 dark:text-slate-400 uppercase leading-loose font-light">
            Serena's work maps the intersection of organic form and moonlight. Each piece is an intimate meditation on being.
          </p>
        </div>
      </section>

      {/* Grid Study - Fine Art Style */}
      <section className="py-40 px-6 md:px-12 bg-slate-50/70 dark:bg-black/40">
        <div className="max-w-screen-2xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-baseline mb-32 border-b border-slate-200/60 dark:border-white/5 pb-12">
            <h2 className="text-6xl serif italic text-slate-900 dark:text-slate-200">Current Studies</h2>
            <p className="text-[10px] tracking-widest text-slate-500 uppercase mt-4 md:mt-0">
              Reflecting the{" "}
              <span className="text-primary font-semibold">86.4%</span> Waxing Gibbous Phase
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-24">
            {[1, 2, 3].map((i) => (
              <div key={i} className="group relative flex flex-col">
                <div className="aspect-[3/4] overflow-hidden grayscale opacity-50 group-hover:opacity-80 transition-all duration-1000 border border-slate-200/60 dark:border-white/5 rounded-3xl bg-gradient-to-br from-primary/10 via-transparent to-sky-200/30 dark:from-primary/5 dark:to-transparent">
                  <img
                    src={`https://images.unsplash.com/photo-1518005020251-5fb28d0527c1?auto=format&fit=crop&q=80&w=800&grayscale=true`}
                    alt={`Study ${i}`}
                    className="w-full h-full object-cover grayscale transition-transform duration-1000 group-hover:scale-110"
                  />
                </div>
                <div className="mt-8 flex justify-between items-end">
                  <div>
                    <span className="text-[9px] tracking-[0.4em] text-slate-500 uppercase mb-2 block">
                      Series {i}
                    </span>
                    <h3 className="text-2xl serif italic text-slate-700 dark:text-slate-400 group-hover:text-primary transition-colors">
                      Vulnerability {i}
                    </h3>
                  </div>
                  <span className="text-[8px] tracking-[0.2em] text-slate-600 uppercase">Archive No. {100 + i}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Premium Membership - Clean Aesthetic */}
      <section
        id="pricing"
        className="px-6 md:px-12 flex flex-col items-center justify-center text-center relative bg-gradient-to-b from-sky-50 via-background to-slate-50 dark:from-transparent dark:via-transparent dark:to-transparent"
      >
        <div className="px-10 w-full">
          {/* <span className="text-[12px] tracking-widest-plus uppercase text-slate-500 mb-12 block">
            The Commitment
          </span> */}
          <h2 className="text-6xl md:text-8xl serif italic text-slate-900 dark:text-slate-100 mb-16 leading-none">
            Become the Patron.
          </h2>
          <p className="text-slate-600 dark:text-slate-400 fine-serif text-xl italic mb-12 leading-loose">
            Directly support the creation of art. Gain access to the full digital vault, high-resolution visual essays, and behind-the-scenes poetry.
          </p>

          {/* Monthly / Yearly toggle */}
          <div className="flex items-center justify-center gap-3 mb-16">
            <span
              className={`text-sm font-medium transition-colors ${billingInterval === "monthly"
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
                setBillingInterval((prev) =>
                  prev === "monthly" ? "yearly" : "monthly"
                )
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
              className={`text-sm font-medium transition-colors ${billingInterval === "yearly"
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

          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-8 w-full ">
            {plans.length > 0 ? (
              plans.map((plan, index) => {
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
                    <p
                      className="text-[20px] tracking-widest uppercase mb-6 text-pink-600 group-hover:text-pink-500"
                    >
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
                    <div
                      className={`w-12 h-px mx-auto my-6 ${"bg-gradient-to-r from-primary/60 via-primary/20 to-transparent"
                        }`}
                    />
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
                          isSelected ? "!border-indigo-500 text-indigo-700 dark:text-indigo-300" : "text-slate-700 dark:text-slate-200",
                        ].join(" ")}
                      >
                        Get {plan.name}
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <>
                <div className="p-8 rounded-3xl border border-slate-200/70 dark:border-white/5 bg-white/70 dark:bg-transparent">
                  <p className="text-[9px] tracking-widest uppercase text-slate-600 mb-6">
                    Monthly
                  </p>
                  <p className="text-4xl serif italic text-slate-900 dark:text-slate-200 mb-4">
                    $10
                  </p>
                  <p className="text-[10px] text-slate-500 mb-6">per month</p>
                  <div className="w-12 h-px bg-gradient-to-r from-primary/60 to-transparent mx-auto my-6" />
                  <p className="text-[10px] text-slate-500">Standard access</p>
                  <div className="mt-8 flex justify-center">
                    <button
                      type="button"
                      className="h-11 w-full rounded-full border border-slate-300/70 bg-background/60 text-sm font-medium tracking-wide text-slate-700 transition-colors hover:bg-background/90 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
                    >
                      Get Monthly
                    </button>
                  </div>
                </div>
                <div className="p-8 rounded-3xl bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/40">
                  <p className="text-[9px] tracking-widest uppercase text-primary-800 dark:text-slate-300 mb-6">
                    Yearly
                  </p>
                  <p className="text-4xl serif italic text-slate-900 dark:text-slate-100 mb-4">
                    $99
                  </p>
                  <p className="text-[10px] text-slate-500 mb-6">per year</p>
                  <div className="w-12 h-px bg-white/40 mx-auto my-6" />
                  <p className="text-[10px] text-slate-500">Save when you commit</p>
                  <div className="mt-8 flex justify-center">
                    <button
                      type="button"
                      className="h-11 w-full rounded-full border border-indigo-500/60 bg-background/60 text-sm font-medium tracking-wide text-indigo-700 transition-colors hover:bg-background/90 dark:border-indigo-400/40 dark:bg-white/5 dark:text-indigo-300 dark:hover:bg-white/10"
                    >
                      Get Yearly
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>


        </div>
      </section>

      {/* Secondary Bottom Tide for the footer transition */}
      <div className="w-full h-32 md:h-48 pointer-events-none overflow-hidden bg-background dark:bg-[#03070a]">
        <svg className="waves h-full w-full" xmlns="http://www.w3.org/2000/svg" viewBox="0 24 150 28" preserveAspectRatio="none" shapeRendering="auto">
          <use xlinkHref="#gentle-wave" x="48" y="0" fill="rgba(15, 23, 42, 0.10)" />
          <use xlinkHref="#gentle-wave" x="48" y="3" fill="rgba(15, 23, 42, 0.08)" />
          <use xlinkHref="#gentle-wave" x="48" y="5" fill="rgba(15, 23, 42, 0.06)" />
          <use xlinkHref="#gentle-wave" x="48" y="7" fill="rgba(2, 6, 23, 0.92)" />
        </svg>
      </div>
    </div>
  );
};

export default LandingPage;