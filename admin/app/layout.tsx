import './globals.css';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { AuthProvider } from '../context/AuthContext';
import { AdminShell } from '../components/AdminShell';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
});

export const metadata = {
  title: 'Daily Habit Platform — Enterprise Admin Portal',
  description: 'Enterprise operational portal for habit tracking, user moderation, template curation, and audit logging.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable} h-full dark`}>
      <body className="h-full bg-slate-950 text-slate-100 antialiased font-sans">
        <AuthProvider>
          <AdminShell>{children}</AdminShell>
        </AuthProvider>
      </body>
    </html>
  );
}
