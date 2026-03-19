"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Toast } from "@/components/ui/toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

type Plan = {
  id: string;
  name: string;
  description: string | null;
  priceMonthly: number;
  priceYearly: number;
  allowPremium: boolean | null;
};

export default function EditPlanPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const planId = params.id;

  const [plan, setPlan] = useState<Plan | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [priceMonthly, setPriceMonthly] = useState("");
  const [priceYearly, setPriceYearly] = useState("");
  const [allowPremium, setAllowPremium] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    const fetchPlan = async () => {
      try {
        const res = await fetch(`${API_URL}/plans/${planId}`);
        if (!res.ok) throw new Error("Failed to load plan");
        const data = await res.json();
        setPlan(data);
        setName(data.name);
        setDescription(data.description ?? "");
        setPriceMonthly(String(data.priceMonthly));
        setPriceYearly(String(data.priceYearly));
        setAllowPremium(Boolean(data.allowPremium));
      } catch (err: any) {
        setToast({ message: err.message ?? "Failed to load plan", type: "error" });
      } finally {
        setLoading(false);
      }
    };

    fetchPlan();
  }, [planId]);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(id);
  }, [toast]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setToast(null);

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("serena_token") : null;
      if (!token) {
        throw new Error("You must be logged in as admin to update plans.");
      }

      const res = await fetch(`${API_URL}/plans/${planId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          description: description.trim() || null,
          priceMonthly: Number(priceMonthly),
          priceYearly: Number(priceYearly),
          allowPremium,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message ?? "Failed to update plan");
      }

      setToast({ message: "Plan updated.", type: "success" });
    } catch (err: any) {
      setToast({ message: err.message ?? "Update failed", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading plan...</p>;
  }

  if (!plan) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-destructive">Plan not found.</p>
        <Button variant="outline" onClick={() => router.push("/admin/plans")}>
          Back to plans
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Edit plan</h2>
        <p className="text-sm text-muted-foreground">
          Update pricing and availability for <span className="font-medium">{plan.name}</span>.
        </p>
      </div>

      <form onSubmit={handleSave} className="grid gap-4 rounded-xl border bg-card p-4">
        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="name">
            Name
          </label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="description">
            Description
          </label>
          <textarea
            id="description"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Short description of the plan (optional)"
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="priceMonthly">
            Price monthly (USD)
          </label>
          <Input
            id="priceMonthly"
            type="number"
            min={0}
            step="0.01"
            value={priceMonthly}
            onChange={(e) => setPriceMonthly(e.target.value)}
            required
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="priceYearly">
            Price yearly (USD)
          </label>
          <Input
            id="priceYearly"
            type="number"
            min={0}
            step="0.01"
            value={priceYearly}
            onChange={(e) => setPriceYearly(e.target.value)}
            required
          />
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={allowPremium}
            onChange={(e) => setAllowPremium(e.target.checked)}
          />
          Allow premium content
        </label>

        <div className="mt-4 flex justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push("/admin/plans")}
          >
            Back
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </form>

      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
}

