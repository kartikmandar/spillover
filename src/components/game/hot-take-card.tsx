'use client';

import { formatDistanceToNow } from 'date-fns';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { VoteButtons } from './vote-buttons';
import { EmojiReactions } from './emoji-reactions';
import type { HotTake, HotTakeVote, HotTakeReaction } from '@/types';

interface HotTakeCardProps {
  hotTake: HotTake;
  currentUserId: string | undefined;
  onVote: (voteType: 'agree' | 'disagree') => Promise<{ error?: string }>;
  onReact: (emoji: string) => Promise<{ error?: string }>;
  hasVoted: boolean;
  userVote: 'agree' | 'disagree' | undefined;
  isOwn?: boolean;
}

export function HotTakeCard({
  hotTake,
  currentUserId,
  onVote,
  onReact,
  hasVoted,
  userVote,
  isOwn = false,
}: HotTakeCardProps) {
  const votes = hotTake.votes || [];
  const reactions = hotTake.reactions || [];

  const agreeCount = votes.filter((v: HotTakeVote) => v.vote === 'agree').length;
  const disagreeCount = votes.filter((v: HotTakeVote) => v.vote === 'disagree').length;

  const timeAgo = formatDistanceToNow(new Date(hotTake.created_at), {
    addSuffix: true,
  });

  return (
    <Card className={isOwn ? 'border-primary/50' : ''}>
      <CardContent className="pt-4 pb-2">
        <p className="text-base leading-relaxed">{hotTake.content}</p>
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-muted-foreground">{timeAgo}</span>
          {isOwn && (
            <span className="text-xs text-primary font-medium">Your take</span>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-3 pt-0">
        <VoteButtons
          agreeCount={agreeCount}
          disagreeCount={disagreeCount}
          userVote={userVote}
          hasVoted={hasVoted}
          onVote={onVote}
          isOwn={isOwn}
        />
        <EmojiReactions
          reactions={reactions as HotTakeReaction[]}
          currentUserId={currentUserId}
          onReact={onReact}
        />
      </CardFooter>
    </Card>
  );
}
