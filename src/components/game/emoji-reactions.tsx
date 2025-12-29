'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { REACTION_EMOJIS } from '@/lib/constants';
import { useSound } from '@/providers/sound-provider';
import { cn } from '@/lib/utils';

interface ReactionData {
  emoji: string;
  count: number;
  hasReacted: boolean;
}

interface EmojiReactionsProps {
  reactions: Array<{ emoji: string; user_id: string }>;
  currentUserId: string | undefined;
  onReact: (emoji: string) => Promise<{ error?: string }>;
}

export function EmojiReactions({
  reactions,
  currentUserId,
  onReact,
}: EmojiReactionsProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const { playSound } = useSound();

  // Aggregate reactions
  const reactionData: ReactionData[] = REACTION_EMOJIS.map((emoji) => ({
    emoji,
    count: reactions.filter((r) => r.emoji === emoji).length,
    hasReacted: reactions.some(
      (r) => r.emoji === emoji && r.user_id === currentUserId
    ),
  }));

  const handleReact = async (emoji: string): Promise<void> => {
    setLoading(emoji);
    const { error } = await onReact(emoji);
    if (!error) {
      playSound('reaction');
    }
    setLoading(null);
  };

  return (
    <div className="flex flex-wrap gap-1">
      {reactionData.map(({ emoji, count, hasReacted }) => (
        <Button
          key={emoji}
          variant={hasReacted ? 'secondary' : 'ghost'}
          size="sm"
          className={cn(
            'h-8 px-2 text-base',
            hasReacted && 'bg-primary/20',
            count === 0 && 'opacity-50'
          )}
          onClick={() => handleReact(emoji)}
          disabled={loading === emoji}
        >
          {emoji} {count > 0 && <span className="ml-1 text-xs">{count}</span>}
        </Button>
      ))}
    </div>
  );
}
