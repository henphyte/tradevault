"use client";

import { useState, useMemo, useEffect, type FormEvent } from "react";
import { Upload, X } from "lucide-react";
import { toast } from "sonner";
import type { Trade, TradeInsert, TradeType, Session, Emotion } from "@/types";
import { EMOTION_EMOJI } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { calculatePips, calculateRR, sessionFromTime, safeParseFloat } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

const SESSIONS: Session[] = ["London", "New York", "Tokyo", "Sydney", "Overlap"];
const EMOTIONS: Emotion[] = ["Calm", "Confident", "Anxious", "Fearful", "Greedy", "Neutral"];

interface TradeFormProps {
  initialTrade?: Trade;
  knownSymbols: string[];
  onSubmit: (input: Omit<TradeInsert, "profile_id">) => Promise<unknown>;
  onCancel: () => void;
}

function toDatetimeLocal(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(
    d.getMinutes()
  )}`;
}

export function TradeForm({ initialTrade, knownSymbols, onSubmit, onCancel }: TradeFormProps) {
  const [symbol, setSymbol] = useState(initialTrade?.symbol ?? "");
  const [type, setType] = useState<TradeType>(initialTrade?.type ?? "BUY");
  const [lotSize, setLotSize] = useState(initialTrade ? String(initialTrade.lot_size) : "");
  const [openPrice, setOpenPrice] = useState(initialTrade ? String(initialTrade.open_price) : "");
  const [closePrice, setClosePrice] = useState(
    initialTrade?.close_price !== null && initialTrade?.close_price !== undefined
      ? String(initialTrade.close_price)
      : ""
  );
  const [stopLoss, setStopLoss] = useState(
    initialTrade?.stop_loss !== null && initialTrade?.stop_loss !== undefined
      ? String(initialTrade.stop_loss)
      : ""
  );
  const [takeProfit, setTakeProfit] = useState(
    initialTrade?.take_profit !== null && initialTrade?.take_profit !== undefined
      ? String(initialTrade.take_profit)
      : ""
  );
  const [openTime, setOpenTime] = useState(
    toDatetimeLocal(initialTrade?.open_time ?? new Date().toISOString())
  );
  const [closeTime, setCloseTime] = useState(toDatetimeLocal(initialTrade?.close_time ?? null));
  const [commission, setCommission] = useState(initialTrade ? String(initialTrade.commission) : "0");
  const [swap, setSwap] = useState(initialTrade ? String(initialTrade.swap) : "0");
  const [session, setSession] = useState<Session | undefined>(initialTrade?.session ?? undefined);
  const [emotion, setEmotion] = useState<Emotion | undefined>(initialTrade?.emotion ?? undefined);
  const [setup, setSetup] = useState(initialTrade?.setup ?? "");
  const [tagsInput, setTagsInput] = useState(initialTrade?.tags.join(", ") ?? "");
  const [notes, setNotes] = useState(initialTrade?.notes ?? "");
  const [screenshots, setScreenshots] = useState<string[]>(initialTrade?.screenshots ?? []);
  const [profit, setProfit] = useState(
    initialTrade?.profit !== null && initialTrade?.profit !== undefined
      ? String(initialTrade.profit)
      : ""
  );
  const [uploading, setUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-derive session from open time if not manually set
  useEffect(() => {
    if (!session && openTime) {
      const iso = new Date(openTime).toISOString();
      setSession(sessionFromTime(iso) as Session);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openTime]);

  const computed = useMemo(() => {
    const open = safeParseFloat(openPrice);
    const close = closePrice ? safeParseFloat(closePrice) : null;
    const sl = stopLoss ? safeParseFloat(stopLoss) : null;

    const pips = close !== null && symbol ? calculatePips(symbol, type, open, close) : null;
    const rr = sl !== null && close !== null ? calculateRR(type, open, sl, close) : null;

    const lots = safeParseFloat(lotSize);
    const comm = safeParseFloat(commission);
    const sw = safeParseFloat(swap);

    return { pips, rr, lots, comm, sw };
  }, [openPrice, closePrice, stopLoss, symbol, type, lotSize, commission, swap]);

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    if (screenshots.length + files.length > 3) {
      toast.error("Maximum 3 screenshots per trade");
      return;
    }

    setUploading(true);
    try {
      const supabase = createClient();
      const uploaded: string[] = [];

      for (const file of Array.from(files)) {
        const ext = file.name.split(".").pop();
        const path = `trade-screenshots/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error } = await supabase.storage.from("trade-screenshots").upload(path, file);
        if (error) throw error;
        const { data } = supabase.storage.from("trade-screenshots").getPublicUrl(path);
        uploaded.push(data.publicUrl);
      }

      setScreenshots((prev) => [...prev, ...uploaded]);
      toast.success(`${uploaded.length} screenshot(s) uploaded`);
    } catch (err) {
      toast.error("Upload failed", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!symbol.trim()) {
      toast.error("Symbol is required");
      return;
    }
    if (!openPrice || !lotSize || !openTime) {
      toast.error("Symbol, lot size, entry price, and open time are required");
      return;
    }

    setIsSubmitting(true);
    try {
      const openIso = new Date(openTime).toISOString();
      const closeIso = closeTime ? new Date(closeTime).toISOString() : null;
      const tags = tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const input: Omit<TradeInsert, "profile_id"> = {
        ticket: initialTrade?.ticket ?? null,
        symbol: symbol.trim().toUpperCase(),
        type,
        status: closeIso ? "CLOSED" : "OPEN",
        lot_size: safeParseFloat(lotSize),
        open_price: safeParseFloat(openPrice),
        close_price: closePrice ? safeParseFloat(closePrice) : null,
        stop_loss: stopLoss ? safeParseFloat(stopLoss) : null,
        take_profit: takeProfit ? safeParseFloat(takeProfit) : null,
        open_time: openIso,
        close_time: closeIso,
        commission: safeParseFloat(commission),
        swap: safeParseFloat(swap),
        profit: profit ? safeParseFloat(profit) : null,
        pips: computed.pips,
        rr: computed.rr,
        session: session ?? null,
        emotion: emotion ?? null,
        setup: setup.trim() || null,
        tags,
        notes: notes.trim() || null,
        screenshots,
        starred: initialTrade?.starred ?? false,
        source: initialTrade?.source ?? "manual",
      };

      await onSubmit(input);
      toast.success(initialTrade ? "Trade updated" : "Trade added");
    } catch (err) {
      toast.error("Failed to save trade", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="symbol">Symbol</Label>
          <Input
            id="symbol"
            list="known-symbols"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            placeholder="EURUSD"
            required
          />
          <datalist id="known-symbols">
            {knownSymbols.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </div>

        <div className="space-y-2">
          <Label>Type</Label>
          <div className="flex gap-2">
            <Button
              type="button"
              variant={type === "BUY" ? "default" : "outline"}
              className="flex-1"
              onClick={() => setType("BUY")}
            >
              BUY
            </Button>
            <Button
              type="button"
              variant={type === "SELL" ? "destructive" : "outline"}
              className="flex-1"
              onClick={() => setType("SELL")}
            >
              SELL
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="lotSize">Lot Size</Label>
          <Input
            id="lotSize"
            type="number"
            step="0.01"
            value={lotSize}
            onChange={(e) => setLotSize(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="openPrice">Open Price</Label>
          <Input
            id="openPrice"
            type="number"
            step="0.00001"
            value={openPrice}
            onChange={(e) => setOpenPrice(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="closePrice">Close Price</Label>
          <Input
            id="closePrice"
            type="number"
            step="0.00001"
            value={closePrice}
            onChange={(e) => setClosePrice(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="stopLoss">Stop Loss</Label>
          <Input
            id="stopLoss"
            type="number"
            step="0.00001"
            value={stopLoss}
            onChange={(e) => setStopLoss(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="takeProfit">Take Profit</Label>
          <Input
            id="takeProfit"
            type="number"
            step="0.00001"
            value={takeProfit}
            onChange={(e) => setTakeProfit(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="openTime">Open Time</Label>
          <Input
            id="openTime"
            type="datetime-local"
            value={openTime}
            onChange={(e) => setOpenTime(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="closeTime">Close Time</Label>
          <Input
            id="closeTime"
            type="datetime-local"
            value={closeTime}
            onChange={(e) => setCloseTime(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="commission">Commission</Label>
          <Input
            id="commission"
            type="number"
            step="0.01"
            value={commission}
            onChange={(e) => setCommission(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="swap">Swap</Label>
          <Input
            id="swap"
            type="number"
            step="0.01"
            value={swap}
            onChange={(e) => setSwap(e.target.value)}
          />
        </div>
      </div>

      {(computed.pips !== null || computed.rr !== null) && (
        <div className="flex gap-4 rounded-md border border-border bg-background px-4 py-3 text-sm">
          {computed.pips !== null && (
            <span className="text-text-muted">
              Pips: <span className="font-mono text-text-primary">{computed.pips.toFixed(1)}</span>
            </span>
          )}
          {computed.rr !== null && (
            <span className="text-text-muted">
              RR: <span className="font-mono text-text-primary">1:{computed.rr.toFixed(2)}</span>
            </span>
          )}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="profit">P&amp;L (manual entry, $)</Label>
        <Input
          id="profit"
          type="number"
          step="0.01"
          value={profit}
          onChange={(e) => setProfit(e.target.value)}
          placeholder="Enter realized P&L"
        />
        <p className="text-xs text-text-muted">
          Pip/RR are auto-calculated; P&amp;L should reflect your broker statement exactly.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Session</Label>
          <Select value={session} onValueChange={(v) => setSession(v as Session)}>
            <SelectTrigger>
              <SelectValue placeholder="Select session" />
            </SelectTrigger>
            <SelectContent>
              {SESSIONS.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Emotion</Label>
          <Select value={emotion} onValueChange={(v) => setEmotion(v as Emotion)}>
            <SelectTrigger>
              <SelectValue placeholder="How did you feel?" />
            </SelectTrigger>
            <SelectContent>
              {EMOTIONS.map((e) => (
                <SelectItem key={e} value={e}>
                  {EMOTION_EMOJI[e]} {e}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="setup">Setup</Label>
        <Input
          id="setup"
          value={setup}
          onChange={(e) => setSetup(e.target.value)}
          placeholder="e.g. Order block retest, breakout, news fade"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="tags">Tags (comma separated)</Label>
        <Input
          id="tags"
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          placeholder="trend, london-open, high-conviction"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="What did you see? What would you do differently?"
        />
      </div>

      <div className="space-y-2">
        <Label>Screenshots (up to 3)</Label>
        <div className="flex flex-wrap gap-2">
          {screenshots.map((url, i) => (
            <div key={i} className="relative h-16 w-16 rounded-md overflow-hidden border border-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={`Screenshot ${i + 1}`} className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => setScreenshots((prev) => prev.filter((_, idx) => idx !== i))}
                className="absolute top-0.5 right-0.5 rounded-full bg-black/70 p-0.5"
              >
                <X className="h-3 w-3 text-white" />
              </button>
            </div>
          ))}
          {screenshots.length < 3 && (
            <label className="flex h-16 w-16 cursor-pointer items-center justify-center rounded-md border border-dashed border-border text-text-muted hover:text-text-primary hover:border-primary">
              <Upload className="h-5 w-5" />
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                disabled={uploading}
                onChange={(e) => handleFileUpload(e.target.files)}
              />
            </label>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : initialTrade ? "Save changes" : "Add trade"}
        </Button>
      </div>
    </form>
  );
}
