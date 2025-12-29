'use client';

import { Trophy, Medal } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { Profile } from '@/types';

interface LeaderboardProps {
  profiles: Profile[];
  currentUserId: string | undefined;
}

export function Leaderboard({ profiles, currentUserId }: LeaderboardProps) {
  // Sort by score descending
  const sortedProfiles = [...profiles].sort((a, b) => b.score - a.score);

  const getRankIcon = (index: number): React.ReactNode => {
    switch (index) {
      case 0:
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 1:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 2:
        return <Medal className="h-5 w-5 text-amber-600" />;
      default:
        return (
          <span className="w-5 text-center text-sm text-muted-foreground">
            {index + 1}
          </span>
        );
    }
  };

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (sortedProfiles.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No players yet. Be the first to earn points!
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {sortedProfiles.map((profile, index) => {
        const isCurrentUser = profile.id === currentUserId;

        return (
          <Card
            key={profile.id}
            className={cn(
              'transition-colors',
              isCurrentUser && 'border-primary bg-primary/5',
              index < 3 && 'border-yellow-500/30'
            )}
          >
            <CardContent className="flex items-center gap-4 py-3">
              <div className="flex items-center justify-center w-8">
                {getRankIcon(index)}
              </div>
              <Avatar className="h-10 w-10">
                <AvatarFallback
                  className={cn(
                    index === 0 && 'bg-yellow-500/20 text-yellow-500',
                    index === 1 && 'bg-gray-400/20 text-gray-400',
                    index === 2 && 'bg-amber-600/20 text-amber-600'
                  )}
                >
                  {getInitials(profile.display_name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    'font-medium truncate',
                    isCurrentUser && 'text-primary'
                  )}
                >
                  {profile.display_name}
                  {isCurrentUser && (
                    <span className="text-xs ml-2 text-muted-foreground">
                      (You)
                    </span>
                  )}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold tabular-nums">{profile.score}</p>
                <p className="text-xs text-muted-foreground">points</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
