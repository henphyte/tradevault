"use client";

import { useState } from "react";
import { Trash2, Star, Pencil } from "lucide-react";
import { toast } from "sonner";
import type { Trade, TradeInsert, TradeUpdate } from "@/types";
import { EMOTION_EMOJI } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TradeForm } from "@/components/trades/TradeForm";
import { formatMoney, formatDate, formatPips, formatRR, pnlColor } from "@/lib/utils";

interface TradeModalProps {
  trade: Trade | null;
  knownSymbols: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (id: string, input: TradeUpdate) => Promise<unknown>;
  onDelete: (id: string) => Promise<unknown>;
}

export function TradeModal({
  trade,
  knownSymbols,
  open,
  onOpenChange,
  onUpdate,
  onDelete,
}: TradeModalProps) {
  const [isEditing, setIsEditing] = useState(false);

  if (!trade) return null;

  const handleUpdate = async (input: Omit<TradeInsert, "profile_id">) => {
    await onUpdate(trade.id, input);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (!confirm(`Delete this ${trade.symbol} trade? This cannot be undone.`)) return;
    await onDelete(trade.id);
    toast.success("Trade deleted");
    onOpenChange(false);
  };

  const handleToggleStar = async () => {
    await onUpdate(trade.id, { starred: !trade.starred });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) setIsEditing(false);
      }}
    >
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between pr-6">
            <DialogTitle className="flex items-center gap-2">
              {trade.symbol}
              <Badge variant={trade.type === "BUY" ? "buy" : "sell"}>{trade.type}</Badge>
            </DialogTitle>
          </div>
        </DialogHeader>

        {isEditing ? (
          <TradeForm
            initialTrade={trade}
            knownSymbols={knownSymbols}
            onSubmit={handleUpdate}
            onCancel={() => setIsEditing(false)}
          />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <Detail label="Open Time" value={formatDate(trade.open_time)} />
              <Detail label="Close Time" value={formatDate(trade.close_time)} />
              <Detail label="Lot Size" value={String(trade.lot_size)} mono />
              <Detail label="Status" value={trade.status} />
              <Detail label="Entry Price" value={String(trade.open_price)} mono />
              <Detail label="Exit Price" value={trade.close_price !== null ? String(trade.close_price) : "—"} mono />
              <Detail label="Stop Loss" value={trade.stop_loss !== null ? String(trade.stop_loss) : "—"} mono />
              <Detail label="Take Profit" value={trade.take_profit !== null ? String(trade.take_profit) : "—"} mono />
              <Detail label="Pips" value={formatPips(trade.pips)} mono />
              <Detail label="RR" value={formatRR(trade.rr)} mono />
              <Detail
                label="P&L"
                value={trade.profit !== null ? formatMoney(trade.profit) : "—"}
                mono
                valueClassName={pnlColor(trade.profit)}
              />
              <Detail label="Commission / Swap" value={`${formatMoney(trade.commission)} / ${formatMoney(trade.swap)}`} mono />
              <Detail label="Session" value={trade.session ?? "—"} />
              <Detail
                label="Emotion"
                value={trade.emotion ? `${EMOTION_EMOJI[trade.emotion]} ${trade.emotion}` : "—"}
              />
            </div>

            {trade.setup && (
              <div className="mt-4">
                <p className="text-xs text-text-muted mb-1">Setup</p>
                <p className="text-sm text-text-primary">{trade.setup}</p>
              </div>
            )}

            {trade.tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {trade.tags.map((tag) => (
                  <Badge key={tag} variant="muted">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            {trade.notes && (
              <div className="mt-4">
                <p className="text-xs text-text-muted mb-1">Notes</p>
                <p className="text-sm text-text-primary whitespace-pre-wrap">{trade.notes}</p>
              </div>
            )}

            {trade.screenshots.length > 0 && (
              <div className="mt-4 flex gap-2">
                {trade.screenshots.map((url, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={i}
                    src={url}
                    alt={`Screenshot ${i + 1}`}
                    className="h-24 w-24 rounded-md border border-border object-cover"
                  />
                ))}
              </div>
            )}

            <DialogFooter className="justify-between sm:justify-between">
              <Button variant="destructive" size="sm" className="gap-1.5" onClick={handleDelete}>
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="gap-1.5" onClick={handleToggleStar}>
                  <Star className={`h-3.5 w-3.5 ${trade.starred ? "fill-warning text-warning" : ""}`} />
                  {trade.starred ? "Starred" : "Star"}
                </Button>
                <Button size="sm" className="gap-1.5" onClick={() => setIsEditing(true)}>
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </Button>
              </div>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Detail({
  label,
  value,
  mono,
  valueClassName,
}: {
  label: string;
  value: string;
  mono?: boolean;
  valueClassName?: string;
}) {
  return (
    <div>
      <p className="text-xs text-text-muted">{label}</p>
      <p
        className={`text-sm ${mono ? "font-mono" : ""} ${valueClassName ?? "text-text-primary"}`}
      >
        {value}
      </p>
    </div>
  );
}
