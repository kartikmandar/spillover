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

        {/* About the Games */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">About Spillover</h2>
          <Card>
            <CardContent className="pt-4 pb-4">
              <p className="text-sm text-muted-foreground">
                Welcome to the RRI New Year 2026 party games! These games are designed
                to help us get to know each other better, share some laughs, and discover
                surprising things about our colleagues. Play throughout the party and
                see who tops the leaderboard by midnight!
              </p>
            </CardContent>
          </Card>
        </div>

        {/* How to Play */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">How to Play</h2>

          {/* Hot Takes */}
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="space-y-2">
                <p className="font-medium text-orange-500 flex items-center gap-2">
                  <Flame className="h-4 w-4" /> Hot Takes
                </p>
                <p className="text-sm text-muted-foreground">
                  Share your spiciest, most controversial opinions anonymously!
                  This is your chance to say what you really think without anyone
                  knowing it&apos;s you.
                </p>
                <div className="text-sm space-y-1 pt-2">
                  <p className="font-medium">How it works:</p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    <li>Post an anonymous hot take (up to 500 characters)</li>
                    <li>Vote &quot;Agree&quot; or &quot;Disagree&quot; on others&apos; takes</li>
                    <li>React with emojis to show how you feel</li>
                    <li>5-minute cooldown between posts</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Two Truths */}
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="space-y-2">
                <p className="font-medium text-blue-500 flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" /> Two Truths & a Lie
                </p>
                <p className="text-sm text-muted-foreground">
                  The classic party game! Share three statements about yourself — two
                  truths and one lie. Others try to guess which one is the lie.
                  Learn fun facts about your colleagues!
                </p>
                <div className="text-sm space-y-1 pt-2">
                  <p className="font-medium">How it works:</p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    <li>Submit 3 statements and mark which one is your lie</li>
                    <li>Others have 5 minutes to guess before the reveal</li>
                    <li>Your name is shown only after the reveal</li>
                    <li>You can only have one active submission at a time</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Scoring */}
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="space-y-2">
                <p className="font-medium text-yellow-500 flex items-center gap-2">
                  <Trophy className="h-4 w-4" /> Scoring & Leaderboard
                </p>
                <p className="text-sm text-muted-foreground">
                  Compete to top the leaderboard by earning points!
                </p>
                <div className="text-sm space-y-1 pt-2">
                  <p className="font-medium">How to earn points:</p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    <li><span className="text-green-500 font-medium">+10 points</span> — Correctly guess someone&apos;s lie</li>
                  </ul>
                </div>
                <p className="text-xs text-muted-foreground pt-2 italic">
                  Tip: The trickier your lie, the fewer people will guess correctly!
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <MobileNav />
    </div>
  );
}

function cn(...classes: (string | undefined | false)[]): string {
  return classes.filter(Boolean).join(' ');
}
