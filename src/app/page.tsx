'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabase } from '@/providers/supabase-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { NewYearTimer } from '@/components/countdown/new-year-timer';

type Step = 'phone' | 'otp' | 'name';

export default function LoginPage() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [step, setStep] = useState<Step>('phone');
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

  const formatPhone = (p: string): string =>
    p.startsWith('+') ? p : `+91${p}`;

  const sendOTP = async (): Promise<void> => {
    setLoading(true);
    setError('');

    const { error: otpError } = await supabase.auth.signInWithOtp({
      phone: formatPhone(phone),
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
      phone: formatPhone(phone),
      token: otp,
      type: 'sms',
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
      setStep('phone');
      setLoading(false);
      return;
    }

    const { error: saveError } = await supabase.from('profiles').upsert({
      id: currentUser.id,
      phone: formatPhone(phone),
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

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 gap-8">
      {/* New Year Countdown at top */}
      <NewYearTimer variant="compact" />

      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl">Spillover</CardTitle>
          <p className="text-muted-foreground text-sm">
            RRI Astrophysics NYE 2026
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === 'phone' && (
            <>
              <Input
                type="tel"
                placeholder="Phone (e.g., 9876543210)"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                className="text-lg h-12"
                maxLength={10}
              />
              <Button
                onClick={sendOTP}
                disabled={loading || phone.length < 10}
                className="w-full h-12 text-lg"
              >
                {loading ? 'Sending...' : 'Send OTP'}
              </Button>
            </>
          )}

          {step === 'otp' && (
            <>
              <p className="text-sm text-muted-foreground text-center">
                Enter the 6-digit code sent to +91{phone}
              </p>
              <Input
                type="text"
                inputMode="numeric"
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                className="text-lg h-12 text-center tracking-widest"
                maxLength={6}
              />
              <Button
                onClick={verifyOTP}
                disabled={loading || otp.length !== 6}
                className="w-full h-12 text-lg"
              >
                {loading ? 'Verifying...' : 'Verify'}
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setStep('phone');
                  setOtp('');
                }}
                className="w-full"
              >
                Change number
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
