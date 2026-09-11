/**
 * NIVA — Utility functions for formatting
 */

/** Format Indian currency with ₹ symbol */
export function formatCurrency(amount: number, showSign = false): string {
  const formatted = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.abs(amount));

  if (showSign && amount > 0) return `+${formatted}`;
  if (amount < 0) return `-${formatted.replace("₹", "₹")}`;
  return formatted;
}

/** Format large currency for display */
export function formatCurrencyLarge(amount: number): string {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
  return `₹${amount.toFixed(0)}`;
}

/** Format percentage with direction arrow */
export function formatPercentChange(value: number): { text: string; direction: "up" | "down" | "neutral" } {
  if (Math.abs(value) < 0.5) return { text: "—", direction: "neutral" };
  const arrow = value > 0 ? "↑" : "↓";
  return {
    text: `${arrow} ${Math.abs(value).toFixed(0)}%`,
    direction: value > 0 ? "up" : "down",
  };
}

/** Format date relative */
export function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

/** Format date */
export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Format time */
export function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Get category icon emoji */
export function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    salary: "💰",
    rent: "🏠",
    emi: "🔄",
    groceries: "🛒",
    dining: "🍽️",
    shopping: "🛍️",
    transport: "🚗",
    entertainment: "🎬",
    utilities: "⚡",
    health: "🏥",
    education: "📚",
    investment: "📈",
    insurance: "🛡️",
    business_income: "🏪",
    business_expense: "📦",
    freelance_income: "💻",
    gig_income: "🛵",
    family_support: "👨‍👩‍👧",
    other: "💳",
  };
  return icons[category] || "💳";
}

/** Get stress level color class */
export function getStressColor(level: string): string {
  switch (level) {
    case "low": return "positive";
    case "moderate": return "warning";
    case "elevated": return "warning";
    case "high": return "critical";
    case "critical": return "critical";
    default: return "neutral";
  }
}

/** Get score bar color class */
export function getScoreColor(score: number): string {
  if (score >= 70) return "positive";
  if (score >= 40) return "warning";
  return "critical";
}

/** Mask account number */
export function maskAccount(number: string): string {
  if (number.includes("XXXX")) return number;
  return `XXXX ${number.slice(-4)}`;
}
