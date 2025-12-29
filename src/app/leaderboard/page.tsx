'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { useSupabase } from '@/providers/supabase-provider';
import { Button } from '@/components/ui/button';
import { Leaderboard } from '@/components/game/leaderboard';
import { MobileNav } from '@/components/layout/mobile-nav';
import type { Profile } from '@/types';

export default function LeaderboardPage() {
  const router = useRouter();
  const { supabase, user, loading: authLoading } = useSupabase();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProfiles = useCallback(async (): Promise<void> => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('score', { ascending: false });

    if (data) {
      setProfiles(data as Profile[]);
    }
    setLoading(false);
    setRefreshing(false);
  }, [supabase]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
      return;
    }

    fetchProfiles();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('leaderboard_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        () => fetchProfiles()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, authLoading, router, supabase, fetchProfiles]);

  const handleRefresh = (): void => {
    setRefreshing(true);
    fetchProfiles();
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) return null;

  // Find current user's rank
  const sortedProfiles = [...profiles].sort((a, b) => b.score - a.score);
  const currentUserRank =
    sortedProfiles.findIndex((p) => p.id === user.id) + 1;
  const currentUserProfile = profiles.find((p) => p.id === user.id);

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
            <h1 className="text-xl font-bold">Leaderboard</h1>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw
              className={cn('h-5 w-5', refreshing && 'animate-spin')}
            />
          </Button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 p-4 space-y-4">
        {/* User's current rank */}
        {currentUserProfile && (
          <div className="bg-primary/10 rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground">Your Rank</p>
            <p className="text-3xl font-bold">#{currentUserRank}</p>
            <p className="text-lg">
              {currentUserProfile.score} point
              {currentUserProfile.score !== 1 ? 's' : ''}
            </p>
          </div>
        )}

        {/* Leaderboard */}
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">
            Rankings ({profiles.length} players)
          </h2>
          <Leaderboard profiles={profiles} currentUserId={user.id} />
        </div>
      </main>

      <MobileNav />
    </div>
  );
}

function cn(...classes: (string | undefined | false)[]): string {
  return classes.filter(Boolean).join(' ');
}
