"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile, ProfileInsert, ProfileUpdate } from "@/types";
import { generateSecret } from "@/lib/utils";

interface ProfileContextValue {
  profiles: Profile[];
  activeProfile: Profile | null;
  activeProfileId: string | null;
  setActiveProfileId: (id: string) => void;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  createProfile: (input: ProfileInsert) => Promise<Profile | null>;
  updateProfile: (id: string, input: ProfileUpdate) => Promise<Profile | null>;
  deleteProfile: (id: string) => Promise<boolean>;
}

const ProfileContext = createContext<ProfileContextValue | undefined>(undefined);

const ACTIVE_PROFILE_STORAGE_KEY = "tradevault_active_profile_id";

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfileId, setActiveProfileIdState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const fetchProfiles = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: true });

      if (fetchError) throw fetchError;

      const rows = (data ?? []) as Profile[];
      setProfiles(rows);

      const stored =
        typeof window !== "undefined"
          ? window.localStorage.getItem(ACTIVE_PROFILE_STORAGE_KEY)
          : null;

      const validStored = rows.find((p) => p.id === stored);
      const fallback = rows.find((p) => p.is_active) ?? rows[0];
      const next = validStored ?? fallback ?? null;

      setActiveProfileIdState(next?.id ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load profiles");
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  const setActiveProfileId = useCallback((id: string) => {
    setActiveProfileIdState(id);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(ACTIVE_PROFILE_STORAGE_KEY, id);
    }
  }, []);

  const createProfile = useCallback(
    async (input: ProfileInsert): Promise<Profile | null> => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        const { data, error: insertError } = await supabase
          .from("profiles")
          .insert({
            ...input,
            user_id: user.id,
            webhook_secret: generateSecret(),
            current_balance: input.starting_balance,
          })
          .select()
          .single();

        if (insertError) throw insertError;

        await fetchProfiles();
        return data as Profile;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create profile");
        return null;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fetchProfiles]
  );

  const updateProfile = useCallback(
    async (id: string, input: ProfileUpdate): Promise<Profile | null> => {
      try {
        const { data, error: updateError } = await supabase
          .from("profiles")
          .update({ ...input, updated_at: new Date().toISOString() })
          .eq("id", id)
          .select()
          .single();

        if (updateError) throw updateError;

        await fetchProfiles();
        return data as Profile;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update profile");
        return null;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fetchProfiles]
  );

  const deleteProfile = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        const { error: deleteError } = await supabase.from("profiles").delete().eq("id", id);
        if (deleteError) throw deleteError;
        await fetchProfiles();
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete profile");
        return false;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fetchProfiles]
  );

  const activeProfile = profiles.find((p) => p.id === activeProfileId) ?? null;

  return (
    <ProfileContext.Provider
      value={{
        profiles,
        activeProfile,
        activeProfileId,
        setActiveProfileId,
        isLoading,
        error,
        refresh: fetchProfiles,
        createProfile,
        updateProfile,
        deleteProfile,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) {
    throw new Error("useProfile must be used within a ProfileProvider");
  }
  return ctx;
}
