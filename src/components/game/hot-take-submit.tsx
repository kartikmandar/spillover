'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSound } from '@/providers/sound-provider';
import { CooldownTimer } from './cooldown-timer';
import { COOLDOWNS } from '@/lib/constants';

interface HotTakeSubmitProps {
  onSubmit: (content: string) => Promise<{ error?: string }>;
  lastSubmissionTime: Date | null;
  disabled?: boolean;
}

export function HotTakeSubmit({
  onSubmit,
  lastSubmissionTime,
  disabled = false,
}: HotTakeSubmitProps) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { playSound } = useSound();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea as content grows
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, [content]);

  const handleSubmit = async (): Promise<void> => {
    if (!content.trim() || loading) return;

    setLoading(true);
    setError('');

    const { error: submitError } = await onSubmit(content.trim());

    if (submitError) {
      setError(submitError);
    } else {
      setContent('');
      playSound('submit');
    }
    setLoading(false);
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Drop a Hot Take</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <CooldownTimer
          lastActionTime={lastSubmissionTime}
          cooldownMs={COOLDOWNS.HOT_TAKE_SUBMIT}
        />

        <Textarea
          ref={textareaRef}
          placeholder="Share your spiciest opinion..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          maxLength={500}
          className="min-h-[48px] max-h-[200px]"
          disabled={disabled || loading}
          rows={1}
        />

        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {content.length}/500
          </span>
          <Button
            onClick={handleSubmit}
            disabled={
              disabled ||
              loading ||
              content.trim().length < 3 ||
              content.length > 500
            }
          >
            {loading ? 'Posting...' : 'Post Anonymously'}
          </Button>
        </div>

        {error && <p className="text-destructive text-sm">{error}</p>}
      </CardContent>
    </Card>
  );
}
