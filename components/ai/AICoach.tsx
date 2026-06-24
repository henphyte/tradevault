"use client";

import { useState, useRef, useEffect, type FormEvent } from "react";
import { Send, Sparkles, Bot, User } from "lucide-react";
import { toast } from "sonner";
import type { AIMessage } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { AI_COACH_PRESETS } from "@/lib/groq";
import { cn } from "@/lib/utils";

interface AICoachProps {
  profileId: string;
}

export function AICoach({ profileId }: AICoachProps) {
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const sendPrompt = async (prompt: string) => {
    if (!prompt.trim() || isLoading) return;

    const userMessage: AIMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: prompt,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, profile_id: profileId }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Request failed with status ${res.status}`);
      }

      const data = await res.json();

      const assistantMessage: AIMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.response,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      toast.error("AI analysis failed", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    sendPrompt(input);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] max-h-[800px]">
      {messages.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/15 border border-primary/30 mb-4">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <h2 className="font-display text-lg font-medium text-text-primary mb-1">
            TradeVault AI Coach
          </h2>
          <p className="text-sm text-text-muted max-w-sm mb-6">
            Ask anything about your trading performance, or pick a preset analysis below.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
            {AI_COACH_PRESETS.map((preset) => (
              <button
                key={preset.label}
                onClick={() => sendPrompt(preset.prompt)}
                className="card-surface px-4 py-3 text-left text-sm text-text-primary hover:border-primary/50 transition-colors"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 pr-1">
          {messages.map((m) => (
            <div
              key={m.id}
              className={cn("flex gap-3", m.role === "user" ? "justify-end" : "justify-start")}
            >
              {m.role === "assistant" && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 border border-primary/30">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
              )}
              <Card
                className={cn(
                  "max-w-[80%] px-4 py-3",
                  m.role === "user" ? "bg-primary/10 border-primary/30" : ""
                )}
              >
                <p className="text-sm text-text-primary whitespace-pre-wrap">{m.content}</p>
              </Card>
              {m.role === "user" && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface border border-border">
                  <User className="h-4 w-4 text-text-muted" />
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 border border-primary/30">
                <Bot className="h-4 w-4 text-primary animate-pulse-glow" />
              </div>
              <Card className="px-4 py-3">
                <p className="text-sm text-text-muted">Analyzing your trades...</p>
              </Card>
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2 pt-4 border-t border-border mt-4">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your trading performance..."
          disabled={isLoading}
        />
        <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
