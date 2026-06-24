"use client";

import { Check, ChevronsUpDown, Building2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/hooks/useProfile";
import { cn } from "@/lib/utils";

export function ProfileSwitcher() {
  const { profiles, activeProfile, setActiveProfileId, isLoading } = useProfile();

  if (isLoading) {
    return (
      <div className="h-9 w-44 rounded-md skeleton" />
    );
  }

  if (profiles.length === 0) {
    return (
      <Button variant="outline" size="sm" asChild>
        <a href="/profiles">+ Add a profile</a>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 min-w-[11rem] justify-between">
          <span className="flex items-center gap-2 truncate">
            <span
              className="h-2 w-2 rounded-full shrink-0"
              style={{ backgroundColor: activeProfile?.color_badge ?? "#6366f1" }}
            />
            <span className="truncate">{activeProfile?.firm_name ?? "Select profile"}</span>
          </span>
          <ChevronsUpDown className="h-3.5 w-3.5 text-text-muted shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Switch account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {profiles.map((profile) => (
          <DropdownMenuItem
            key={profile.id}
            onClick={() => setActiveProfileId(profile.id)}
            className="flex items-center justify-between"
          >
            <span className="flex items-center gap-2">
              <span
                className="h-2 w-2 rounded-full shrink-0"
                style={{ backgroundColor: profile.color_badge }}
              />
              <span className="flex flex-col">
                <span className="text-sm">{profile.firm_name}</span>
                <span className="text-xs text-text-muted">{profile.phase}</span>
              </span>
            </span>
            {profile.id === activeProfile?.id && <Check className="h-4 w-4 text-primary" />}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <a href="/profiles" className="flex items-center gap-2 text-text-muted">
            <Building2 className="h-4 w-4" />
            Manage profiles
          </a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
