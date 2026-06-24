"use client";

import { useState } from "react";
import { Send, LogOut } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SettingsPage() {
  const router = useRouter();
  const { activeProfile } = useProfile();
  const [testMessage, setTestMessage] = useState("✅ Test notification from TradeVault");
  const [isSending, setIsSending] = useState(false);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleSendTest = async () => {
    setIsSending(true);
    try {
      const res = await fetch("/api/telegram/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: testMessage }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error ?? "Failed to send");
      toast.success("Test notification sent");
    } catch (err) {
      toast.error("Failed to send", {
        description: err instanceof Error ? err.message : "Check your Telegram configuration",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <h1 className="font-display text-xl font-medium text-text-primary tracking-tight">
          Settings
        </h1>
        <p className="text-sm text-text-muted">Notifications, integrations, and account</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Telegram Notifications</CardTitle>
          <CardDescription>
            Configure TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in your environment variables,
            then send a test message to verify the connection.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="testMessage">Test message</Label>
            <Input
              id="testMessage"
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
            />
          </div>
          <Button className="gap-1.5" onClick={handleSendTest} disabled={isSending}>
            <Send className="h-4 w-4" />
            {isSending ? "Sending..." : "Send test notification"}
          </Button>
        </CardContent>
      </Card>

      {activeProfile && (
        <Card>
          <CardHeader>
            <CardTitle>MT5 Webhook</CardTitle>
            <CardDescription>
              Use this with the webhook URL on the Profiles page to push trades from your EA.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Label>Active Profile Secret</Label>
            <Input readOnly value={activeProfile.webhook_secret} className="font-mono" />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" className="gap-1.5" onClick={handleSignOut}>
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
