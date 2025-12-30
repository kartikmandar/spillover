'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSound } from '@/providers/sound-provider';
import { CooldownTimer } from './cooldown-timer';
import { COOLDOWNS } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface TwoTruthsSubmitProps {
  onSubmit: (
    statement1: string,
    statement2: string,
    statement3: string,
    lieIndex: 1 | 2 | 3
  ) => Promise<{ error?: string }>;
  lastSubmissionTime: Date | null;
  disabled?: boolean;
}

export function TwoTruthsSubmit({
  onSubmit,
  lastSubmissionTime,
  disabled = false,
}: TwoTruthsSubmitProps) {
  const [statements, setStatements] = useState(['', '', '']);
  const [lieIndex, setLieIndex] = useState<1 | 2 | 3 | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { playSound } = useSound();
  const textareaRefs = useRef<(HTMLTextAreaElement | null)[]>([null, null, null]);

  // Auto-resize textareas as content grows
  const resizeTextarea = useCallback((index: number): void => {
    const textarea = textareaRefs.current[index];
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, []);

  useEffect(() => {
    statements.forEach((_, index) => resizeTextarea(index));
  }, [statements, resizeTextarea]);

  const handleStatementChange = (index: number, value: string): void => {
    const newStatements = [...statements];
    newStatements[index] = value;
    setStatements(newStatements);
  };

  const handleSubmit = async (): Promise<void> => {
    if (lieIndex === null || loading) return;

    const filledStatements = statements.filter((s) => s.trim().length > 0);
    if (filledStatements.length !== 3) {
      setError('Please fill in all three statements');
      return;
    }

    setLoading(true);
    setError('');

    const { error: submitError } = await onSubmit(
      statements[0].trim(),
      statements[1].trim(),
      statements[2].trim(),
      lieIndex
    );

    if (submitError) {
      setError(submitError);
    } else {
      setStatements(['', '', '']);
      setLieIndex(null);
      playSound('submit');
    }
    setLoading(false);
  };

  const isValid =
    statements.every((s) => s.trim().length >= 3) && lieIndex !== null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Two Truths and a Lie</CardTitle>
        <p className="text-sm text-muted-foreground">
          Enter 3 statements about yourself. Mark which one is the lie.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <CooldownTimer
          lastActionTime={lastSubmissionTime}
          cooldownMs={COOLDOWNS.TWO_TRUTHS_SUBMIT}
        />

        {[0, 1, 2].map((index) => (
          <div key={index} className="space-y-2">
            <div className="flex gap-2">
              <span className="font-mono text-sm text-muted-foreground w-6 pt-2">
                {index + 1}.
              </span>
              <Textarea
                ref={(el) => { textareaRefs.current[index] = el; }}
                placeholder={`Statement ${index + 1}`}
                value={statements[index]}
                onChange={(e) => handleStatementChange(index, e.target.value)}
                maxLength={150}
                className="flex-1 min-h-[40px] max-h-[120px]"
                disabled={disabled || loading}
                rows={1}
              />
            </div>
            <div className="flex items-center gap-2 pl-8">
              <Button
                type="button"
                variant={lieIndex === index + 1 ? 'default' : 'outline'}
                size="sm"
                onClick={() => setLieIndex((index + 1) as 1 | 2 | 3)}
                disabled={disabled || loading}
                className={cn(
                  'text-xs',
                  lieIndex === index + 1 && 'bg-red-600 hover:bg-red-700'
                )}
              >
                {lieIndex === index + 1 ? 'This is the lie' : 'Mark as lie'}
              </Button>
              <span className="text-xs text-muted-foreground">
                {statements[index].length}/150
              </span>
            </div>
          </div>
        ))}

        <div className="pt-2">
          <Button
            onClick={handleSubmit}
            disabled={disabled || loading || !isValid}
            className="w-full"
          >
            {loading ? 'Submitting...' : 'Submit (reveals in 5 min)'}
          </Button>
        </div>

        {error && <p className="text-destructive text-sm text-center">{error}</p>}

        <p className="text-xs text-muted-foreground text-center">
          Your name will be shown when the answer is revealed.
        </p>
      </CardContent>
    </Card>
  );
}
