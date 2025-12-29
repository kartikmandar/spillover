'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, User } from 'lucide-react';
import { useSupabase } from '@/providers/supabase-provider';
import { useHotTakes } from '@/hooks/use-hot-takes';
import { useCooldown } from '@/hooks/use-cooldown';
import { Button } from '@/components/ui/button';
import { HotTakeCard } from '@/components/game/hot-take-card';
import { HotTakeSubmit } from '@/components/game/hot-take-submit';
import { MobileNav } from '@/components/layout/mobile-nav';
import { COOLDOWNS } from '@/lib/constants';

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

  const lastSubmissionTime = getLastSubmissionTime();
  const { canAct } = useCooldown(lastSubmissionTime, COOLDOWNS.HOT_TAKE_SUBMIT);

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
    <div className="flex flex-col min-h-screen pb-20">
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
