"use client";

import { Copy, Pencil, Trash2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import type { Profile, Trade } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { formatCurrency, formatMoney, formatPct, clamp, pnlColor } from "@/lib/utils";
import { calculateWinRate } from "@/lib/analytics";

interface ProfileCardProps {
  profile: Profile;
  trades: Trade[];
  isActive: boolean;
  onSetActive: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function ProfileCard({ profile, trades, isActive, onSetActive, onEdit, onDelete }: ProfileCardProps) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const today = now.toISOString().slice(0, 10);

  const monthTrades = trades.filter((t) => t.open_time >= monthStart);
  const todayTrades = trades.filter((t) => (t.close_time ?? t.open_time).slice(0, 10) === today);

  const monthlyWinRate = calculateWinRate(monthTrades);
  const totalTrades = monthTrades.filter((t) => t.status === "CLOSED").length;

  const dailyLossLimitAbs = (profile.daily_loss_limit_pct / 100) * profile.account_size;
  const todayPnL = todayTrades
    .filter((t) => t.status === "CLOSED")
    .reduce((sum, t) => sum + (t.profit ?? 0), 0);
  const todayLoss = todayPnL < 0 ? Math.abs(todayPnL) : 0;
  const dailyLossPct = dailyLossLimitAbs > 0 ? clamp((todayLoss / dailyLossLimitAbs) * 100, 0, 100) : 0;

  const totalDrawdownLimitAbs = (profile.max_drawdown_pct / 100) * profile.account_size;
  const totalDrawdownAbs = Math.max(0, profile.starting_balance - profile.current_balance);
  const drawdownPct =
    totalDrawdownLimitAbs > 0 ? clamp((totalDrawdownAbs / totalDrawdownLimitAbs) * 100, 0, 100) : 0;

  const profitTargetAbs = (profile.profit_target_pct / 100) * profile.account_size;
  const currentProfitAbs = Math.max(0, profile.current_balance - profile.starting_balance);
  const profitProgressPct =
    profitTargetAbs > 0 ? clamp((currentProfitAbs / profitTargetAbs) * 100, 0, 100) : 0;

  const webhookUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/api/mt5/webhook`
      : "/api/mt5/webhook";

  const copyWebhook = () => {
    const payload = `URL: ${webhookUrl}\nSecret: ${profile.webhook_secret}\nProfile ID: ${profile.id}`;
    navigator.clipboard.writeText(payload);
    toast.success("Webhook details copied to clipboard");
  };

  return (
    <Card className={isActive ? "ring-1 ring-primary" : undefined}>
      <CardHeader className="flex flex-row items-start justify-between">
        <div className="flex items-center gap-3">
          <span
            className="h-3 w-3 rounded-full shrink-0"
            style={{ backgroundColor: profile.color_badge }}
          />
          <div>
            <CardTitle className="text-text-primary text-base font-medium">
              {profile.firm_name}
            </CardTitle>
            <span className="text-xs text-text-muted">
              {formatCurrency(profile.account_size)} account
            </span>
          </div>
        </div>
        <Badge variant={profile.phase === "Funded" ? "buy" : "default"}>{profile.phase}</Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-1.5 text-xs">
            <span className="text-text-muted">Daily Loss Limit</span>
            <span className="font-mono text-text-primary">
              {formatMoney(-todayLoss)} / {formatMoney(-dailyLossLimitAbs)}
            </span>
          </div>
          <Progress
            value={dailyLossPct}
            indicatorClassName={
              dailyLossPct >= 100 ? "bg-loss" : dailyLossPct >= 80 ? "bg-warning" : "bg-primary"
            }
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5 text-xs">
            <span className="text-text-muted">Max Drawdown</span>
            <span className="font-mono text-text-primary">
              {formatCurrency(totalDrawdownAbs)} / {formatCurrency(totalDrawdownLimitAbs)}
            </span>
          </div>
          <Progress
            value={drawdownPct}
            indicatorClassName={
              drawdownPct >= 100 ? "bg-loss" : drawdownPct >= 80 ? "bg-warning" : "bg-primary"
            }
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5 text-xs">
            <span className="text-text-muted">Profit Target</span>
            <span className="font-mono text-text-primary">
              {formatCurrency(currentProfitAbs)} / {formatCurrency(profitTargetAbs)}
            </span>
          </div>
          <Progress value={profitProgressPct} indicatorClassName="bg-profit" />
        </div>

        <div className="flex gap-4 pt-1 text-sm">
          <div>
            <p className="text-xs text-text-muted">Trades (mo.)</p>
            <p className="font-mono text-text-primary">{totalTrades}</p>
          </div>
          <div>
            <p className="text-xs text-text-muted">Win Rate (mo.)</p>
            <p className="font-mono text-text-primary">{formatPct(monthlyWinRate)}</p>
          </div>
          <div>
            <p className="text-xs text-text-muted">Balance</p>
            <p className={`font-mono ${pnlColor(profile.current_balance - profile.starting_balance)}`}>
              {formatCurrency(profile.current_balance)}
            </p>
          </div>
        </div>

        <button
          onClick={copyWebhook}
          className="flex w-full items-center justify-between rounded-md border border-border bg-background px-3 py-2 text-xs text-text-muted hover:border-primary/50 hover:text-text-primary transition-colors"
        >
          <span className="truncate font-mono">{webhookUrl}</span>
          <Copy className="h-3.5 w-3.5 shrink-0 ml-2" />
        </button>

        <div className="flex gap-2 pt-1">
          {!isActive && (
            <Button variant="outline" size="sm" className="gap-1.5 flex-1" onClick={onSetActive}>
              <CheckCircle2 className="h-3.5 w-3.5" />
              Set Active
            </Button>
          )}
          <Button variant="outline" size="sm" className="gap-1.5" onClick={onEdit}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button variant="destructive" size="sm" className="gap-1.5" onClick={onDelete}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
