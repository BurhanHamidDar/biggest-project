import { Inter } from 'next/font/google';
import type { Metadata } from 'next';
import './globals.scss';
import AuthWrapper from '@/components/AuthWrapper';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'School Admin Panel',
  description: 'Admin Dashboard for School Management System',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthWrapper>
          {children}
        </AuthWrapper>
      </body>
    </html>
  );
}
