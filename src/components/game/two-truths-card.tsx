'use client';

import { useState, useEffect, useRef } from 'react';
import { formatDistanceToNow, differenceInMinutes } from 'date-fns';
import { Clock, CheckCircle, XCircle, User } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmojiReactions } from './emoji-reactions';
import { useSound } from '@/providers/sound-provider';
import { cn } from '@/lib/utils';
import type { TwoTruthsSubmission, TwoTruthsReaction } from '@/types';

interface TwoTruthsCardProps {
  submission: TwoTruthsSubmission;
  currentUserId: string | undefined;
  onGuess: (guessedLieIndex: 1 | 2 | 3) => Promise<{ error?: string }>;
  onReact: (emoji: string) => Promise<{ error?: string }>;
  hasGuessed: boolean;
  getTimeUntilReveal: (revealAt: string) => string | null;
  isOwn?: boolean;
}

export function TwoTruthsCard({
  submission,
  currentUserId,
  onGuess,
  onReact,
  hasGuessed,
  getTimeUntilReveal,
  isOwn = false,
}: TwoTruthsCardProps) {
  const [loading, setLoading] = useState<number | null>(null);
  const [revealTime, setRevealTime] = useState<string | null>(null);
  const { playSound } = useSound();

  const statements = [
    { index: 1, text: submission.statement_1 },
    { index: 2, text: submission.statement_2 },
    { index: 3, text: submission.statement_3 },
  ] as const;

  const reactions = submission.reactions || [];
  const guesses = submission.guesses || [];
  const displayName = submission.profile?.display_name || 'Anonymous';

  // Get user's guess
  const userGuess = guesses.find((g) => g.user_id === currentUserId);

  // Update reveal time every second
  useEffect(() => {
    if (submission.is_revealed) {
      setRevealTime(null);
      return;
    }

    const updateTime = (): void => {
      setRevealTime(getTimeUntilReveal(submission.reveal_at));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [submission.is_revealed, submission.reveal_at, getTimeUntilReveal]);

  const handleGuess = async (index: 1 | 2 | 3): Promise<void> => {
    if (hasGuessed || isOwn || submission.is_revealed) return;

    setLoading(index);
    const { error } = await onGuess(index);
    if (!error) {
      playSound('vote');
    }
    setLoading(null);
  };

  // Track if we've already played the reveal sound for this submission
  const hasPlayedRevealSound = useRef(submission.is_revealed);

  // Play reveal sound only when submission transitions to revealed
  useEffect(() => {
    if (submission.is_revealed && !hasPlayedRevealSound.current && userGuess) {
      playSound('reveal');
      hasPlayedRevealSound.current = true;
    }
  }, [submission.is_revealed, userGuess, playSound]);

  const timeAgo = formatDistanceToNow(new Date(submission.created_at), {
    addSuffix: true,
  });

  // Check if card is new (created within last 3 minutes)
  const isNew = differenceInMinutes(new Date(), new Date(submission.created_at)) < 3;

  // Count guesses per statement
  const getGuessCount = (index: number): number =>
    guesses.filter((g) => g.guessed_lie_index === index).length;

  return (
    <Card className={cn(
      isOwn && 'border-primary/50',
      isNew && !submission.is_revealed && 'card-new-glow'
    )}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{displayName}</span>
            {isOwn && (
              <Badge variant="secondary" className="text-xs">
                You
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!submission.is_revealed && revealTime && (
              <Badge variant="outline" className="gap-1">
                <Clock className="h-3 w-3" />
                {revealTime}
              </Badge>
            )}
            {submission.is_revealed && (
              <Badge variant="default" className="bg-green-600">
                Revealed
              </Badge>
            )}
          </div>
        </div>
        <span className="text-xs text-muted-foreground">{timeAgo}</span>
      </CardHeader>

      <CardContent className="space-y-2">
        {statements.map(({ index, text }) => {
          const isLie = submission.is_revealed && submission.lie_index === index;
          const isUserGuess = userGuess?.guessed_lie_index === index;
          const guessCount = getGuessCount(index);

          return (
            <Button
              key={index}
              variant={isUserGuess ? 'secondary' : 'outline'}
              className={cn(
                'w-full h-auto py-3 px-4 text-left justify-start whitespace-normal',
                isLie && 'border-red-500 bg-red-500/10',
                isUserGuess && !submission.is_revealed && 'border-primary',
                submission.is_revealed && !isLie && 'border-green-500/50'
              )}
              onClick={() => handleGuess(index as 1 | 2 | 3)}
              disabled={
                hasGuessed ||
                isOwn ||
                submission.is_revealed ||
                loading !== null
              }
            >
              <div className="flex items-start gap-3 w-full">
                <span className="font-mono text-sm text-muted-foreground">
                  {index}.
                </span>
                <span className="flex-1">{text}</span>
                {submission.is_revealed && (
                  <div className="flex items-center gap-2">
                    {isLie ? (
                      <XCircle className="h-5 w-5 text-red-500 shrink-0" />
                    ) : (
                      <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
                    )}
                    {guessCount > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {guessCount}
                      </Badge>
                    )}
                  </div>
                )}
                {!submission.is_revealed && isUserGuess && (
                  <Badge variant="secondary" className="text-xs">
                    Your guess
                  </Badge>
                )}
              </div>
            </Button>
          );
        })}

        {/* Show result if revealed and user guessed */}
        {submission.is_revealed && userGuess && (
          <div
            className={cn(
              'p-3 rounded-lg text-sm font-medium text-center',
              userGuess.is_correct
                ? 'bg-green-500/20 text-green-500'
                : 'bg-red-500/20 text-red-500'
            )}
          >
            {userGuess.is_correct
              ? `Correct! +${userGuess.points_earned} points`
              : 'Wrong guess!'}
          </div>
        )}

        {/* Show message if own submission */}
        {isOwn && !submission.is_revealed && (
          <p className="text-xs text-muted-foreground text-center">
            This is your submission. You can&apos;t guess on it.
          </p>
        )}
      </CardContent>

      <CardFooter>
        <EmojiReactions
          reactions={reactions as TwoTruthsReaction[]}
          currentUserId={currentUserId}
          onReact={onReact}
        />
      </CardFooter>
    </Card>
  );
}
