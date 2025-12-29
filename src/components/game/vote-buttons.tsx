'use client';

import { useState } from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSound } from '@/providers/sound-provider';
import { cn } from '@/lib/utils';

interface VoteButtonsProps {
  agreeCount: number;
  disagreeCount: number;
  userVote: 'agree' | 'disagree' | undefined;
  hasVoted: boolean;
  onVote: (voteType: 'agree' | 'disagree') => Promise<{ error?: string }>;
}

export function VoteButtons({
  agreeCount,
  disagreeCount,
  userVote,
  hasVoted,
  onVote,
}: VoteButtonsProps) {
  const [loading, setLoading] = useState<'agree' | 'disagree' | null>(null);
  const { playSound } = useSound();

  const handleVote = async (voteType: 'agree' | 'disagree'): Promise<void> => {
    // If already voted for this option, do nothing
    if (userVote === voteType) return;

    setLoading(voteType);
    const { error } = await onVote(voteType);
    if (!error) {
      playSound('vote');
    }
    setLoading(null);
  };

  const totalVotes = agreeCount + disagreeCount;
  const agreePercent = totalVotes > 0 ? Math.round((agreeCount / totalVotes) * 100) : 50;
  const disagreePercent = totalVotes > 0 ? Math.round((disagreeCount / totalVotes) * 100) : 50;

  return (
    <div className="flex gap-2">
      <Button
        variant={userVote === 'agree' ? 'default' : 'outline'}
        size="sm"
        className={cn(
          'flex-1 gap-2',
          userVote === 'agree' && 'bg-green-600 hover:bg-green-700'
        )}
        onClick={() => handleVote('agree')}
        disabled={userVote === 'agree' || loading !== null}
      >
        <ThumbsUp className="h-4 w-4" />
        <span>{agreeCount}</span>
        {totalVotes > 0 && (
          <span className="text-xs opacity-70">({agreePercent}%)</span>
        )}
      </Button>
      <Button
        variant={userVote === 'disagree' ? 'default' : 'outline'}
        size="sm"
        className={cn(
          'flex-1 gap-2',
          userVote === 'disagree' && 'bg-red-600 hover:bg-red-700'
        )}
        onClick={() => handleVote('disagree')}
        disabled={userVote === 'disagree' || loading !== null}
      >
        <ThumbsDown className="h-4 w-4" />
        <span>{disagreeCount}</span>
        {totalVotes > 0 && (
          <span className="text-xs opacity-70">({disagreePercent}%)</span>
        )}
      </Button>
    </div>
  );
}
