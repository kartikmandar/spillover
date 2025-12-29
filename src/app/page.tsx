'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useSupabase } from '@/providers/supabase-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { NewYearTimer } from '@/components/countdown/new-year-timer';

type Step = 'email' | 'otp' | 'name';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [step, setStep] = useState<Step>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { supabase, user, loading: authLoading } = useSupabase();

  // Redirect if already logged in
  useEffect(() => {
    const checkProfile = async (): Promise<void> => {
      if (authLoading) return;

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('id', user.id)
          .single();

        if (profile?.display_name) {
          router.push('/dashboard');
        } else {
          setStep('name');
        }
      }
    };

    checkProfile();
  }, [user, authLoading, supabase, router]);

  const sendOTP = async (): Promise<void> => {
    setLoading(true);
    setError('');

    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
    });

    if (otpError) {
      setError(otpError.message);
    } else {
      setStep('otp');
    }
    setLoading(false);
  };

  const verifyOTP = async (): Promise<void> => {
    setLoading(true);
    setError('');

    const { data, error: verifyError } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: otp,
      type: 'email',
    });

    if (verifyError) {
      setError(verifyError.message);
      setLoading(false);
      return;
    }

    // Check if profile exists
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', data.user?.id)
      .single();

    if (profile?.display_name) {
      // Existing user, go to dashboard
      router.push('/dashboard');
    } else {
      // New user, need to set name
      setStep('name');
    }
    setLoading(false);
  };

  const saveName = async (): Promise<void> => {
    setLoading(true);
    setError('');

    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    if (!currentUser) {
      setError('Session expired, please try again');
      setStep('email');
      setLoading(false);
      return;
    }

    const { error: saveError } = await supabase.from('profiles').upsert({
      id: currentUser.id,
      email: email.trim().toLowerCase(),
      display_name: name.trim(),
    });

    if (saveError) {
      setError(saveError.message);
    } else {
      router.push('/dashboard');
    }
    setLoading(false);
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 gap-8">
      {/* New Year Countdown at top */}
      <NewYearTimer variant="compact" />

      <Card className="w-full max-w-sm">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <Image
              src="/icon-192.png"
              alt="Spillover"
              width={120}
              height={120}
              className="rounded-2xl"
              priority
            />
          </div>
          <div>
            <CardTitle className="text-3xl">Spillover</CardTitle>
            <p className="text-muted-foreground text-sm">
              RRI Astrophysics NYE 2026
            </p>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === 'email' && (
            <>
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="text-lg h-12"
              />
              <Button
                onClick={sendOTP}
                disabled={loading || !isValidEmail}
                className="w-full h-12 text-lg"
              >
                {loading ? 'Sending...' : 'Send Code'}
              </Button>
            </>
          )}

          {step === 'otp' && (
            <>
              <p className="text-sm text-muted-foreground text-center">
                Enter the code sent to {email}
              </p>
              <Input
                type="text"
                inputMode="numeric"
                placeholder="Enter code"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                className="text-lg h-12 text-center tracking-widest"
                maxLength={8}
              />
              <Button
                onClick={verifyOTP}
                disabled={loading || otp.length < 6}
                className="w-full h-12 text-lg"
              >
                {loading ? 'Verifying...' : 'Verify'}
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setStep('email');
                  setOtp('');
                }}
                className="w-full"
              >
                Change email
              </Button>
            </>
          )}

          {step === 'name' && (
            <>
              <p className="text-sm text-muted-foreground text-center">
                What should we call you?
              </p>
              <Input
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="text-lg h-12"
                maxLength={30}
              />
              <p className="text-xs text-muted-foreground">
                Anonymous in Hot Takes - Shown in Two Truths game
              </p>
              <Button
                onClick={saveName}
                disabled={loading || name.trim().length < 2}
                className="w-full h-12 text-lg"
              >
                {loading ? 'Saving...' : "Let's Go!"}
              </Button>
            </>
          )}

          {error && (
            <p className="text-destructive text-sm text-center">{error}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
