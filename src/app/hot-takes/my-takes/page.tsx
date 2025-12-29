'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useSupabase } from '@/providers/supabase-provider';
import { useHotTakes } from '@/hooks/use-hot-takes';
import { Button } from '@/components/ui/button';
import { HotTakeCard } from '@/components/game/hot-take-card';
import { MobileNav } from '@/components/layout/mobile-nav';

export default function MyTakesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useSupabase();
  const {
    myHotTakes,
    loading,
    vote,
    addReaction,
    hasVoted,
    getUserVote,
  } = useHotTakes();

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
        <div className="flex items-center gap-3 p-4">
          <Link href="/hot-takes">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold">My Hot Takes</h1>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 p-4 space-y-4">
        <p className="text-sm text-muted-foreground">
          Only you can see that these are your takes. They appear anonymous to
          everyone else.
        </p>

        {myHotTakes.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              You haven&apos;t posted any hot takes yet.
            </p>
            <Link href="/hot-takes">
              <Button>Drop Your First Take</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {myHotTakes.map((hotTake) => (
              <HotTakeCard
                key={hotTake.id}
                hotTake={hotTake}
                currentUserId={user.id}
                onVote={(voteType) => vote(hotTake.id, voteType)}
                onReact={(emoji) => addReaction(hotTake.id, emoji)}
                hasVoted={hasVoted(hotTake.id)}
                userVote={getUserVote(hotTake.id)}
                isOwn={true}
              />
            ))}
          </div>
        )}
      </main>

      <MobileNav />
    </div>
  );
}
