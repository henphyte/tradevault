"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import type { Profile, ProfileInsert } from "@/types";
import { useProfile } from "@/hooks/useProfile";
import { useTrades } from "@/hooks/useTrades";
import { ProfileCard } from "@/components/profiles/ProfileCard";
import { ProfileForm } from "@/components/profiles/ProfileForm";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProfilesPage() {
  const {
    profiles,
    activeProfileId,
    setActiveProfileId,
    isLoading,
    createProfile,
    updateProfile,
    deleteProfile,
  } = useProfile();
  const { trades } = useTrades();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Profile | undefined>(undefined);

  const openCreate = () => {
    setEditingProfile(undefined);
    setIsFormOpen(true);
  };

  const openEdit = (profile: Profile) => {
    setEditingProfile(profile);
    setIsFormOpen(true);
  };

  const handleSubmit = async (input: ProfileInsert) => {
    if (editingProfile) {
      await updateProfile(editingProfile.id, input);
    } else {
      const created = await createProfile(input);
      if (created) setActiveProfileId(created.id);
    }
    setIsFormOpen(false);
  };

  const handleDelete = async (profile: Profile) => {
    if (!confirm(`Delete "${profile.firm_name}"? All associated trades will remain but become orphaned. This cannot be undone.`)) {
      return;
    }
    await deleteProfile(profile.id);
    toast.success("Profile deleted");
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-medium text-text-primary tracking-tight">
            Profiles
          </h1>
          <p className="text-sm text-text-muted">Manage your prop firm accounts and risk limits</p>
        </div>
        <Button className="gap-1.5" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Add Profile
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-80 w-full" />
          ))}
        </div>
      ) : profiles.length === 0 ? (
        <div className="card-surface p-12 text-center">
          <p className="text-sm text-text-muted mb-4">
            No profiles yet — create your first prop firm account to start tracking trades.
          </p>
          <Button className="gap-1.5" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Create your first profile
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {profiles.map((profile) => (
            <ProfileCard
              key={profile.id}
              profile={profile}
              trades={trades.filter((t) => t.profile_id === profile.id)}
              isActive={profile.id === activeProfileId}
              onSetActive={() => setActiveProfileId(profile.id)}
              onEdit={() => openEdit(profile)}
              onDelete={() => handleDelete(profile)}
            />
          ))}
        </div>
      )}

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingProfile ? "Edit Profile" : "Add Profile"}</DialogTitle>
          </DialogHeader>
          <ProfileForm
            initialProfile={editingProfile}
            onSubmit={handleSubmit}
            onCancel={() => setIsFormOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
