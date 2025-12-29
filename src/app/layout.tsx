import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { SupabaseProvider } from '@/providers/supabase-provider';
import { SoundProvider } from '@/providers/sound-provider';
import { Toaster } from 'sonner';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Spillover | RRI New Year 2026',
  description: 'Party games for RRI Astrophysics crew',
  robots: 'noindex, nofollow',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#000000',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} min-h-screen bg-background`}>
        <SupabaseProvider>
          <SoundProvider>
            <main className="flex min-h-screen flex-col">{children}</main>
            <Toaster position="top-center" richColors />
          </SoundProvider>
        </SupabaseProvider>
      </body>
    </html>
  );
}
