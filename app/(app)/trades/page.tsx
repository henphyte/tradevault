"use client";

import { useState, useMemo } from "react";
import { Plus, Upload } from "lucide-react";
import { toast } from "sonner";
import type { Trade, TradeInsert } from "@/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TradeTable } from "@/components/trades/TradeTable";
import { TradeFiltersBar } from "@/components/trades/TradeFilters";
import { TradeForm } from "@/components/trades/TradeForm";
import { TradeModal } from "@/components/trades/TradeModal";
import { CSVImport } from "@/components/trades/CSVImport";
import { useTrades } from "@/hooks/useTrades";
import { formatDate } from "@/lib/utils";

function tradesToCsv(trades: Trade[]): string {
  const headers = [
    "Date",
    "Symbol",
    "Type",
    "Lots",
    "Entry",
    "Exit",
    "Pips",
    "P&L",
    "RR",
    "Session",
    "Emotion",
  ];
  const rows = trades.map((t) => [
    formatDate(t.open_time),
    t.symbol,
    t.type,
    t.lot_size,
    t.open_price,
    t.close_price ?? "",
    t.pips ?? "",
    t.profit ?? "",
    t.rr ?? "",
    t.session ?? "",
    t.emotion ?? "",
  ]);
  return [headers, ...rows].map((r) => r.join(",")).join("\n");
}

function downloadCsv(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function TradesPage() {
  const {
    trades,
    filteredTrades,
    isLoading,
    filters,
    setFilters,
    addTrade,
    updateTrade,
    deleteTrade,
    deleteTrades,
    bulkInsert,
  } = useTrades();

  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);

  const knownSymbols = useMemo(
    () => Array.from(new Set(trades.map((t) => t.symbol))).sort(),
    [trades]
  );

  const handleAddTrade = async (input: Omit<TradeInsert, "profile_id">) => {
    await addTrade(input);
    setIsAddOpen(false);
  };

  const handleToggleStar = async (trade: Trade) => {
    await updateTrade(trade.id, { starred: !trade.starred });
  };

  const handleDeleteSelected = async (ids: string[]) => {
    if (!confirm(`Delete ${ids.length} trade(s)? This cannot be undone.`)) return;
    await deleteTrades(ids);
    toast.success(`${ids.length} trade(s) deleted`);
  };

  const handleExportCsv = (selected: Trade[]) => {
    downloadCsv(tradesToCsv(selected), `tradevault-export-${Date.now()}.csv`);
    toast.success(`Exported ${selected.length} trade(s)`);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-medium text-text-primary tracking-tight">
            Trade Log
          </h1>
          <p className="text-sm text-text-muted">
            {filteredTrades.length} of {trades.length} trades shown
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-1.5" onClick={() => setIsImportOpen(true)}>
            <Upload className="h-4 w-4" />
            Import CSV
          </Button>
          <Button className="gap-1.5" onClick={() => setIsAddOpen(true)}>
            <Plus className="h-4 w-4" />
            Add Trade
          </Button>
        </div>
      </div>

      <TradeFiltersBar filters={filters} onChange={setFilters} trades={trades} />

      <TradeTable
        trades={filteredTrades}
        isLoading={isLoading}
        onRowClick={setSelectedTrade}
        onToggleStar={handleToggleStar}
        onDeleteSelected={handleDeleteSelected}
        onExportCsv={handleExportCsv}
      />

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Trade</DialogTitle>
          </DialogHeader>
          <TradeForm
            knownSymbols={knownSymbols}
            onSubmit={handleAddTrade}
            onCancel={() => setIsAddOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <TradeModal
        trade={selectedTrade}
        knownSymbols={knownSymbols}
        open={!!selectedTrade}
        onOpenChange={(open) => !open && setSelectedTrade(null)}
        onUpdate={updateTrade}
        onDelete={deleteTrade}
      />

      <CSVImport
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        existingTrades={trades}
        onImport={bulkInsert}
      />
    </div>
  );
}
