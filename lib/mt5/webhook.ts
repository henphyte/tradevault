import type { MT5WebhookPayload, TradeInsert } from "@/types";
import { calculatePips, calculateRR, sessionFromTime } from "@/lib/utils";

export class WebhookValidationError extends Error {}

/** Validates the shared-secret header/body field against the configured webhook secret. */
export function validateWebhookSecret(providedSecret: string | undefined | null): boolean {
  const expected = process.env.MT5_WEBHOOK_SECRET;
  if (!expected) {
    throw new WebhookValidationError(
      "Server misconfiguration: MT5_WEBHOOK_SECRET is not set"
    );
  }
  if (!providedSecret) return false;
  return providedSecret === expected;
}

/** Type guard + structural validation for the incoming MT5 webhook body. */
export function parseWebhookPayload(body: unknown): MT5WebhookPayload {
  if (typeof body !== "object" || body === null) {
    throw new WebhookValidationError("Payload must be a JSON object");
  }

  const b = body as Record<string, unknown>;

  const requiredStringFields = ["secret", "profile_id", "ticket", "symbol", "type", "open_time", "status"];
  for (const field of requiredStringFields) {
    if (typeof b[field] !== "string") {
      throw new WebhookValidationError(`Missing or invalid field: ${field}`);
    }
  }

  const requiredNumberFields = ["volume", "price", "profit", "commission", "swap"];
  for (const field of requiredNumberFields) {
    if (typeof b[field] !== "number") {
      throw new WebhookValidationError(`Missing or invalid numeric field: ${field}`);
    }
  }

  if (b.type !== "BUY" && b.type !== "SELL") {
    throw new WebhookValidationError(`Invalid trade type: ${String(b.type)}`);
  }

  if (b.status !== "OPEN" && b.status !== "CLOSED") {
    throw new WebhookValidationError(`Invalid trade status: ${String(b.status)}`);
  }

  return {
    secret: b.secret as string,
    profile_id: b.profile_id as string,
    ticket: b.ticket as string,
    symbol: b.symbol as string,
    type: b.type as "BUY" | "SELL",
    volume: b.volume as number,
    price: b.price as number,
    close_price: typeof b.close_price === "number" ? b.close_price : undefined,
    stop_loss: typeof b.stop_loss === "number" ? b.stop_loss : undefined,
    take_profit: typeof b.take_profit === "number" ? b.take_profit : undefined,
    profit: b.profit as number,
    commission: b.commission as number,
    swap: b.swap as number,
    open_time: b.open_time as string,
    close_time: typeof b.close_time === "string" ? b.close_time : undefined,
    status: b.status as "OPEN" | "CLOSED",
  };
}

/** Converts a validated webhook payload into a TradeInsert ready for Supabase. */
export function webhookPayloadToTradeInsert(payload: MT5WebhookPayload): TradeInsert {
  const pips =
    payload.close_price !== undefined
      ? calculatePips(payload.symbol, payload.type, payload.price, payload.close_price)
      : null;

  const rr =
    payload.stop_loss !== undefined && payload.close_price !== undefined
      ? calculateRR(payload.type, payload.price, payload.stop_loss, payload.close_price)
      : null;

  return {
    profile_id: payload.profile_id,
    ticket: payload.ticket,
    symbol: payload.symbol,
    type: payload.type,
    status: payload.status,
    lot_size: payload.volume,
    open_price: payload.price,
    close_price: payload.close_price ?? null,
    stop_loss: payload.stop_loss ?? null,
    take_profit: payload.take_profit ?? null,
    open_time: payload.open_time,
    close_time: payload.close_time ?? null,
    commission: payload.commission,
    swap: payload.swap,
    profit: payload.profit,
    pips,
    rr,
    session: sessionFromTime(payload.open_time) as TradeInsert["session"],
    emotion: null,
    setup: null,
    tags: [],
    notes: null,
    screenshots: [],
    starred: false,
    source: "mt5_webhook",
  };
}
