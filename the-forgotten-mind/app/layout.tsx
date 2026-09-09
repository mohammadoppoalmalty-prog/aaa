import type { Metadata, Viewport } from 'next';
import './globals.css';
import { RumReporter } from '@/lib/RumReporter';

export const metadata: Metadata = {
  metadataBase: new URL('https://the-forgotten-mind.local'),
  title: {
    default: 'The Forgotten Mind',
    template: '%s · The Forgotten Mind',
  },
  description:
    'A portfolio built as a world you can walk through — and a complete, readable archive for the people who only have five minutes.',
  applicationName: 'The Forgotten Mind',
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: '#05070F',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr">
      <body>
        {children}
        <RumReporter />
      </body>
    </html>
  );
}
