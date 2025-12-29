'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useSupabase } from '@/providers/supabase-provider';
import { useTwoTruths } from '@/hooks/use-two-truths';
import { useCooldown } from '@/hooks/use-cooldown';
import { Button } from '@/components/ui/button';
import { TwoTruthsSubmit } from '@/components/game/two-truths-submit';
import { MobileNav } from '@/components/layout/mobile-nav';
import { COOLDOWNS } from '@/lib/constants';

export default function TwoTruthsSubmitPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useSupabase();
  const { submitTwoTruths, getLastSubmissionTime, getUserSubmission } =
    useTwoTruths();

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

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) return null;

  const handleSubmit = async (
    statement1: string,
    statement2: string,
    statement3: string,
    lieIndex: 1 | 2 | 3
  ): Promise<{ error?: string }> => {
    const result = await submitTwoTruths(
      statement1,
      statement2,
      statement3,
      lieIndex
    );
    if (!result.error) {
      router.push('/two-truths');
    }
    return result;
  };

  // If user already has an active (unrevealed) submission
  const hasActiveSubmission = userSubmission && !userSubmission.is_revealed;

  return (
    <div className="flex flex-col min-h-screen pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="flex items-center gap-3 p-4">
          <Link href="/two-truths">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold">Submit Two Truths</h1>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 p-4">
        {hasActiveSubmission ? (
          <div className="text-center py-12 space-y-4">
            <p className="text-muted-foreground">
              You already have an active submission that hasn&apos;t been
              revealed yet.
            </p>
            <p className="text-sm text-muted-foreground">
              Wait for it to be revealed before submitting another one.
            </p>
            <Link href="/two-truths">
              <Button>Back to Game</Button>
            </Link>
          </div>
        ) : (
          <TwoTruthsSubmit
            onSubmit={handleSubmit}
            lastSubmissionTime={lastSubmissionTime}
            disabled={!canAct}
          />
        )}
      </main>

      <MobileNav />
    </div>
  );
}
