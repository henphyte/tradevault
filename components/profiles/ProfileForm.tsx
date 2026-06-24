"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import type { Profile, ProfileInsert, ProfilePhase, PropFirm } from "@/types";
import { PROP_FIRM_PRESETS } from "@/types";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { colorFromString, safeParseFloat } from "@/lib/utils";

const PHASES: ProfilePhase[] = ["Challenge", "Verification", "Funded"];
const PRESET_FIRMS: PropFirm[] = ["Funding Pips", "GOAT Funded", "Funded Next", "Custom"];

interface ProfileFormProps {
  initialProfile?: Profile;
  onSubmit: (input: ProfileInsert) => Promise<unknown>;
  onCancel: () => void;
}

export function ProfileForm({ initialProfile, onSubmit, onCancel }: ProfileFormProps) {
  const [preset, setPreset] = useState<PropFirm>(
    (initialProfile?.firm_name as PropFirm) &&
      PRESET_FIRMS.includes(initialProfile.firm_name as PropFirm)
      ? (initialProfile.firm_name as PropFirm)
      : "Custom"
  );
  const [firmName, setFirmName] = useState(initialProfile?.firm_name ?? "");
  const [phase, setPhase] = useState<ProfilePhase>(initialProfile?.phase ?? "Challenge");
  const [accountSize, setAccountSize] = useState(
    initialProfile ? String(initialProfile.account_size) : "100000"
  );
  const [dailyLossPct, setDailyLossPct] = useState(
    initialProfile ? String(initialProfile.daily_loss_limit_pct) : "5"
  );
  const [maxDrawdownPct, setMaxDrawdownPct] = useState(
    initialProfile ? String(initialProfile.max_drawdown_pct) : "10"
  );
  const [profitTargetPct, setProfitTargetPct] = useState(
    initialProfile ? String(initialProfile.profit_target_pct) : "10"
  );
  const [startingBalance, setStartingBalance] = useState(
    initialProfile ? String(initialProfile.starting_balance) : accountSize
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const applyPreset = (firm: PropFirm) => {
    setPreset(firm);
    if (firm === "Custom") return;
    const presetData = PROP_FIRM_PRESETS[firm];
    setFirmName(firm);
    setDailyLossPct(String(presetData.dailyLossPct));
    setMaxDrawdownPct(String(presetData.maxDrawdownPct));
    setProfitTargetPct(String(presetData.profitTargetPct));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!firmName.trim()) {
      toast.error("Firm name is required");
      return;
    }

    setIsSubmitting(true);
    try {
      const size = safeParseFloat(accountSize);
      const balance = startingBalance ? safeParseFloat(startingBalance) : size;

      await onSubmit({
        firm_name: firmName.trim(),
        phase,
        account_size: size,
        daily_loss_limit_pct: safeParseFloat(dailyLossPct),
        max_drawdown_pct: safeParseFloat(maxDrawdownPct),
        profit_target_pct: safeParseFloat(profitTargetPct),
        starting_balance: balance,
        color_badge: initialProfile?.color_badge ?? colorFromString(firmName),
        is_active: initialProfile?.is_active ?? false,
      });
      toast.success(initialProfile ? "Profile updated" : "Profile created");
    } catch (err) {
      toast.error("Failed to save profile", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Prop Firm Preset</Label>
        <Select value={preset} onValueChange={(v) => applyPreset(v as PropFirm)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PRESET_FIRMS.map((firm) => (
              <SelectItem key={firm} value={firm}>
                {firm}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-text-muted">
          Selecting a preset auto-fills daily loss, drawdown, and profit target limits.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="firmName">Firm / Account Name</Label>
        <Input
          id="firmName"
          value={firmName}
          onChange={(e) => setFirmName(e.target.value)}
          placeholder="Funding Pips — Challenge #1"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Phase</Label>
          <Select value={phase} onValueChange={(v) => setPhase(v as ProfilePhase)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PHASES.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="accountSize">Account Size ($)</Label>
          <Input
            id="accountSize"
            type="number"
            value={accountSize}
            onChange={(e) => setAccountSize(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="startingBalance">Starting Balance ($)</Label>
        <Input
          id="startingBalance"
          type="number"
          value={startingBalance}
          onChange={(e) => setStartingBalance(e.target.value)}
          placeholder="Defaults to account size"
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="dailyLossPct">Daily Loss %</Label>
          <Input
            id="dailyLossPct"
            type="number"
            step="0.1"
            value={dailyLossPct}
            onChange={(e) => setDailyLossPct(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="maxDrawdownPct">Max Drawdown %</Label>
          <Input
            id="maxDrawdownPct"
            type="number"
            step="0.1"
            value={maxDrawdownPct}
            onChange={(e) => setMaxDrawdownPct(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="profitTargetPct">Profit Target %</Label>
          <Input
            id="profitTargetPct"
            type="number"
            step="0.1"
            value={profitTargetPct}
            onChange={(e) => setProfitTargetPct(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : initialProfile ? "Save changes" : "Create profile"}
        </Button>
      </div>
    </form>
  );
}
