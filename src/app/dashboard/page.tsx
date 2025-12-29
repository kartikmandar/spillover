'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Flame, MessageCircle, Trophy, LogOut } from 'lucide-react';
import { useSupabase } from '@/providers/supabase-provider';
import { useUser } from '@/hooks/use-user';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { NewYearTimer } from '@/components/countdown/new-year-timer';
import { MobileNav } from '@/components/layout/mobile-nav';

const gameCards = [
  {
    href: '/hot-takes',
    icon: Flame,
    title: 'Hot Takes',
    description: 'Share anonymous spicy opinions',
    color: 'text-orange-500',
  },
  {
    href: '/two-truths',
    icon: MessageCircle,
    title: 'Two Truths & a Lie',
    description: 'Can they spot your lie?',
    color: 'text-blue-500',
  },
  {
    href: '/leaderboard',
    icon: Trophy,
    title: 'Leaderboard',
    description: 'See who is winning',
    color: 'text-yellow-500',
  },
];

export default function DashboardPage() {
  const router = useRouter();
  const { supabase, user, loading: authLoading } = useSupabase();
  const { profile, loading: profileLoading } = useUser();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  const handleLogout = async (): Promise<void> => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (authLoading || profileLoading) {
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
          <div>
            <h1 className="text-xl font-bold">Spillover</h1>
            <p className="text-sm text-muted-foreground">
              Hey, {profile?.display_name || 'there'}!
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 p-4 space-y-6">
        {/* Countdown */}
        <Card>
          <CardContent className="pt-6">
            <NewYearTimer variant="full" />
          </CardContent>
        </Card>

        {/* Game cards */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Party Games</h2>
          <div className="grid gap-4">
            {gameCards.map(({ href, icon: Icon, title, description, color }) => (
              <Link key={href} href={href}>
                <Card className="hover:bg-accent transition-colors">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-3">
                      <Icon className={cn('h-6 w-6', color)} />
                      <CardTitle className="text-lg">{title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{description}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Score display */}
        {profile && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Your Score</span>
                <span className="text-2xl font-bold">{profile.score}</span>
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      <MobileNav />
    </div>
  );
}

function cn(...classes: (string | undefined | false)[]): string {
  return classes.filter(Boolean).join(' ');
}
