'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSupabase } from '@/providers/supabase-provider';
import type { HotTake } from '@/types';

interface UseHotTakesReturn {
  hotTakes: HotTake[];
  myHotTakes: HotTake[];
  loading: boolean;
  submitHotTake: (content: string) => Promise<{ error?: string }>;
  vote: (
    hotTakeId: string,
    voteType: 'agree' | 'disagree'
  ) => Promise<{ error?: string }>;
  addReaction: (
    hotTakeId: string,
    emoji: string
  ) => Promise<{ error?: string }>;
  hasVoted: (hotTakeId: string) => boolean;
  getUserVote: (hotTakeId: string) => 'agree' | 'disagree' | undefined;
  getLastSubmissionTime: () => Date | null;
}

export function useHotTakes(): UseHotTakesReturn {
  const [hotTakes, setHotTakes] = useState<HotTake[]>([]);
  const [loading, setLoading] = useState(true);
  const { supabase, user } = useSupabase();

  // Fetch hot takes with votes and reactions
  const fetchHotTakes = useCallback(async (): Promise<void> => {
    const { data } = await supabase
      .from('hot_takes')
      .select(
        `
        *,
        votes:hot_take_votes(*),
        reactions:hot_take_reactions(*)
      `
      )
      .order('created_at', { ascending: false });

    if (data) {
      setHotTakes(data as HotTake[]);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchHotTakes();

    // Realtime subscriptions
    const channel = supabase
      .channel('hot_takes_realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'hot_takes' },
        () => fetchHotTakes()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'hot_take_votes' },
        () => fetchHotTakes()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'hot_take_reactions' },
        () => fetchHotTakes()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, fetchHotTakes]);

  // Get user's last submission time for cooldown
  const getLastSubmissionTime = useCallback((): Date | null => {
    if (!user) return null;
    const userTakes = hotTakes.filter((t) => t.user_id === user.id);
    if (userTakes.length === 0) return null;
    return new Date(userTakes[0].created_at);
  }, [hotTakes, user]);

  // Submit new hot take
  const submitHotTake = useCallback(
    async (content: string): Promise<{ error?: string }> => {
      if (!user) return { error: 'Not authenticated' };

      const { error } = await supabase.from('hot_takes').insert({
        user_id: user.id,
        content,
      });

      return { error: error?.message };
    },
    [supabase, user]
  );

  // Vote on hot take (can change vote)
  const vote = useCallback(
    async (
      hotTakeId: string,
      voteType: 'agree' | 'disagree'
    ): Promise<{ error?: string }> => {
      if (!user) return { error: 'Not authenticated' };

      // Check if already voted
      const existing = hotTakes
        .find((t) => t.id === hotTakeId)
        ?.votes?.find((v) => v.user_id === user.id);

      if (existing) {
        // If same vote, do nothing
        if (existing.vote === voteType) {
          return {};
        }
        // Update to new vote
        const { error } = await supabase
          .from('hot_take_votes')
          .update({ vote: voteType })
          .eq('id', existing.id);
        return { error: error?.message };
      }

      const { error } = await supabase.from('hot_take_votes').insert({
        hot_take_id: hotTakeId,
        user_id: user.id,
        vote: voteType,
      });

      return { error: error?.message };
    },
    [supabase, user, hotTakes]
  );

  // Toggle emoji reaction (add if not exists, remove if exists)
  const addReaction = useCallback(
    async (hotTakeId: string, emoji: string): Promise<{ error?: string }> => {
      if (!user) return { error: 'Not authenticated' };

      // Check if user already has this reaction
      const existing = hotTakes
        .find((t) => t.id === hotTakeId)
        ?.reactions?.find((r) => r.user_id === user.id && r.emoji === emoji);

      if (existing) {
        // Remove reaction
        const { error } = await supabase
          .from('hot_take_reactions')
          .delete()
          .eq('id', existing.id);
        return { error: error?.message };
      }

      // Add reaction
      const { error } = await supabase.from('hot_take_reactions').insert({
        hot_take_id: hotTakeId,
        user_id: user.id,
        emoji,
      });

      return { error: error?.message };
    },
    [supabase, user, hotTakes]
  );

  // Get user's own hot takes
  const myHotTakes = hotTakes.filter((t) => t.user_id === user?.id);

  // Check if user has voted on a hot take
  const hasVoted = useCallback(
    (hotTakeId: string): boolean => {
      const take = hotTakes.find((t) => t.id === hotTakeId);
      return take?.votes?.some((v) => v.user_id === user?.id) ?? false;
    },
    [hotTakes, user]
  );

  // Get user's vote on a hot take
  const getUserVote = useCallback(
    (hotTakeId: string): 'agree' | 'disagree' | undefined => {
      const take = hotTakes.find((t) => t.id === hotTakeId);
      return take?.votes?.find((v) => v.user_id === user?.id)?.vote;
    },
    [hotTakes, user]
  );

  return {
    hotTakes,
    myHotTakes,
    loading,
    submitHotTake,
    vote,
    addReaction,
    hasVoted,
    getUserVote,
    getLastSubmissionTime,
  };
}
