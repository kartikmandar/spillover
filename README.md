# Spillover

A mobile-first party game web app for New Year's Eve celebrations. Built with Next.js 16, React 19, Supabase, and Tailwind CSS.

## Features

- **Hot Takes** - Share anonymous spicy opinions. Vote agree/disagree and react with emojis.
- **Two Truths & a Lie** - Submit 3 statements (2 true, 1 lie). Others guess which is the lie. Reveals after 30 minutes.
- **Leaderboard** - Compete for points by correctly guessing lies.
- **New Year Countdown** - Live countdown with party mode that activates 3 hours before midnight.
- **Sound Effects** - Immersive audio feedback for interactions.
- **PWA Support** - Install as a mobile app.
- **Real-time Updates** - Live updates via Supabase Realtime.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth (OTP via email)
- **Deployment**: Vercel
- **Testing**: Playwright (E2E)

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- Supabase account

### 1. Clone and Install

```bash
git clone https://github.com/kartikmandar/spillover.git
cd spillover
pnpm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the contents of `supabase/schema.sql`
3. Enable the **pg_cron** extension (Database → Extensions) for auto-reveal functionality
4. Set up the cron job by running:
   ```sql
   SELECT cron.schedule('reveal-submissions', '* * * * *', 'SELECT reveal_expired_submissions()');
   ```

### 3. Configure Environment Variables

Create a `.env.local` file:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_NEW_YEAR_TARGET=2026-01-01T00:00:00+05:30
```

Get your Supabase credentials from: Project Settings → API

### 4. Run Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Customizing for Your Event

### Change the Event Name

1. Update `src/app/layout.tsx` - Change title and description in metadata
2. Update `public/manifest.json` - Change name and short_name
3. Update `src/app/page.tsx` - Change login page text
4. Update `src/app/dashboard/page.tsx` - Change welcome text and instructions

### Change the Target Date/Time

Update `NEXT_PUBLIC_NEW_YEAR_TARGET` in your `.env.local`:

```env
# Format: YYYY-MM-DDTHH:MM:SS+TIMEZONE
NEXT_PUBLIC_NEW_YEAR_TARGET=2026-01-01T00:00:00+05:30
```

### Customize Party Mode Timing

Edit `src/hooks/use-party-mode.ts`:
- Change `hours < 3` to adjust when party mode activates
- Modify intensity calculations for different visual effects

### Customize Game Rules

- **Hot Takes character limit**: Edit `src/components/game/hot-take-submit.tsx` (maxLength)
- **Two Truths reveal time**: Edit `src/app/two-truths/submit/page.tsx` (revealAt calculation)
- **Cooldown timers**: Edit `src/lib/constants.ts`
- **Scoring**: Edit `supabase/schema.sql` (reveal_expired_submissions function)

### Add/Replace Sound Effects

Place MP3 files in `public/sounds/`. The app uses:
- `countdown.mp3` - Last 10 seconds of countdown
- `celebrate.mp3` - Midnight celebration
- `submit.mp3` - Form submissions
- `vote.mp3` - Voting actions
- `reaction.mp3` - Emoji reactions
- `reveal.mp3` - Two Truths reveal

## Project Structure

```
spillover/
├── src/
│   ├── app/                 # Next.js App Router pages
│   │   ├── dashboard/       # Main dashboard
│   │   ├── hot-takes/       # Hot Takes game
│   │   ├── two-truths/      # Two Truths game
│   │   └── leaderboard/     # Leaderboard
│   ├── components/          # React components
│   │   ├── ui/              # shadcn/ui components
│   │   ├── game/            # Game-specific components
│   │   ├── countdown/       # Countdown timer
│   │   └── layout/          # Layout components
│   ├── hooks/               # Custom React hooks
│   ├── lib/                 # Utilities and Supabase client
│   └── providers/           # React context providers
├── public/
│   └── sounds/              # Audio files
├── supabase/
│   ├── schema.sql           # Database schema
│   └── clear-data.sql       # Script to clear test data
└── tests/
    └── e2e/                 # Playwright E2E tests
```

## Database Schema

The app uses these main tables:

- `profiles` - User profiles with scores
- `hot_takes` - Anonymous hot take submissions
- `hot_take_votes` - Agree/disagree votes
- `hot_take_reactions` - Emoji reactions
- `two_truths_submissions` - Two Truths game entries
- `two_truths_guesses` - User guesses
- `two_truths_reactions` - Emoji reactions

See `supabase/schema.sql` for the complete schema with RLS policies.

## Testing

### E2E Tests (Playwright)

```bash
# Run all tests
pnpm test:e2e

# Run with UI
pnpm test:e2e:ui

# Setup auth state first (requires manual OTP entry)
pnpm test:e2e:setup
```

### Clear Test Data

Run `supabase/clear-data.sql` in the Supabase SQL Editor to reset all data.

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy

### Environment Variables for Production

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
NEXT_PUBLIC_NEW_YEAR_TARGET=2026-01-01T00:00:00+05:30
```

## Scripts

```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint
pnpm test:e2e     # Run Playwright tests
```

## License

MIT License - see [LICENSE](LICENSE) for details.

## Acknowledgments

Built for RRI New Year 2026 celebration.
