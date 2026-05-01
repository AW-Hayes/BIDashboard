import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'VISE Dashboard',
  description: 'Business management dashboard for VISE',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
