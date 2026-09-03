import type { CheckStatus, ConcernLevel } from "../types";

export function formatCurrency(amount: number | string): string {
  const value = typeof amount === "string" ? Number(amount) : amount;
  return `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

export function formatDate(iso: string): string {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (isSameDay(date, today)) return "Today";
  if (isSameDay(date, yesterday)) return "Yesterday";

  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export const concernLevelLabel: Record<ConcernLevel, string> = {
  LOW: "Low concern",
  MODERATE: "Moderate concern",
  HIGH: "High concern",
};

// Colour tokens per concern level — used consistently across Safety Check,
// Payment Review and History so the same level always reads the same way.
export const concernLevelStyles: Record<ConcernLevel, { text: string; bg: string; dot: string }> = {
  LOW: { text: "text-sage", bg: "bg-sage/10", dot: "bg-sage" },
  MODERATE: { text: "text-amber", bg: "bg-amber/10", dot: "bg-amber" },
  HIGH: { text: "text-terracotta", bg: "bg-terracotta/10", dot: "bg-terracotta" },
};

export const checkStatusStyles: Record<CheckStatus, { text: string; icon: "check" | "alert" | "info" }> = {
  good: { text: "text-sage", icon: "check" },
  warning: { text: "text-amber", icon: "alert" },
  neutral: { text: "text-ink-soft", icon: "info" },
};
