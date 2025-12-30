'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, User, Flame } from 'lucide-react';
import { useSupabase } from '@/providers/supabase-provider';
import { useHotTakes } from '@/hooks/use-hot-takes';
import { useCooldown } from '@/hooks/use-cooldown';
import { usePartyMode } from '@/hooks/use-party-mode';
import { Button } from '@/components/ui/button';
import { HotTakeCard } from '@/components/game/hot-take-card';
import { HotTakeSubmit } from '@/components/game/hot-take-submit';
import { MobileNav } from '@/components/layout/mobile-nav';
import { COOLDOWNS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { HotTake } from '@/types';

export default function HotTakesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useSupabase();
  const {
    hotTakes,
    loading,
    submitHotTake,
    vote,
    addReaction,
    hasVoted,
    getUserVote,
    getLastSubmissionTime,
  } = useHotTakes();
  const { isPartyMode, intensity } = usePartyMode();

  const lastSubmissionTime = getLastSubmissionTime();
  const { canAct } = useCooldown(lastSubmissionTime, COOLDOWNS.HOT_TAKE_SUBMIT);

  // Find the "Hot Take of the Hour" - closest to 50/50 split with at least 4 votes
  const hotTakeOfTheHour = useMemo((): HotTake | null => {
    if (hotTakes.length === 0) return null;

    let bestTake: HotTake | null = null;
    let bestScore = Infinity;

    hotTakes.forEach((take) => {
      const votes = take.votes || [];
      const totalVotes = votes.length;
      if (totalVotes < 4) return; // Need at least 4 votes

      const agreeCount = votes.filter((v) => v.vote === 'agree').length;
      const agreePercent = (agreeCount / totalVotes) * 100;
      const distanceFrom50 = Math.abs(50 - agreePercent);

      if (distanceFrom50 < bestScore) {
        bestScore = distanceFrom50;
        bestTake = take;
      }
    });

    // Only highlight if within 15% of 50/50
    return bestScore <= 15 ? bestTake : null;
  }, [hotTakes]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) return null;

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
            <h1 className="text-xl font-bold">Hot Takes</h1>
          </div>
          <Link href="/hot-takes/my-takes">
            <Button variant="outline" size="sm" className="gap-2">
              <User className="h-4 w-4" />
              My Takes
            </Button>
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 p-4 space-y-4">
        {/* Submit form */}
        <HotTakeSubmit
          onSubmit={submitHotTake}
          lastSubmissionTime={lastSubmissionTime}
          disabled={!canAct}
        />

        {/* Hot Take of the Hour */}
        {hotTakeOfTheHour && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-orange-500">
              <Flame className="h-5 w-5 animate-pulse" />
              <h2 className="text-lg font-semibold">Hot Take of the Hour</h2>
              <Flame className="h-5 w-5 animate-pulse" />
            </div>
            <div className="hot-take-highlight rounded-lg">
              <HotTakeCard
                hotTake={hotTakeOfTheHour}
                currentUserId={user.id}
                onVote={(voteType) => vote(hotTakeOfTheHour.id, voteType)}
                onReact={(emoji) => addReaction(hotTakeOfTheHour.id, emoji)}
                hasVoted={hasVoted(hotTakeOfTheHour.id)}
                userVote={getUserVote(hotTakeOfTheHour.id)}
                isOwn={hotTakeOfTheHour.user_id === user.id}
              />
            </div>
          </div>
        )}

        {/* Hot takes feed */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">
            Feed ({hotTakes.length} takes)
          </h2>
          {hotTakes.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No hot takes yet. Be the first to drop one!
            </p>
          ) : (
            hotTakes.map((hotTake) => (
              <HotTakeCard
                key={hotTake.id}
                hotTake={hotTake}
                currentUserId={user.id}
                onVote={(voteType) => vote(hotTake.id, voteType)}
                onReact={(emoji) => addReaction(hotTake.id, emoji)}
                hasVoted={hasVoted(hotTake.id)}
                userVote={getUserVote(hotTake.id)}
                isOwn={hotTake.user_id === user.id}
              />
            ))
          )}
        </div>
      </main>

      <MobileNav />
    </div>
  );
}
