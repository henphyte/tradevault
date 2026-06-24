// ============================================================================
// Supabase generated database types
// Mirrors the SQL schema in supabase/schema.sql
// ============================================================================

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          user_id: string;
          firm_name: string;
          phase: string;
          account_size: number;
          daily_loss_limit_pct: number;
          max_drawdown_pct: number;
          profit_target_pct: number;
          starting_balance: number;
          current_balance: number;
          color_badge: string;
          webhook_secret: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          firm_name: string;
          phase: string;
          account_size: number;
          daily_loss_limit_pct: number;
          max_drawdown_pct: number;
          profit_target_pct: number;
          starting_balance: number;
          current_balance?: number;
          color_badge?: string;
          webhook_secret?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      trades: {
        Row: {
          id: string;
          user_id: string;
          profile_id: string;
          ticket: string | null;
          symbol: string;
          type: string;
          status: string;
          lot_size: number;
          open_price: number;
          close_price: number | null;
          stop_loss: number | null;
          take_profit: number | null;
          open_time: string;
          close_time: string | null;
          commission: number;
          swap: number;
          profit: number | null;
          pips: number | null;
          rr: number | null;
          session: string | null;
          emotion: string | null;
          setup: string | null;
          tags: string[];
          notes: string | null;
          screenshots: string[];
          starred: boolean;
          source: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          profile_id: string;
          ticket?: string | null;
          symbol: string;
          type: string;
          status?: string;
          lot_size: number;
          open_price: number;
          close_price?: number | null;
          stop_loss?: number | null;
          take_profit?: number | null;
          open_time: string;
          close_time?: string | null;
          commission?: number;
          swap?: number;
          profit?: number | null;
          pips?: number | null;
          rr?: number | null;
          session?: string | null;
          emotion?: string | null;
          setup?: string | null;
          tags?: string[];
          notes?: string | null;
          screenshots?: string[];
          starred?: boolean;
          source?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["trades"]["Insert"]>;
      };
      journal_entries: {
        Row: {
          id: string;
          user_id: string;
          profile_id: string;
          date: string;
          bias: string | null;
          economic_events: string | null;
          daily_goal: string | null;
          mood: string | null;
          energy_level: number | null;
          review: string | null;
          lessons_learned: string | null;
          plan_for_tomorrow: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          profile_id: string;
          date: string;
          bias?: string | null;
          economic_events?: string | null;
          daily_goal?: string | null;
          mood?: string | null;
          energy_level?: number | null;
          review?: string | null;
          lessons_learned?: string | null;
          plan_for_tomorrow?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["journal_entries"]["Insert"]
        >;
      };
    };
  };
}
