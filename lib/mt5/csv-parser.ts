import Papa from "papaparse";
import type { TradeInsert, CSVImportResult } from "@/types";
import { calculatePips, calculateRR, sessionFromTime, safeParseFloat } from "@/lib/utils";

/**
 * MT5 "History" tab CSV export has this column layout:
 * Ticket, Open Time, Type, Size, Item, Price, S/L, T/P, Close Time, Price, Commission, Taxes, Swap, Profit
 *
 * Note the duplicate "Price" header (open price vs close price). PapaParse will
 * auto-rename the second occurrence to "Price_1" or similar depending on config,
 * so we parse positionally rather than relying solely on header names to stay robust
 * across PapaParse versions and MT5 export locales.
 */

interface RawCSVRow {
  [key: string]: string;
}

function normalizeType(raw: string): "BUY" | "SELL" | null {
  const t = raw.trim().toLowerCase();
  if (t === "buy" || t === "0") return "BUY";
  if (t === "sell" || t === "1") return "SELL";
  return null;
}

function parseMT5DateTime(raw: string): string | null {
  // MT5 typically exports "YYYY.MM.DD HH:mm:ss" or "YYYY.MM.DD HH:mm"
  const trimmed = raw.trim();
  const match = trimmed.match(
    /^(\d{4})\.(\d{2})\.(\d{2})\s+(\d{2}):(\d{2})(?::(\d{2}))?$/
  );
  if (!match) {
    // Fall back to native Date parsing for alternate export formats
    const fallback = new Date(trimmed);
    if (!Number.isNaN(fallback.getTime())) return fallback.toISOString();
    return null;
  }
  const [, year, month, day, hour, minute, second] = match;
  const iso = `${year}-${month}-${day}T${hour}:${minute}:${second ?? "00"}Z`;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

/**
 * Parses raw MT5 CSV text into TradeInsert objects, deduplicating against a
 * set of already-imported ticket numbers.
 */
export function parseMT5CSV(
  csvText: string,
  profileId: string,
  existingTickets: Set<string>
): CSVImportResult {
  const result: CSVImportResult = {
    newTrades: 0,
    duplicatesSkipped: 0,
    errors: [],
    trades: [],
  };

  const parsed = Papa.parse<RawCSVRow>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(),
  });

  if (parsed.errors.length > 0) {
    for (const err of parsed.errors) {
      result.errors.push(`Row ${err.row ?? "?"}: ${err.message}`);
    }
  }

  const headers = parsed.meta.fields ?? [];
  // Find the two "Price" columns positionally: open price is the first Price-like
  // column after Item, close price is the one after Close Time.
  const priceIndexes = headers.reduce<number[]>((acc, h, i) => {
    if (h === "Price" || h.startsWith("Price")) acc.push(i);
    return acc;
  }, []);

  for (let i = 0; i < parsed.data.length; i++) {
    const row = parsed.data[i];
    try {
      const ticket = (row["Ticket"] ?? "").trim();
      if (!ticket) {
        result.errors.push(`Row ${i + 2}: missing ticket number, skipped`);
        continue;
      }

      if (existingTickets.has(ticket)) {
        result.duplicatesSkipped += 1;
        continue;
      }

      const type = normalizeType(row["Type"] ?? "");
      if (!type) {
        result.errors.push(`Row ${i + 2} (ticket ${ticket}): unrecognized trade type "${row["Type"]}", skipped`);
        continue;
      }

      const symbol = (row["Item"] ?? "").trim();
      if (!symbol) {
        result.errors.push(`Row ${i + 2} (ticket ${ticket}): missing symbol, skipped`);
        continue;
      }

      const openTimeRaw = row["Open Time"] ?? "";
      const closeTimeRaw = row["Close Time"] ?? "";
      const openTime = parseMT5DateTime(openTimeRaw);
      const closeTime = closeTimeRaw ? parseMT5DateTime(closeTimeRaw) : null;

      if (!openTime) {
        result.errors.push(`Row ${i + 2} (ticket ${ticket}): could not parse open time "${openTimeRaw}", skipped`);
        continue;
      }

      // Resolve open/close price positionally using header field names directly,
      // falling back to the second "Price" occurrence for close price.
      const openPriceKey = headers.find((h, idx) => (h === "Price" || h.startsWith("Price")) && idx === priceIndexes[0]) ?? "Price";
      const closePriceKey =
        priceIndexes.length > 1
          ? headers.find((h, idx) => (h === "Price" || h.startsWith("Price")) && idx === priceIndexes[1]) ?? "Price.1"
          : "Price.1";

      const openPrice = safeParseFloat(row[openPriceKey]);
      const closePrice = row[closePriceKey] !== undefined ? safeParseFloat(row[closePriceKey]) : null;
      const stopLoss = row["S/L"] ? safeParseFloat(row["S/L"]) : null;
      const takeProfit = row["T/P"] ? safeParseFloat(row["T/P"]) : null;
      const commission = safeParseFloat(row["Commission"]);
      const swap = safeParseFloat(row["Swap"]);
      const profit = safeParseFloat(row["Profit"]);
      const lotSize = safeParseFloat(row["Size"]);

      const pips =
        closePrice !== null ? calculatePips(symbol, type, openPrice, closePrice) : null;
      const rr =
        stopLoss !== null && closePrice !== null
          ? calculateRR(type, openPrice, stopLoss, closePrice)
          : null;

      const trade: TradeInsert = {
        profile_id: profileId,
        ticket,
        symbol,
        type,
        status: closeTime ? "CLOSED" : "OPEN",
        lot_size: lotSize,
        open_price: openPrice,
        close_price: closePrice,
        stop_loss: stopLoss,
        take_profit: takeProfit,
        open_time: openTime,
        close_time: closeTime,
        commission,
        swap,
        profit,
        pips,
        rr,
        session: sessionFromTime(openTime) as TradeInsert["session"],
        emotion: null,
        setup: null,
        tags: [],
        notes: null,
        screenshots: [],
        starred: false,
        source: "csv_import",
      };

      result.trades.push(trade);
      result.newTrades += 1;
      existingTickets.add(ticket);
    } catch (err) {
      result.errors.push(
        `Row ${i + 2}: unexpected error — ${err instanceof Error ? err.message : "unknown"}`
      );
    }
  }

  return result;
}
