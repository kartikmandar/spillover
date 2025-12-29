'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSupabase } from '@/providers/supabase-provider';
import type { Profile } from '@/types';

interface UseUserReturn {
  user: { id: string } | null;
  profile: Profile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
}

export function useUser(): UseUserReturn {
  const { supabase, user, loading: authLoading } = useSupabase();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  const fetchProfile = useCallback(async (): Promise<void> => {
    if (!user) {
      setProfile(null);
      setProfileLoading(false);
      return;
    }

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    setProfile(data);
    setProfileLoading(false);
  }, [supabase, user]);

  useEffect(() => {
    if (!authLoading) {
      fetchProfile();
    }
  }, [authLoading, fetchProfile]);

  const refreshProfile = useCallback(async (): Promise<void> => {
    setProfileLoading(true);
    await fetchProfile();
  }, [fetchProfile]);

  return {
    user,
    profile,
    loading: authLoading || profileLoading,
    refreshProfile,
  };
}
