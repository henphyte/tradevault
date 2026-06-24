"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, X, CheckCircle2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import type { Trade, TradeInsert, CSVImportResult } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { parseMT5CSV } from "@/lib/mt5/csv-parser";
import { formatMoney, pnlColor } from "@/lib/utils";

interface CSVImportProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingTrades: Trade[];
  onImport: (trades: TradeInsert[]) => Promise<{ inserted: number; failed: number }>;
}

export function CSVImport({ open, onOpenChange, existingTrades, onImport }: CSVImportProps) {
  const [fileName, setFileName] = useState<string | null>(null);
  const [result, setResult] = useState<CSVImportResult | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = () => {
        const text = reader.result as string;
        const existingTickets = new Set(
          existingTrades.map((t) => t.ticket).filter((t): t is string => Boolean(t))
        );
        const parsed = parseMT5CSV(text, "", existingTickets);
        setResult(parsed);
      };
      reader.onerror = () => {
        toast.error("Failed to read file");
      };
      reader.readAsText(file);
    },
    [existingTrades]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "text/csv": [".csv"] },
    maxFiles: 1,
  });

  const handleImport = async () => {
    if (!result || result.trades.length === 0) return;
    setIsImporting(true);
    try {
      const { inserted, failed } = await onImport(result.trades);
      toast.success(`Imported ${inserted} trade(s)`, {
        description: failed > 0 ? `${failed} failed to import` : undefined,
      });
      handleClose();
    } catch (err) {
      toast.error("Import failed", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleClose = () => {
    setFileName(null);
    setResult(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import MT5 History</DialogTitle>
        </DialogHeader>

        {!result ? (
          <div
            {...getRootProps()}
            className={`flex flex-col items-center justify-center gap-3 rounded-md border-2 border-dashed px-6 py-12 cursor-pointer transition-colors ${
              isDragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="h-8 w-8 text-text-muted" />
            <p className="text-sm text-text-primary font-medium">
              Drop your MT5 History CSV here, or click to browse
            </p>
            <p className="text-xs text-text-muted">
              Expected columns: Ticket, Open Time, Type, Size, Item, Price, S/L, T/P, Close Time, Price, Commission, Taxes, Swap, Profit
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-md border border-border bg-background px-4 py-3">
              <span className="flex items-center gap-2 text-sm text-text-primary">
                <FileText className="h-4 w-4 text-text-muted" />
                {fileName}
              </span>
              <button
                onClick={() => {
                  setResult(null);
                  setFileName(null);
                }}
                className="text-text-muted hover:text-text-primary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-md border border-profit/30 bg-profit/10 px-3 py-2.5 text-center">
                <p className="text-lg font-mono font-semibold text-profit">{result.newTrades}</p>
                <p className="text-xs text-text-muted">New trades</p>
              </div>
              <div className="rounded-md border border-warning/30 bg-warning/10 px-3 py-2.5 text-center">
                <p className="text-lg font-mono font-semibold text-warning">
                  {result.duplicatesSkipped}
                </p>
                <p className="text-xs text-text-muted">Duplicates skipped</p>
              </div>
              <div className="rounded-md border border-loss/30 bg-loss/10 px-3 py-2.5 text-center">
                <p className="text-lg font-mono font-semibold text-loss">{result.errors.length}</p>
                <p className="text-xs text-text-muted">Errors</p>
              </div>
            </div>

            {result.errors.length > 0 && (
              <div className="max-h-32 overflow-y-auto rounded-md border border-loss/20 bg-loss/5 p-3 space-y-1">
                {result.errors.map((err, i) => (
                  <p key={i} className="flex items-start gap-1.5 text-xs text-loss">
                    <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
                    {err}
                  </p>
                ))}
              </div>
            )}

            {result.trades.length > 0 && (
              <div className="max-h-64 overflow-y-auto rounded-md border border-border">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-surface">
                    <tr className="border-b border-border text-left text-text-muted">
                      <th className="px-3 py-2">Ticket</th>
                      <th className="px-3 py-2">Symbol</th>
                      <th className="px-3 py-2">Type</th>
                      <th className="px-3 py-2">Lots</th>
                      <th className="px-3 py-2">Profit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.trades.slice(0, 50).map((t, i) => (
                      <tr key={i} className="border-b border-border last:border-0">
                        <td className="px-3 py-2 font-mono text-text-muted">{t.ticket}</td>
                        <td className="px-3 py-2 text-text-primary">{t.symbol}</td>
                        <td className="px-3 py-2">{t.type}</td>
                        <td className="px-3 py-2 font-mono">{t.lot_size}</td>
                        <td className={`px-3 py-2 font-mono ${pnlColor(t.profit)}`}>
                          {t.profit !== null && t.profit !== undefined ? formatMoney(t.profit) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {result.trades.length > 50 && (
                  <p className="px-3 py-2 text-xs text-text-muted">
                    + {result.trades.length - 50} more trades not shown in preview
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          {result && result.trades.length > 0 && (
            <Button onClick={handleImport} disabled={isImporting} className="gap-1.5">
              <CheckCircle2 className="h-4 w-4" />
              {isImporting ? "Importing..." : `Import ${result.trades.length} trade(s)`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
