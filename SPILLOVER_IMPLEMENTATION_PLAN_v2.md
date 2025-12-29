# Spillover - Implementation Plan v2

## Project Overview

**Spillover** is a mobile-first, real-time party game web app for the RRI Astrophysics New Year's Eve gathering (~20-30 people). The app will be deployed as a private Vercel link shared only with attendees.

### Key Design Principles
- **Mobile-first** - All users will access via mobile phones
- **Single instance** - No room system, one private deployment for the party
- **Persistent data** - User data persists across sessions, even after logout
- **Anonymous but accountable** - Hot takes are anonymous publicly, but tied to user accounts privately

### Game Modes

1. **Hot Takes Board** - Anonymous submission and voting on spicy opinions
2. **Two Truths and a Lie** - Classic party game with timed reveals
3. **New Year Countdown** - Live countdown to January 1, 2026

---

## Tech Stack (December 2025)

### Frontend
- **Next.js 16.1** with App Router
  - Cache Components with `'use cache'` directive
  - Turbopack (default bundler)
  - `proxy.ts` for auth
- **React 19** (stable)
- **TypeScript 5.1+** (strict mode)
- **Tailwind CSS v4.1** (CSS-first config)
- **shadcn/ui** components (new-york style)

### Backend & Database
- **Supabase** (PostgreSQL + Realtime + Auth)
- **@supabase/ssr** package

### Audio
- **Howler.js** for sound effects

### Additional
- **canvas-confetti** for New Year celebration
- **lucide-react** for icons
- **sonner** for toast notifications

### Package Manager
- **pnpm** (NOT npm)

### Deployment
- **Vercel** (private link, not indexed)
- **Supabase Cloud** (free tier)

### Requirements
- Node.js 20.9+
- pnpm 8+

---

## Architecture (Simplified - No Rooms)

```
┌─────────────────────────────────────────────────────────────────┐
│                     MOBILE USERS                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │    Phone     │  │    Phone     │  │    Phone     │           │
│  │  (Player 1)  │  │  (Player 2)  │  │  (Player N)  │           │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘           │
└─────────┼─────────────────┼─────────────────┼───────────────────┘
          │                 │                 │
          ▼                 ▼                 ▼
┌─────────────────────────────────────────────────────────────────┐
│              NEXT.JS APP (Private Vercel Link)                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Mobile-First Views                                         │ │
│  │  ├── / (landing + auth)                                    │ │
│  │  ├── /dashboard (game selection + countdown)               │ │
│  │  ├── /hot-takes (submit + vote + react)                    │ │
│  │  ├── /two-truths (submit + guess)                          │ │
│  │  └── /leaderboard (scores + stats)                         │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────┐
│                       SUPABASE                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │   Postgres   │  │   Realtime   │  │     Auth     │           │
│  │   Database   │◄─┤  WebSockets  │  │  (Phone OTP) │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
└─────────────────────────────────────────────────────────────────┘
```

---

## Database Schema (Simplified - No Rooms)

```sql
-- Users table (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone VARCHAR(20) UNIQUE NOT NULL,
  display_name VARCHAR(50) NOT NULL,
  score INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Hot Takes submissions
CREATE TABLE hot_takes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Hot Takes votes (one per user per hot take)
CREATE TABLE hot_take_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hot_take_id UUID REFERENCES hot_takes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  vote VARCHAR(10) NOT NULL CHECK (vote IN ('agree', 'disagree')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(hot_take_id, user_id)  -- One vote per user per hot take
);

-- Hot Takes reactions (emojis)
CREATE TABLE hot_take_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hot_take_id UUID REFERENCES hot_takes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  emoji VARCHAR(10) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(hot_take_id, user_id, emoji)  -- One of each emoji per user
);

-- Two Truths submissions
CREATE TABLE two_truths_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  statement_1 TEXT NOT NULL,
  statement_2 TEXT NOT NULL,
  statement_3 TEXT NOT NULL,
  lie_index INTEGER NOT NULL CHECK (lie_index BETWEEN 1 AND 3),
  is_revealed BOOLEAN DEFAULT FALSE,
  reveal_at TIMESTAMPTZ NOT NULL,  -- Auto-reveal time (created_at + 30 min)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)  -- One active submission per user (can update after reveal)
);

-- Two Truths guesses (one per user per submission)
CREATE TABLE two_truths_guesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID REFERENCES two_truths_submissions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  guessed_lie_index INTEGER NOT NULL CHECK (guessed_lie_index BETWEEN 1 AND 3),
  is_correct BOOLEAN,  -- Set when submission is revealed
  points_earned INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(submission_id, user_id)  -- One guess per user per submission
);

-- Two Truths reactions (emojis)
CREATE TABLE two_truths_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID REFERENCES two_truths_submissions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  emoji VARCHAR(10) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(submission_id, user_id, emoji)
);

-- Indexes
CREATE INDEX idx_hot_takes_created ON hot_takes(created_at DESC);
CREATE INDEX idx_hot_take_votes_take ON hot_take_votes(hot_take_id);
CREATE INDEX idx_two_truths_reveal ON two_truths_submissions(reveal_at) WHERE NOT is_revealed;
CREATE INDEX idx_two_truths_guesses_sub ON two_truths_guesses(submission_id);

-- Function to auto-reveal two truths after 30 minutes
CREATE OR REPLACE FUNCTION reveal_expired_submissions()
RETURNS void AS $$
BEGIN
  UPDATE two_truths_submissions
  SET is_revealed = TRUE
  WHERE reveal_at <= NOW() AND is_revealed = FALSE;
  
  -- Calculate points for correct guesses
  UPDATE two_truths_guesses g
  SET 
    is_correct = (g.guessed_lie_index = s.lie_index),
    points_earned = CASE WHEN g.guessed_lie_index = s.lie_index THEN 10 ELSE 0 END
  FROM two_truths_submissions s
  WHERE g.submission_id = s.id 
    AND s.is_revealed = TRUE 
    AND g.is_correct IS NULL;
    
  -- Update user scores
  UPDATE profiles p
  SET score = score + COALESCE(
    (SELECT SUM(points_earned) FROM two_truths_guesses WHERE user_id = p.id AND points_earned > 0),
    0
  );
END;
$$ LANGUAGE plpgsql;

-- Cron job to run every minute (set up in Supabase dashboard)
-- SELECT cron.schedule('reveal-submissions', '* * * * *', 'SELECT reveal_expired_submissions()');
```

### Row Level Security

```sql
-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE hot_takes ENABLE ROW LEVEL SECURITY;
ALTER TABLE hot_take_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE hot_take_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE two_truths_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE two_truths_guesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE two_truths_reactions ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read all, update own
CREATE POLICY "Profiles are viewable by authenticated users" ON profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Hot Takes: Anyone can read, authenticated can insert (anonymous in feed)
CREATE POLICY "Hot takes viewable by authenticated" ON hot_takes
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can submit hot takes" ON hot_takes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Votes: Authenticated users, one per hot take
CREATE POLICY "Votes viewable by authenticated" ON hot_take_votes
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can vote once" ON hot_take_votes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Reactions: Similar to votes
CREATE POLICY "Reactions viewable by authenticated" ON hot_take_reactions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can react" ON hot_take_reactions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Two Truths: All authenticated can view, own submissions only
CREATE POLICY "Submissions viewable by authenticated" ON two_truths_submissions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can submit own" ON two_truths_submissions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Guesses: One per submission per user
CREATE POLICY "Guesses viewable by authenticated" ON two_truths_guesses
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can guess once" ON two_truths_guesses
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
```

### Enable Realtime

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE hot_takes;
ALTER PUBLICATION supabase_realtime ADD TABLE hot_take_votes;
ALTER PUBLICATION supabase_realtime ADD TABLE hot_take_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE two_truths_submissions;
ALTER PUBLICATION supabase_realtime ADD TABLE two_truths_guesses;
ALTER PUBLICATION supabase_realtime ADD TABLE two_truths_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
```

---

## Project Structure

```
spillover/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout (mobile viewport)
│   │   ├── page.tsx                # Landing + Phone OTP login
│   │   ├── globals.css             # Tailwind v4 CSS config
│   │   ├── dashboard/
│   │   │   └── page.tsx            # Main hub (countdown + game selection)
│   │   ├── hot-takes/
│   │   │   ├── page.tsx            # Hot takes feed
│   │   │   └── my-takes/
│   │   │       └── page.tsx        # User's own hot takes (private)
│   │   ├── two-truths/
│   │   │   ├── page.tsx            # Two truths game
│   │   │   └── submit/
│   │   │       └── page.tsx        # Submit new statements
│   │   └── leaderboard/
│   │       └── page.tsx            # Scores & stats
│   │
│   ├── components/
│   │   ├── ui/                     # shadcn/ui components
│   │   ├── auth/
│   │   │   ├── phone-input.tsx
│   │   │   ├── otp-input.tsx
│   │   │   └── name-input.tsx      # Required display name
│   │   ├── game/
│   │   │   ├── hot-take-card.tsx
│   │   │   ├── hot-take-submit.tsx
│   │   │   ├── vote-buttons.tsx
│   │   │   ├── emoji-reactions.tsx
│   │   │   ├── two-truths-card.tsx
│   │   │   ├── two-truths-submit.tsx
│   │   │   ├── guess-buttons.tsx
│   │   │   ├── cooldown-timer.tsx
│   │   │   └── leaderboard.tsx
│   │   ├── countdown/
│   │   │   ├── new-year-timer.tsx
│   │   │   └── confetti.tsx
│   │   └── layout/
│   │       ├── mobile-nav.tsx      # Bottom navigation
│   │       ├── header.tsx
│   │       └── sound-toggle.tsx
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts           # Browser client
│   │   │   ├── server.ts           # Server client
│   │   │   └── types.ts            # Generated types
│   │   ├── sounds.ts               # Howler.js setup
│   │   ├── utils.ts                # cn, formatters
│   │   └── constants.ts            # Cooldowns, emojis, etc.
│   │
│   ├── hooks/
│   │   ├── use-user.ts             # Current user + profile
│   │   ├── use-hot-takes.ts        # Hot takes with realtime
│   │   ├── use-two-truths.ts       # Two truths with realtime
│   │   ├── use-cooldown.ts         # Submission cooldown logic
│   │   ├── use-sound.ts            # Sound effects
│   │   └── use-countdown.ts        # New Year countdown
│   │
│   ├── types/
│   │   └── index.ts                # App types
│   │
│   └── providers/
│       ├── supabase-provider.tsx
│       └── sound-provider.tsx
│
├── public/
│   └── sounds/
│       ├── vote.mp3
│       ├── submit.mp3
│       ├── reveal.mp3
│       ├── reaction.mp3
│       └── countdown.mp3
│
├── proxy.ts                        # Next.js 16 auth proxy
├── next.config.ts
├── tailwind.config.ts              # Minimal (CSS-first)
├── tsconfig.json
├── pnpm-lock.yaml
├── package.json
├── .env.local.example              # Template (never commit actual .env)
└── .gitignore                      # MUST include .env*
```

---

## Environment Setup

### .env.local.example (commit this as template)

```bash
# Supabase - Get from Supabase Dashboard
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# New Year Target (ISO string)
NEXT_PUBLIC_NEW_YEAR_TARGET=2026-01-01T00:00:00+05:30
```

### .gitignore (CRITICAL)

```gitignore
# Dependencies
node_modules
.pnpm-store

# Next.js
.next
out

# Environment - NEVER COMMIT
.env
.env.local
.env.*.local
.env.development
.env.production

# IDE
.vscode
.idea

# OS
.DS_Store
Thumbs.db

# Vercel
.vercel

# Debug
npm-debug.log*
pnpm-debug.log*
```

---

## Implementation Details

### Phase 1: Project Setup

```bash
# Create Next.js 16 project with pnpm
pnpm create next-app@latest spillover --typescript --tailwind --eslint --app --src-dir --turbopack

cd spillover

# Install dependencies
pnpm add @supabase/supabase-js @supabase/ssr
pnpm add howler canvas-confetti lucide-react sonner
pnpm add -D @types/howler

# shadcn/ui setup
pnpm dlx shadcn@latest init

# Add components
pnpm dlx shadcn@latest add button card input dialog toast avatar badge tabs
```

### Phase 2: Mobile-First Layout

```typescript
// src/app/layout.tsx
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { SupabaseProvider } from '@/providers/supabase-provider'
import { SoundProvider } from '@/providers/sound-provider'
import { Toaster } from 'sonner'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Spillover 🌊 | RRI New Year 2026',
  description: 'Party games for RRI Astrophysics crew',
  robots: 'noindex, nofollow', // Private app
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#000000',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} min-h-screen bg-background`}>
        <SupabaseProvider>
          <SoundProvider>
            <main className="flex min-h-screen flex-col">
              {children}
            </main>
            <Toaster position="top-center" richColors />
          </SoundProvider>
        </SupabaseProvider>
      </body>
    </html>
  )
}
```

### Phase 3: Authentication with Required Name

```typescript
// src/app/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { NewYearTimer } from '@/components/countdown/new-year-timer'

type Step = 'phone' | 'otp' | 'name'

export default function LoginPage() {
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [name, setName] = useState('')
  const [step, setStep] = useState<Step>('phone')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const formatPhone = (p: string) => p.startsWith('+') ? p : `+91${p}`

  const sendOTP = async () => {
    setLoading(true)
    setError('')
    
    const { error } = await supabase.auth.signInWithOtp({
      phone: formatPhone(phone),
    })

    if (error) {
      setError(error.message)
    } else {
      setStep('otp')
    }
    setLoading(false)
  }

  const verifyOTP = async () => {
    setLoading(true)
    setError('')
    
    const { data, error } = await supabase.auth.verifyOtp({
      phone: formatPhone(phone),
      token: otp,
      type: 'sms',
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    // Check if profile exists
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', data.user?.id)
      .single()

    if (profile?.display_name) {
      // Existing user, go to dashboard
      router.push('/dashboard')
    } else {
      // New user, need to set name
      setStep('name')
    }
    setLoading(false)
  }

  const saveName = async () => {
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      setError('Session expired, please try again')
      setStep('phone')
      setLoading(false)
      return
    }

    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      phone: formatPhone(phone),
      display_name: name.trim(),
    })

    if (error) {
      setError(error.message)
    } else {
      router.push('/dashboard')
    }
    setLoading(false)
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 gap-8">
      {/* New Year Countdown at top */}
      <NewYearTimer variant="compact" />
      
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl">🌊 Spillover</CardTitle>
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
                onClick={() => { setStep('phone'); setOtp('') }}
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
                Anonymous in Hot Takes • Shown in Two Truths game
              </p>
              <Button 
                onClick={saveName} 
                disabled={loading || name.trim().length < 2}
                className="w-full h-12 text-lg"
              >
                {loading ? 'Saving...' : "Let's Go! 🚀"}
              </Button>
            </>
          )}

          {error && (
            <p className="text-destructive text-sm text-center">{error}</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
```

### Phase 4: New Year Countdown Component

```typescript
// src/components/countdown/new-year-timer.tsx
'use client'

import { useEffect, useState } from 'react'
import { useSound } from '@/hooks/use-sound'
import confetti from 'canvas-confetti'

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
}

const TARGET = new Date(process.env.NEXT_PUBLIC_NEW_YEAR_TARGET || '2026-01-01T00:00:00+05:30')

export function NewYearTimer({ variant = 'full' }: { variant?: 'full' | 'compact' }) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null)
  const [isNewYear, setIsNewYear] = useState(false)
  const { playSound } = useSound()

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date()
      const difference = TARGET.getTime() - now.getTime()

      if (difference <= 0) {
        setIsNewYear(true)
        return null
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / (1000 * 60)) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      }
    }

    // Initial calculation
    setTimeLeft(calculateTimeLeft())

    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft()
      setTimeLeft(newTimeLeft)

      // Play countdown sounds in last 10 seconds
      if (newTimeLeft && newTimeLeft.days === 0 && newTimeLeft.hours === 0 && 
          newTimeLeft.minutes === 0 && newTimeLeft.seconds <= 10 && newTimeLeft.seconds > 0) {
        playSound('countdown')
      }

      // Trigger confetti at midnight
      if (!newTimeLeft && !isNewYear) {
        setIsNewYear(true)
        triggerCelebration()
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [isNewYear, playSound])

  const triggerCelebration = () => {
    playSound('reveal')
    
    // Fire confetti multiple times
    const duration = 10 * 1000
    const end = Date.now() + duration

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff']
      })
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff']
      })

      if (Date.now() < end) {
        requestAnimationFrame(frame)
      }
    }
    frame()
  }

  if (isNewYear) {
    return (
      <div className="text-center p-4 animate-pulse">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 via-red-500 to-pink-500 bg-clip-text text-transparent">
          🎉 Happy New Year 2026! 🎉
        </h1>
      </div>
    )
  }

  if (!timeLeft) return null

  if (variant === 'compact') {
    return (
      <div className="text-center text-muted-foreground">
        <p className="text-xs uppercase tracking-wider">New Year 2026 in</p>
        <p className="font-mono text-lg">
          {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s
        </p>
      </div>
    )
  }

  return (
    <div className="text-center space-y-2">
      <p className="text-sm uppercase tracking-wider text-muted-foreground">
        New Year 2026 Countdown
      </p>
      <div className="flex justify-center gap-2">
        {[
          { value: timeLeft.days, label: 'Days' },
          { value: timeLeft.hours, label: 'Hours' },
          { value: timeLeft.minutes, label: 'Min' },
          { value: timeLeft.seconds, label: 'Sec' },
        ].map(({ value, label }) => (
          <div key={label} className="flex flex-col items-center">
            <span className="text-3xl font-mono font-bold tabular-nums">
              {String(value).padStart(2, '0')}
            </span>
            <span className="text-xs text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
```

### Phase 5: Hot Takes with Cooldown & Reactions

```typescript
// src/lib/constants.ts
export const COOLDOWNS = {
  HOT_TAKE_SUBMIT: 15 * 60 * 1000, // 15 minutes in ms
  TWO_TRUTHS_SUBMIT: 15 * 60 * 1000,
  TWO_TRUTHS_REVEAL: 30 * 60 * 1000, // 30 minutes
}

export const REACTION_EMOJIS = ['🔥', '💀', '📠', '🤡', '💯', '😂', '🙄', '👀']
```

```typescript
// src/hooks/use-cooldown.ts
'use client'

import { useState, useEffect } from 'react'

export function useCooldown(lastActionTime: Date | null, cooldownMs: number) {
  const [timeLeft, setTimeLeft] = useState<number>(0)
  const [canAct, setCanAct] = useState(true)

  useEffect(() => {
    if (!lastActionTime) {
      setCanAct(true)
      setTimeLeft(0)
      return
    }

    const calculateTimeLeft = () => {
      const elapsed = Date.now() - new Date(lastActionTime).getTime()
      const remaining = cooldownMs - elapsed
      
      if (remaining <= 0) {
        setCanAct(true)
        setTimeLeft(0)
        return false
      }
      
      setCanAct(false)
      setTimeLeft(remaining)
      return true
    }

    if (!calculateTimeLeft()) return

    const timer = setInterval(() => {
      if (!calculateTimeLeft()) {
        clearInterval(timer)
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [lastActionTime, cooldownMs])

  const formatTimeLeft = () => {
    const minutes = Math.floor(timeLeft / 60000)
    const seconds = Math.floor((timeLeft % 60000) / 1000)
    return `${minutes}:${String(seconds).padStart(2, '0')}`
  }

  return { canAct, timeLeft, formatTimeLeft }
}
```

```typescript
// src/hooks/use-hot-takes.ts
'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from './use-user'
import type { HotTake, HotTakeVote, HotTakeReaction } from '@/types'

export function useHotTakes() {
  const [hotTakes, setHotTakes] = useState<HotTake[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useUser()
  const supabase = createClient()

  // Fetch hot takes with votes and reactions
  const fetchHotTakes = useCallback(async () => {
    const { data } = await supabase
      .from('hot_takes')
      .select(`
        *,
        votes:hot_take_votes(*),
        reactions:hot_take_reactions(*)
      `)
      .order('created_at', { ascending: false })

    if (data) {
      setHotTakes(data)
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchHotTakes()

    // Realtime subscriptions
    const channel = supabase
      .channel('hot_takes_realtime')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'hot_takes' },
        () => fetchHotTakes()
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'hot_take_votes' },
        () => fetchHotTakes()
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'hot_take_reactions' },
        () => fetchHotTakes()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, fetchHotTakes])

  // Get user's last submission time for cooldown
  const getLastSubmissionTime = useCallback(() => {
    if (!user) return null
    const userTakes = hotTakes.filter(t => t.user_id === user.id)
    if (userTakes.length === 0) return null
    return new Date(userTakes[0].created_at)
  }, [hotTakes, user])

  // Submit new hot take
  const submitHotTake = useCallback(async (content: string) => {
    if (!user) return { error: 'Not authenticated' }

    const { error } = await supabase.from('hot_takes').insert({
      user_id: user.id,
      content,
    })

    return { error: error?.message }
  }, [supabase, user])

  // Vote on hot take (only once)
  const vote = useCallback(async (hotTakeId: string, voteType: 'agree' | 'disagree') => {
    if (!user) return { error: 'Not authenticated' }

    // Check if already voted
    const existing = hotTakes
      .find(t => t.id === hotTakeId)
      ?.votes?.find(v => v.user_id === user.id)

    if (existing) {
      return { error: 'Already voted' }
    }

    const { error } = await supabase.from('hot_take_votes').insert({
      hot_take_id: hotTakeId,
      user_id: user.id,
      vote: voteType,
    })

    return { error: error?.message }
  }, [supabase, user, hotTakes])

  // Add emoji reaction
  const addReaction = useCallback(async (hotTakeId: string, emoji: string) => {
    if (!user) return { error: 'Not authenticated' }

    const { error } = await supabase.from('hot_take_reactions').upsert({
      hot_take_id: hotTakeId,
      user_id: user.id,
      emoji,
    })

    return { error: error?.message }
  }, [supabase, user])

  // Get user's own hot takes
  const myHotTakes = hotTakes.filter(t => t.user_id === user?.id)

  // Check if user has voted on a hot take
  const hasVoted = useCallback((hotTakeId: string) => {
    const take = hotTakes.find(t => t.id === hotTakeId)
    return take?.votes?.some(v => v.user_id === user?.id) ?? false
  }, [hotTakes, user])

  // Get user's vote on a hot take
  const getUserVote = useCallback((hotTakeId: string) => {
    const take = hotTakes.find(t => t.id === hotTakeId)
    return take?.votes?.find(v => v.user_id === user?.id)?.vote
  }, [hotTakes, user])

  return {
    hotTakes,
    myHotTakes,
    loading,
    submitHotTake,
    vote,
    addReaction,
    hasVoted,
    getUserVote,
    getLastSubmissionTime,
  }
}
```

### Phase 6: Emoji Reactions Component

```typescript
// src/components/game/emoji-reactions.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { REACTION_EMOJIS } from '@/lib/constants'
import { useSound } from '@/hooks/use-sound'
import { cn } from '@/lib/utils'

interface ReactionData {
  emoji: string
  count: number
  hasReacted: boolean
}

interface EmojiReactionsProps {
  reactions: Array<{ emoji: string; user_id: string }>
  currentUserId: string | undefined
  onReact: (emoji: string) => Promise<{ error?: string }>
}

export function EmojiReactions({ reactions, currentUserId, onReact }: EmojiReactionsProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const { playSound } = useSound()

  // Aggregate reactions
  const reactionData: ReactionData[] = REACTION_EMOJIS.map(emoji => ({
    emoji,
    count: reactions.filter(r => r.emoji === emoji).length,
    hasReacted: reactions.some(r => r.emoji === emoji && r.user_id === currentUserId),
  }))

  const handleReact = async (emoji: string) => {
    setLoading(emoji)
    const { error } = await onReact(emoji)
    if (!error) {
      playSound('reaction')
    }
    setLoading(null)
  }

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
  )
}
```

### Phase 7: Sound Effects

```typescript
// src/lib/sounds.ts
import { Howl } from 'howler'

const sounds: Record<string, Howl> = {}

export const loadSounds = () => {
  sounds.vote = new Howl({ src: ['/sounds/vote.mp3'], volume: 0.5 })
  sounds.submit = new Howl({ src: ['/sounds/submit.mp3'], volume: 0.5 })
  sounds.reveal = new Howl({ src: ['/sounds/reveal.mp3'], volume: 0.7 })
  sounds.reaction = new Howl({ src: ['/sounds/reaction.mp3'], volume: 0.3 })
  sounds.countdown = new Howl({ src: ['/sounds/countdown.mp3'], volume: 0.6 })
}

export const playSound = (name: keyof typeof sounds) => {
  if (sounds[name]) {
    sounds[name].play()
  }
}

export const setMuted = (muted: boolean) => {
  Howler.mute(muted)
}
```

```typescript
// src/hooks/use-sound.ts
'use client'

import { useContext, createContext, useState, useEffect, useCallback } from 'react'
import { loadSounds, playSound as playSoundFn, setMuted } from '@/lib/sounds'

interface SoundContextType {
  muted: boolean
  toggleMute: () => void
  playSound: (name: string) => void
}

const SoundContext = createContext<SoundContextType | null>(null)

export function SoundProvider({ children }: { children: React.ReactNode }) {
  const [muted, setMutedState] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    loadSounds()
    setLoaded(true)
    
    // Check localStorage for mute preference
    const savedMuted = localStorage.getItem('spillover-muted') === 'true'
    setMutedState(savedMuted)
    setMuted(savedMuted)
  }, [])

  const toggleMute = useCallback(() => {
    setMutedState(prev => {
      const newValue = !prev
      setMuted(newValue)
      localStorage.setItem('spillover-muted', String(newValue))
      return newValue
    })
  }, [])

  const playSound = useCallback((name: string) => {
    if (loaded && !muted) {
      playSoundFn(name as any)
    }
  }, [loaded, muted])

  return (
    <SoundContext.Provider value={{ muted, toggleMute, playSound }}>
      {children}
    </SoundContext.Provider>
  )
}

export function useSound() {
  const context = useContext(SoundContext)
  if (!context) {
    throw new Error('useSound must be used within SoundProvider')
  }
  return context
}
```

### Phase 8: Mobile Bottom Navigation

```typescript
// src/components/layout/mobile-nav.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Flame, MessageCircle, Trophy, Home, Volume2, VolumeX } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSound } from '@/hooks/use-sound'
import { Button } from '@/components/ui/button'

const navItems = [
  { href: '/dashboard', icon: Home, label: 'Home' },
  { href: '/hot-takes', icon: Flame, label: 'Hot Takes' },
  { href: '/two-truths', icon: MessageCircle, label: '2 Truths' },
  { href: '/leaderboard', icon: Trophy, label: 'Scores' },
]

export function MobileNav() {
  const pathname = usePathname()
  const { muted, toggleMute } = useSound()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t safe-area-inset-bottom z-50">
      <div className="flex items-center justify-around py-2">
        {navItems.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex flex-col items-center gap-1 p-2 rounded-lg transition-colors min-w-[64px]',
              pathname === href 
                ? 'text-primary' 
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Icon className="h-5 w-5" />
            <span className="text-xs">{label}</span>
          </Link>
        ))}
        
        {/* Sound toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleMute}
          className="flex flex-col items-center gap-1 p-2 min-w-[64px] h-auto"
        >
          {muted ? (
            <VolumeX className="h-5 w-5 text-muted-foreground" />
          ) : (
            <Volume2 className="h-5 w-5" />
          )}
          <span className="text-xs">{muted ? 'Muted' : 'Sound'}</span>
        </Button>
      </div>
    </nav>
  )
}
```

### Phase 9: Two Truths with Auto-Reveal

```typescript
// src/hooks/use-two-truths.ts
'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from './use-user'
import { COOLDOWNS } from '@/lib/constants'

export function useTwoTruths() {
  const [submissions, setSubmissions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useUser()
  const supabase = createClient()

  const fetchSubmissions = useCallback(async () => {
    const { data } = await supabase
      .from('two_truths_submissions')
      .select(`
        *,
        profile:profiles(display_name),
        guesses:two_truths_guesses(*),
        reactions:two_truths_reactions(*)
      `)
      .order('created_at', { ascending: false })

    if (data) {
      setSubmissions(data)
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchSubmissions()

    // Check for auto-reveals every 30 seconds
    const revealTimer = setInterval(() => {
      const now = new Date()
      setSubmissions(prev => prev.map(sub => {
        if (!sub.is_revealed && new Date(sub.reveal_at) <= now) {
          return { ...sub, is_revealed: true }
        }
        return sub
      }))
    }, 30000)

    // Realtime subscriptions
    const channel = supabase
      .channel('two_truths_realtime')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'two_truths_submissions' },
        () => fetchSubmissions()
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'two_truths_guesses' },
        () => fetchSubmissions()
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'two_truths_reactions' },
        () => fetchSubmissions()
      )
      .subscribe()

    return () => {
      clearInterval(revealTimer)
      supabase.removeChannel(channel)
    }
  }, [supabase, fetchSubmissions])

  // Submit new two truths (with 30 min reveal time)
  const submitTwoTruths = useCallback(async (
    statement1: string,
    statement2: string,
    statement3: string,
    lieIndex: number
  ) => {
    if (!user) return { error: 'Not authenticated' }

    const revealAt = new Date(Date.now() + COOLDOWNS.TWO_TRUTHS_REVEAL)

    const { error } = await supabase.from('two_truths_submissions').upsert({
      user_id: user.id,
      statement_1: statement1,
      statement_2: statement2,
      statement_3: statement3,
      lie_index: lieIndex,
      reveal_at: revealAt.toISOString(),
      is_revealed: false,
    })

    return { error: error?.message }
  }, [supabase, user])

  // Guess which is the lie (one per submission)
  const makeGuess = useCallback(async (submissionId: string, guessedLieIndex: number) => {
    if (!user) return { error: 'Not authenticated' }

    // Check if already guessed
    const submission = submissions.find(s => s.id === submissionId)
    if (submission?.guesses?.some((g: any) => g.user_id === user.id)) {
      return { error: 'Already guessed' }
    }

    const { error } = await supabase.from('two_truths_guesses').insert({
      submission_id: submissionId,
      user_id: user.id,
      guessed_lie_index: guessedLieIndex,
    })

    return { error: error?.message }
  }, [supabase, user, submissions])

  // Get user's last submission time
  const getLastSubmissionTime = useCallback(() => {
    if (!user) return null
    const userSub = submissions.find(s => s.user_id === user.id)
    return userSub ? new Date(userSub.created_at) : null
  }, [submissions, user])

  // Check if user has guessed on a submission
  const hasGuessed = useCallback((submissionId: string) => {
    const sub = submissions.find(s => s.id === submissionId)
    return sub?.guesses?.some((g: any) => g.user_id === user?.id) ?? false
  }, [submissions, user])

  // Calculate time until reveal
  const getTimeUntilReveal = useCallback((revealAt: string) => {
    const diff = new Date(revealAt).getTime() - Date.now()
    if (diff <= 0) return null
    const minutes = Math.floor(diff / 60000)
    const seconds = Math.floor((diff % 60000) / 1000)
    return `${minutes}:${String(seconds).padStart(2, '0')}`
  }, [])

  return {
    submissions,
    loading,
    submitTwoTruths,
    makeGuess,
    hasGuessed,
    getLastSubmissionTime,
    getTimeUntilReveal,
  }
}
```

---

## Data Persistence Strategy

### Client-Side Caching

```typescript
// src/lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: true,  // Persist auth in localStorage
        storageKey: 'spillover-auth',
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      // Long cache for realtime
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    }
  )
}
```

### Next.js 16 Caching Config

```typescript
// next.config.ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Enable Cache Components
  cacheComponents: true,
  
  // Long cache for static assets
  headers: async () => [
    {
      source: '/sounds/:path*',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=31536000, immutable',
        },
      ],
    },
  ],
}

export default nextConfig
```

---

## Quick Start Commands

```bash
# Create project with pnpm
pnpm create next-app@latest spillover --typescript --tailwind --eslint --app --src-dir --turbopack

cd spillover

# Install dependencies
pnpm add @supabase/supabase-js @supabase/ssr
pnpm add howler canvas-confetti lucide-react sonner
pnpm add -D @types/howler

# shadcn/ui setup
pnpm dlx shadcn@latest init

# Add components
pnpm dlx shadcn@latest add button card input dialog toast avatar badge tabs progress

# Development
pnpm dev

# Build
pnpm build

# Deploy (set env vars in Vercel dashboard, NOT in code)
vercel --prod
```

---

## Supabase Setup Checklist

1. Create new project at supabase.com
2. Run SQL schema (copy from above)
3. Enable Phone Auth:
   - Go to Authentication → Providers → Phone
   - Enable and add Twilio credentials
4. Enable Realtime:
   - Database → Replication → Enable for tables
5. Set up Cron (for auto-reveal):
   - Database → Extensions → Enable pg_cron
   - Run: `SELECT cron.schedule('reveal-submissions', '* * * * *', 'SELECT reveal_expired_submissions()')`
6. Copy URL and anon key to Vercel env vars

---

## Vercel Deployment Checklist

1. Connect GitHub repo
2. Set environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_NEW_YEAR_TARGET=2026-01-01T00:00:00+05:30`
3. Deploy
4. Set deployment to private (Settings → General → uncheck "Include in search engines")
5. Share the link only with party attendees

---

## Game Rules Summary

### Hot Takes 🔥
- Submit anonymous hot takes (content saved to your account privately)
- **15-minute cooldown** between submissions
- Vote **agree** or **disagree** (one vote per hot take)
- Add emoji reactions: 🔥 💀 📠 🤡 💯 😂 🙄 👀
- No author reveals - stays anonymous forever
- View your own submissions in "My Takes"

### Two Truths and a Lie 🎭
- Submit 3 statements (2 truths, 1 lie)
- **15-minute cooldown** between submissions
- **Auto-reveal after 30 minutes** showing the lie
- Your name is shown when revealed
- Others guess which is the lie (one guess per submission)
- **+10 points** for correct guess
- Add emoji reactions

### New Year Countdown 🎉
- Live countdown to January 1, 2026 (IST)
- Sound effects in final 10 seconds
- Confetti explosion at midnight!

---

## Notes for AI Agent

1. **pnpm only** - Never use npm or yarn
2. **Never commit secrets** - All env vars via Vercel dashboard
3. **Mobile-first** - All UI designed for phones, large touch targets
4. **No room system** - Single deployment, private link
5. **proxy.ts** not middleware.ts (Next.js 16)
6. **Tailwind v4** - CSS-first config with `@theme`
7. **@supabase/ssr** - Not deprecated auth-helpers
8. **Sound effects** - Howler.js, with mute toggle
9. **Realtime** - Always cleanup subscriptions in useEffect
10. **Cooldowns** - 15 min for submissions, enforced server-side
11. **Auto-reveal** - Two truths reveal after 30 min via pg_cron
12. **Reactions** - Predefined emoji set, stored in DB
13. **Phone +91 prefix** - Always format for India
14. **Node.js 20.9+** - Required for Next.js 16

Happy New Year! 🎉🚀
