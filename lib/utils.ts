import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Formats a number as currency with 2 decimal places and a +/- sign. */
export function formatMoney(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "$0.00";
  const sign = value > 0 ? "+" : value < 0 ? "-" : "";
  return `${sign}$${Math.abs(value).toFixed(2)}`;
}

/** Formats a number as plain currency without a forced sign (e.g. for balances). */
export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "$0.00";
  return `$${value.toFixed(2)}`;
}

/** Formats pips with +/- sign and 1 decimal place. */
export function formatPips(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "0.0";
  const sign = value > 0 ? "+" : value < 0 ? "-" : "";
  return `${sign}${Math.abs(value).toFixed(1)}`;
}

/** Formats a percentage with 1 decimal place. */
export function formatPct(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "0.0%";
  return `${value.toFixed(1)}%`;
}

/** Formats RR like "1:2.4" */
export function formatRR(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return `1:${value.toFixed(2)}`;
}

/** Standard date format used across the app: DD MMM YYYY HH:mm */
export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const date = typeof value === "string" ? parseISO(value) : value;
  try {
    return format(date, "dd MMM yyyy HH:mm");
  } catch {
    return "—";
  }
}

/** Date-only format: DD MMM YYYY */
export function formatDateOnly(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const date = typeof value === "string" ? parseISO(value) : value;
  try {
    return format(date, "dd MMM yyyy");
  } catch {
    return "—";
  }
}

/** Returns the P&L color class: green for profit, red for loss, muted for zero. */
export function pnlColor(value: number | null | undefined): string {
  if (value === null || value === undefined || value === 0) return "text-text-muted";
  return value > 0 ? "text-profit" : "text-loss";
}

/** Pip size lookup for common symbol classes. Falls back to 0.0001 (4-decimal FX). */
export function getPipSize(symbol: string): number {
  const s = symbol.toUpperCase();
  if (s.includes("JPY")) return 0.01;
  if (s.includes("XAU") || s.includes("GOLD")) return 0.1;
  if (s.includes("XAG") || s.includes("SILVER")) return 0.01;
  if (
    s.includes("US30") ||
    s.includes("NAS") ||
    s.includes("SPX") ||
    s.includes("US500") ||
    s.includes("GER") ||
    s.includes("DAX")
  )
    return 1;
  return 0.0001;
}

/** Calculates pips moved between open and close price for a trade direction. */
export function calculatePips(
  symbol: string,
  type: "BUY" | "SELL",
  openPrice: number,
  closePrice: number
): number {
  const pipSize = getPipSize(symbol);
  const diff = type === "BUY" ? closePrice - openPrice : openPrice - closePrice;
  return diff / pipSize;
}

/** Calculates risk:reward multiple (reward / risk) given entry, stop, and close. */
export function calculateRR(
  type: "BUY" | "SELL",
  openPrice: number,
  stopLoss: number | null,
  closePrice: number | null
): number | null {
  if (!stopLoss || !closePrice) return null;
  const risk = type === "BUY" ? openPrice - stopLoss : stopLoss - openPrice;
  const reward = type === "BUY" ? closePrice - openPrice : openPrice - closePrice;
  if (risk <= 0) return null;
  return reward / risk;
}

/** Generates a stable pseudo-random hex color badge from a string (e.g. firm name). */
export function colorFromString(input: string): string {
  const palette = [
    "#6366f1",
    "#22c55e",
    "#f59e0b",
    "#ef4444",
    "#06b6d4",
    "#a855f7",
    "#ec4899",
  ];
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return palette[Math.abs(hash) % palette.length];
}

/** Determines the trading session based on UTC hour of a date/time. */
export function sessionFromTime(dateTime: string | Date): string {
  const date = typeof dateTime === "string" ? parseISO(dateTime) : dateTime;
  const hour = date.getUTCHours();
  // Rough session bands in UTC
  if (hour >= 0 && hour < 6) return "Tokyo";
  if (hour >= 6 && hour < 8) return "Sydney";
  if (hour >= 8 && hour < 12) return "London";
  if (hour >= 12 && hour < 16) return "Overlap";
  if (hour >= 16 && hour < 21) return "New York";
  return "Tokyo";
}

/** Clamp a number between min and max. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Returns a progress-bar color based on how close a value is to its limit. */
export function progressColor(pctOfLimit: number): string {
  if (pctOfLimit >= 100) return "bg-loss";
  if (pctOfLimit >= 80) return "bg-warning";
  return "bg-primary";
}

/** Safely parses a numeric string, returning 0 on failure. */
export function safeParseFloat(value: string | undefined | null): number {
  if (!value) return 0;
  const cleaned = value.replace(/[^0-9.\-]/g, "");
  const parsed = parseFloat(cleaned);
  return Number.isNaN(parsed) ? 0 : parsed;
}

/** Generates a random secret string for webhook auth (32 hex chars). */
export function generateSecret(): string {
  const bytes = new Uint8Array(16);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
