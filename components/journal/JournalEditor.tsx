"use client";

import { useState, type FormEvent } from "react";
import { Star } from "lucide-react";
import { toast } from "sonner";
import type { JournalEntry, JournalEntryInsert, Bias, Mood } from "@/types";
import { MOOD_EMOJI } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const BIASES: Bias[] = ["Bullish", "Bearish", "Neutral"];
const MOODS: Mood[] = ["Great", "Good", "Okay", "Bad", "Terrible"];

interface JournalEditorProps {
  date: string;
  initialEntry: JournalEntry | null;
  onSave: (input: Omit<JournalEntryInsert, "profile_id">) => Promise<unknown>;
}

export function JournalEditor({ date, initialEntry, onSave }: JournalEditorProps) {
  const [bias, setBias] = useState<Bias | undefined>(initialEntry?.bias ?? undefined);
  const [economicEvents, setEconomicEvents] = useState(initialEntry?.economic_events ?? "");
  const [dailyGoal, setDailyGoal] = useState(initialEntry?.daily_goal ?? "");
  const [mood, setMood] = useState<Mood | undefined>(initialEntry?.mood ?? undefined);
  const [energyLevel, setEnergyLevel] = useState(initialEntry?.energy_level ?? 3);
  const [review, setReview] = useState(initialEntry?.review ?? "");
  const [lessonsLearned, setLessonsLearned] = useState(initialEntry?.lessons_learned ?? "");
  const [planForTomorrow, setPlanForTomorrow] = useState(initialEntry?.plan_for_tomorrow ?? "");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave({
        date,
        bias: bias ?? null,
        economic_events: economicEvents.trim() || null,
        daily_goal: dailyGoal.trim() || null,
        mood: mood ?? null,
        energy_level: energyLevel,
        review: review.trim() || null,
        lessons_learned: lessonsLearned.trim() || null,
        plan_for_tomorrow: planForTomorrow.trim() || null,
      });
      toast.success("Journal entry saved");
    } catch (err) {
      toast.error("Failed to save entry", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Pre-Market</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Bias</Label>
              <Select value={bias} onValueChange={(v) => setBias(v as Bias)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select bias" />
                </SelectTrigger>
                <SelectContent>
                  {BIASES.map((b) => (
                    <SelectItem key={b} value={b}>
                      {b}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dailyGoal">Daily Goal</Label>
              <Input
                id="dailyGoal"
                value={dailyGoal}
                onChange={(e) => setDailyGoal(e.target.value)}
                placeholder="e.g. Only trade A+ setups"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="economicEvents">Economic Events to Watch</Label>
            <Textarea
              id="economicEvents"
              value={economicEvents}
              onChange={(e) => setEconomicEvents(e.target.value)}
              placeholder="NFP at 13:30 UTC, FOMC minutes..."
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Mental State</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Mood</Label>
              <Select value={mood} onValueChange={(v) => setMood(v as Mood)}>
                <SelectTrigger>
                  <SelectValue placeholder="How are you feeling?" />
                </SelectTrigger>
                <SelectContent>
                  {MOODS.map((m) => (
                    <SelectItem key={m} value={m}>
                      {MOOD_EMOJI[m]} {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Energy Level</Label>
              <div className="flex items-center gap-1 h-10">
                {[1, 2, 3, 4, 5].map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setEnergyLevel(level)}
                    aria-label={`Energy level ${level}`}
                  >
                    <Star
                      className={`h-5 w-5 ${
                        level <= energyLevel ? "fill-warning text-warning" : "text-text-muted"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Post-Session</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="review">Review</Label>
            <Textarea
              id="review"
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="How did the session go? Did you follow your plan?"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lessonsLearned">Lessons Learned</Label>
            <Textarea
              id="lessonsLearned"
              value={lessonsLearned}
              onChange={(e) => setLessonsLearned(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="planForTomorrow">Plan for Tomorrow</Label>
            <Textarea
              id="planForTomorrow"
              value={planForTomorrow}
              onChange={(e) => setPlanForTomorrow(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSaving}>
          {isSaving ? "Saving..." : "Save Journal Entry"}
        </Button>
      </div>
    </form>
  );
}
