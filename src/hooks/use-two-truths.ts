'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSupabase } from '@/providers/supabase-provider';
import { COOLDOWNS } from '@/lib/constants';
import type { TwoTruthsSubmission } from '@/types';

interface UseTwoTruthsReturn {
  submissions: TwoTruthsSubmission[];
  loading: boolean;
  submitTwoTruths: (
    statement1: string,
    statement2: string,
    statement3: string,
    lieIndex: 1 | 2 | 3
  ) => Promise<{ error?: string }>;
  makeGuess: (
    submissionId: string,
    guessedLieIndex: 1 | 2 | 3
  ) => Promise<{ error?: string }>;
  addReaction: (
    submissionId: string,
    emoji: string
  ) => Promise<{ error?: string }>;
  hasGuessed: (submissionId: string) => boolean;
  getLastSubmissionTime: () => Date | null;
  getTimeUntilReveal: (revealAt: string) => string | null;
  getUserSubmission: () => TwoTruthsSubmission | undefined;
}

export function useTwoTruths(): UseTwoTruthsReturn {
  const [submissions, setSubmissions] = useState<TwoTruthsSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const { supabase, user } = useSupabase();

  const fetchSubmissions = useCallback(async (): Promise<void> => {
    const { data } = await supabase
      .from('two_truths_submissions')
      .select(
        `
        *,
        profile:profiles(display_name),
        guesses:two_truths_guesses(*),
        reactions:two_truths_reactions(*)
      `
      )
      .order('created_at', { ascending: false });

    if (data) {
      setSubmissions(data as TwoTruthsSubmission[]);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchSubmissions();

    // Check for auto-reveals every 30 seconds
    const revealTimer = setInterval(() => {
      const now = new Date();
      setSubmissions((prev) =>
        prev.map((sub) => {
          if (!sub.is_revealed && new Date(sub.reveal_at) <= now) {
            return { ...sub, is_revealed: true };
          }
          return sub;
        })
      );
    }, 30000);

    // Realtime subscriptions
    const channel = supabase
      .channel('two_truths_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'two_truths_submissions' },
        () => fetchSubmissions()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'two_truths_guesses' },
        () => fetchSubmissions()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'two_truths_reactions' },
        () => fetchSubmissions()
      )
      .subscribe();

    return () => {
      clearInterval(revealTimer);
      supabase.removeChannel(channel);
    };
  }, [supabase, fetchSubmissions]);

  // Submit new two truths (with 30 min reveal time)
  const submitTwoTruths = useCallback(
    async (
      statement1: string,
      statement2: string,
      statement3: string,
      lieIndex: 1 | 2 | 3
    ): Promise<{ error?: string }> => {
      if (!user) return { error: 'Not authenticated' };

      const revealAt = new Date(Date.now() + COOLDOWNS.TWO_TRUTHS_REVEAL);

      const { error } = await supabase.from('two_truths_submissions').upsert({
        user_id: user.id,
        statement_1: statement1,
        statement_2: statement2,
        statement_3: statement3,
        lie_index: lieIndex,
        reveal_at: revealAt.toISOString(),
        is_revealed: false,
      });

      return { error: error?.message };
    },
    [supabase, user]
  );

  // Guess which is the lie (one per submission, before reveal)
  const makeGuess = useCallback(
    async (
      submissionId: string,
      guessedLieIndex: 1 | 2 | 3
    ): Promise<{ error?: string }> => {
      if (!user) return { error: 'Not authenticated' };

      const submission = submissions.find((s) => s.id === submissionId);

      // Check if already revealed
      if (submission?.is_revealed) {
        return { error: 'Submission already revealed' };
      }

      // Check if already guessed
      if (submission?.guesses?.some((g) => g.user_id === user.id)) {
        return { error: 'Already guessed' };
      }

      const { error } = await supabase.from('two_truths_guesses').insert({
        submission_id: submissionId,
        user_id: user.id,
        guessed_lie_index: guessedLieIndex,
      });

      return { error: error?.message };
    },
    [supabase, user, submissions]
  );

  // Toggle emoji reaction (add if not exists, remove if exists)
  const addReaction = useCallback(
    async (submissionId: string, emoji: string): Promise<{ error?: string }> => {
      if (!user) return { error: 'Not authenticated' };

      // Check if user already has this reaction
      const existing = submissions
        .find((s) => s.id === submissionId)
        ?.reactions?.find((r) => r.user_id === user.id && r.emoji === emoji);

      if (existing) {
        // Remove reaction
        const { error } = await supabase
          .from('two_truths_reactions')
          .delete()
          .eq('id', existing.id);
        return { error: error?.message };
      }

      // Add reaction
      const { error } = await supabase.from('two_truths_reactions').insert({
        submission_id: submissionId,
        user_id: user.id,
        emoji,
      });

      return { error: error?.message };
    },
    [supabase, user, submissions]
  );

  // Get user's last submission time
  const getLastSubmissionTime = useCallback((): Date | null => {
    if (!user) return null;
    const userSub = submissions.find((s) => s.user_id === user.id);
    return userSub ? new Date(userSub.created_at) : null;
  }, [submissions, user]);

  // Check if user has guessed on a submission
  const hasGuessed = useCallback(
    (submissionId: string): boolean => {
      const sub = submissions.find((s) => s.id === submissionId);
      return sub?.guesses?.some((g) => g.user_id === user?.id) ?? false;
    },
    [submissions, user]
  );

  // Calculate time until reveal
  const getTimeUntilReveal = useCallback((revealAt: string): string | null => {
    const diff = new Date(revealAt).getTime() - Date.now();
    if (diff <= 0) return null;
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  }, []);

  // Get current user's submission
  const getUserSubmission = useCallback((): TwoTruthsSubmission | undefined => {
    if (!user) return undefined;
    return submissions.find((s) => s.user_id === user.id);
  }, [submissions, user]);

  return {
    submissions,
    loading,
    submitTwoTruths,
    makeGuess,
    addReaction,
    hasGuessed,
    getLastSubmissionTime,
    getTimeUntilReveal,
    getUserSubmission,
  };
}
