import { Plus_Jakarta_Sans, Playfair_Display } from 'next/font/google';
import AdminShell from './AdminShell';
import type { Metadata } from 'next';

// Prevent search engines from indexing private admin pages
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}


const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-jakarta',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-playfair',
});

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className={`${jakarta.variable} ${playfair.variable} bg-white antialiased`}
      style={{ fontFamily: 'var(--font-jakarta), sans-serif', minHeight: '100vh' }}
    >
      <AdminShell>{children}</AdminShell>
    </div>
  );
}
