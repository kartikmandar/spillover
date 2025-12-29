'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Flame, MessageCircle, Trophy, Home, Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSound } from '@/providers/sound-provider';
import { Button } from '@/components/ui/button';

const navItems = [
  { href: '/dashboard', icon: Home, label: 'Home' },
  { href: '/hot-takes', icon: Flame, label: 'Hot Takes' },
  { href: '/two-truths', icon: MessageCircle, label: '2 Truths' },
  { href: '/leaderboard', icon: Trophy, label: 'Scores' },
];

export function MobileNav() {
  const pathname = usePathname();
  const { muted, toggleMute } = useSound();

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
  );
}
