"use client";

type ToastProps = {
  message: string;
  type?: "success" | "error";
};

export function Toast({ message, type = "success" }: ToastProps) {
  const base =
    "fixed bottom-6 right-6 z-[1000] rounded-md px-4 py-3 text-sm shadow-lg border flex items-center gap-2";
  const styles =
    type === "success"
      ? "bg-emerald-600 text-emerald-50 border-emerald-500"
      : "bg-red-600 text-red-50 border-red-500";

  return (
    <div className={`${base} ${styles}`}>
      <span>{message}</span>
    </div>
  );
}

