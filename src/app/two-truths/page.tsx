'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useSupabase } from '@/providers/supabase-provider';
import { useTwoTruths } from '@/hooks/use-two-truths';
import { useCooldown } from '@/hooks/use-cooldown';
import { usePartyMode } from '@/hooks/use-party-mode';
import { Button } from '@/components/ui/button';
import { TwoTruthsCard } from '@/components/game/two-truths-card';
import { MobileNav } from '@/components/layout/mobile-nav';
import { COOLDOWNS } from '@/lib/constants';
import { cn } from '@/lib/utils';

export default function TwoTruthsPage() {
  const router = useRouter();
  const { supabase, user, loading: authLoading } = useSupabase();
  const {
    submissions,
    loading,
    makeGuess,
    addReaction,
    hasGuessed,
    getLastSubmissionTime,
    getTimeUntilReveal,
    getUserSubmission,
  } = useTwoTruths();
  const { isPartyMode, intensity } = usePartyMode();
  const prevGuessCount = useRef<Record<string, number>>({});

  const lastSubmissionTime = getLastSubmissionTime();
  const { canAct } = useCooldown(
    lastSubmissionTime,
    COOLDOWNS.TWO_TRUTHS_SUBMIT
  );
  const userSubmission = getUserSubmission();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  // Live activity feed - show toast when someone guesses
  useEffect(() => {
    if (loading || !user) return;

    submissions.forEach((submission) => {
      const currentCount = submission.guesses?.length || 0;
      const prevCount = prevGuessCount.current[submission.id] || 0;

      if (currentCount > prevCount && prevCount > 0) {
        // New guess detected - find the new guesses
        const ownerName = submission.profile?.display_name || 'Someone';
        if (submission.user_id === user.id) {
          toast(`Someone just guessed on your submission!`, {
            icon: '🎯',
            duration: 3000,
          });
        }
      }

      prevGuessCount.current[submission.id] = currentCount;
    });
  }, [submissions, loading, user]);

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) return null;

  // Sort submissions: unrevealed others first (for guessing), then own, then revealed
  const unrevealedOthers = submissions.filter(
    (s) => !s.is_revealed && s.user_id !== user.id
  );
  const ownSubmissions = submissions.filter((s) => s.user_id === user.id);
  const revealedOthers = submissions.filter(
    (s) => s.is_revealed && s.user_id !== user.id
  );
  const sortedSubmissions = [...unrevealedOthers, ...ownSubmissions, ...revealedOthers];

  return (
    <div className={cn(
      "flex flex-col min-h-screen pb-20",
      isPartyMode && intensity > 0.5 ? "party-gradient-intense" : isPartyMode ? "party-gradient" : ""
    )}>
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-xl font-bold">Two Truths & a Lie</h1>
          </div>
          {(canAct || !userSubmission) && (
            <Link href="/two-truths/submit">
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Submit
              </Button>
            </Link>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 p-4 space-y-4">
        <p className="text-sm text-muted-foreground">
          Guess which statement is the lie! +10 points for correct guesses.
        </p>

        {sortedSubmissions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              No submissions yet. Be the first!
            </p>
            <Link href="/two-truths/submit">
              <Button>Create Submission</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedSubmissions.map((submission) => (
              <TwoTruthsCard
                key={submission.id}
                submission={submission}
                currentUserId={user.id}
                onGuess={(index) => makeGuess(submission.id, index)}
                onReact={(emoji) => addReaction(submission.id, emoji)}
                hasGuessed={hasGuessed(submission.id)}
                getTimeUntilReveal={getTimeUntilReveal}
                isOwn={submission.user_id === user.id}
              />
            ))}
          </div>
        )}
      </main>

      <MobileNav />
    </div>
  );
}
