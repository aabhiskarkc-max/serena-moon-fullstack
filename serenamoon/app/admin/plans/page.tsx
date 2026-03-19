"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Toast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Plus, Trash2, Pencil, X } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

type Plan = {
  id: string;
  name: string;
  description: string | null;
  priceMonthly: number;
  priceYearly: number;
  allowPremium: boolean | null;
};

type FormMode = "create" | "edit";

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [priceMonthly, setPriceMonthly] = useState("");
  const [priceYearly, setPriceYearly] = useState("");
  const [allowPremium, setAllowPremium] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>("create");
  const [activePlan, setActivePlan] = useState<Plan | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await fetch(`${API_URL}/plans`);
        if (!res.ok) throw new Error("Failed to load plans");
        const data = await res.json();
        setPlans(data);
      } catch (err: any) {
        setToast({ message: err.message ?? "Failed to load plans", type: "error" });
      }
    };
    fetchPlans();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(id);
  }, [toast]);

  const resetForm = () => {
    setName("");
    setDescription("");
    setPriceMonthly("");
    setPriceYearly("");
    setAllowPremium(false);
    setActivePlan(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setToast(null);

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("serena_token") : null;
      if (!token) {
        throw new Error(
          `You must be logged in as admin to ${formMode === "create" ? "create" : "update"} plans.`,
        );
      }
      const endpoint =
        formMode === "create"
          ? `${API_URL}/plans`
          : `${API_URL}/plans/${activePlan?.id}`;
      const method = formMode === "create" ? "POST" : "PUT";

      const res = await fetch(endpoint, {
        method,
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
        throw new Error(
          data.message ??
            (formMode === "create" ? "Failed to create plan" : "Failed to update plan"),
        );
      }

      if (formMode === "create") {
        setPlans((prev) => [...prev, data]);
        setToast({ message: "Plan created successfully.", type: "success" });
      } else {
        setPlans((prev) => prev.map((p) => (p.id === data.id ? data : p)));
        setToast({ message: "Plan updated successfully.", type: "success" });
      }
      resetForm();
      setShowForm(false);
    } catch (err: any) {
      setToast({ message: err.message ?? "Something went wrong", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    setToast(null);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("serena_token") : null;
      if (!token) {
        throw new Error("You must be logged in as admin to delete plans.");
      }

      const res = await fetch(`${API_URL}/plans/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message ?? "Failed to delete plan");
      }

      setPlans((prev) => prev.filter((p) => p.id !== id));
      setToast({ message: "Plan deleted.", type: "success" });
    } catch (err: any) {
      setToast({ message: err.message ?? "Delete failed", type: "error" });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Plans</h2>
          <p className="text-sm text-muted-foreground">
            Manage subscription plans available to your members.
          </p>
        </div>
        <Button
          size="icon"
          variant="outline"
          onClick={() => {
            resetForm();
            setFormMode("create");
            setShowForm(true);
          }}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-card">
        <table className="min-w-full text-sm">
          <thead className="border-b bg-muted/60">
            <tr className="text-left">
              <th className="px-4 py-2 font-medium">Name</th>
              <th className="px-4 py-2 font-medium max-w-[200px]">Description</th>
              <th className="px-4 py-2 font-medium">Monthly</th>
              <th className="px-4 py-2 font-medium">Yearly</th>
              <th className="px-4 py-2 font-medium">Premium</th>
              <th className="px-4 py-2 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {plans.map((plan) => (
              <tr
                key={plan.id}
                className="border-b last:border-0 hover:bg-muted/40 transition-colors"
              >
                <td className="px-4 py-2">{plan.name}</td>
                <td className="px-4 py-2 max-w-[200px] truncate text-muted-foreground" title={plan.description ?? undefined}>
                  {plan.description || "—"}
                </td>
                <td className="px-4 py-2">
                  {plan.priceMonthly.toLocaleString(undefined, {
                    style: "currency",
                    currency: "USD",
                  })}
                </td>
                <td className="px-4 py-2">
                  {plan.priceYearly.toLocaleString(undefined, {
                    style: "currency",
                    currency: "USD",
                  })}
                </td>
                <td className="px-4 py-2">
                  {plan.allowPremium ? (
                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-600">
                      Yes
                    </span>
                  ) : (
                    <span className="rounded-full bg-slate-500/10 px-2 py-0.5 text-xs text-slate-500">
                      No
                    </span>
                  )}
                </td>
                <td className="px-4 py-2">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        setActivePlan(plan);
                        setName(plan.name);
                        setDescription(plan.description ?? "");
                        setPriceMonthly(String(plan.priceMonthly));
                        setPriceYearly(String(plan.priceYearly));
                        setAllowPremium(Boolean(plan.allowPremium));
                        setFormMode("edit");
                        setShowForm(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        setActivePlan(plan);
                        setConfirmDeleteOpen(true);
                      }}
                      disabled={deletingId === plan.id}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {plans.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-sm text-muted-foreground"
                >
                  No plans created yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">
                  {formMode === "create" ? "Create plan" : "Edit plan"}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {formMode === "create"
                    ? "Define monthly and yearly pricing for this plan."
                    : "Update monthly and yearly pricing for this plan."}
                </p>
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="grid gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium" htmlFor="name">
                  Name
                </label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Premium"
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
                  placeholder="10"
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
                  placeholder="99"
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
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading
                    ? formMode === "create"
                      ? "Creating..."
                      : "Saving..."
                    : formMode === "create"
                      ? "Create plan"
                      : "Save changes"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmDeleteOpen}
        title="Delete plan"
        description={
          activePlan
            ? `Are you sure you want to delete the "${activePlan.name}" plan? This action cannot be undone.`
            : "Are you sure you want to delete this plan?"
        }
        confirmLabel="Delete"
        loading={Boolean(deletingId)}
        onCancel={() => {
          setConfirmDeleteOpen(false);
          setDeletingId(null);
        }}
        onConfirm={() => {
          if (activePlan) {
            handleDelete(activePlan.id);
          }
          setConfirmDeleteOpen(false);
        }}
      />

      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
}

