"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ListOrdered,
  LineChart,
  BookText,
  Sparkles,
  Building2,
  Settings,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useProfile } from "@/hooks/useProfile";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/trades", label: "Trades", icon: ListOrdered },
  { href: "/analytics", label: "Analytics", icon: LineChart },
  { href: "/journal", label: "Journal", icon: BookText },
  { href: "/ai-coach", label: "AI Coach", icon: Sparkles },
  { href: "/profiles", label: "Profiles", icon: Building2 },
  { href: "/settings", label: "Settings", icon: Settings },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { activeProfile } = useProfile();

  return (
    <div className="flex h-full flex-col bg-surface border-r border-border">
      <div className="flex items-center gap-2 px-5 h-16 border-b border-border">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/15 border border-primary/30">
          <span className="font-display font-semibold text-sm text-primary tracking-tight">
            TV
          </span>
        </div>
        <span className="font-display font-medium text-text-primary tracking-tight hidden lg:inline">
          TradeVault
        </span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/15 text-primary"
                  : "text-text-muted hover:text-text-primary hover:bg-background"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="hidden lg:inline">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-border">
        <div className="hidden lg:flex flex-col gap-1 rounded-md bg-background px-3 py-2.5 border border-border">
          <span className="text-xs text-text-muted">Active Account</span>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-text-primary truncate">
              {activeProfile?.firm_name ?? "No profile"}
            </span>
            {activeProfile && (
              <span className="text-xs font-mono text-primary">{activeProfile.phase}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Desktop / tablet sidebar */}
      <aside className="hidden md:block w-16 lg:w-60 shrink-0 h-screen sticky top-0">
        <SidebarContent />
      </aside>

      {/* Mobile drawer trigger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-40 flex h-10 w-10 items-center justify-center rounded-md bg-surface border border-border text-text-primary"
        aria-label="Open navigation"
      >
        <Menu className="h-5 w-5" />
      </button>

      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-64 animate-fade-in">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-[-3rem] flex h-10 w-10 items-center justify-center rounded-md bg-surface border border-border text-text-primary"
              aria-label="Close navigation"
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarContent onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
