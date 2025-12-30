import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { SupabaseProvider } from '@/providers/supabase-provider';
import { SoundProvider } from '@/providers/sound-provider';
import { Toaster } from 'sonner';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://spillover.vercel.app'),
  title: 'Spillover | RRI New Year 2026',
  description: 'Party games for RRI crew',
  robots: 'noindex, nofollow',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: 'Spillover | RRI New Year 2026',
    description: 'Party games for RRI crew',
    images: [{ url: '/icon-512.png', width: 512, height: 512 }],
  },
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
    <html lang="en" className="dark" data-scroll-behavior="smooth">
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
