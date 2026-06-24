"use client";

import { useProfile } from "@/hooks/useProfile";
import { AICoach } from "@/components/ai/AICoach";
import { Skeleton } from "@/components/ui/skeleton";

export default function AICoachPage() {
  const { activeProfile, isLoading } = useProfile();

  if (isLoading) {
    return <Skeleton className="h-[600px] w-full" />;
  }

  if (!activeProfile) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <h2 className="font-display text-lg font-medium text-text-primary mb-2">
          No trading profile selected
        </h2>
        <p className="text-sm text-text-muted max-w-sm">
          Create a profile and log some trades before asking the AI coach for insights.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-xl font-medium text-text-primary tracking-tight">
          AI Coach
        </h1>
        <p className="text-sm text-text-muted">
          Data-driven insights on {activeProfile.firm_name}
        </p>
      </div>
      <AICoach profileId={activeProfile.id} />
    </div>
  );
}
