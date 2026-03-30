'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import TopNavigation from '@/components/admin/TopNavigation';
import { THEME_CONFIG } from '@/lib/theme-config';
import { useCurrentUser } from '@/hooks/useCurrentUser';

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const l = THEME_CONFIG.layout;
  const router = useRouter();
  const user = useCurrentUser();

  // Auth & Role Guard
  useEffect(() => {
    if (!user.loading) {
      if (!user.user) {
        router.push('/giris');
      } else if (user.profile?.role && user.profile.role !== 'admin') {
        // Redirect non-admin users to their correct panel
        const redirectMap: Record<string, string> = {
          student: '/student',
          teacher: '/teacher',
        };
        const target = redirectMap[user.profile.role] || '/giris';
        router.push(target);
      }
    }
  }, [user.loading, user.user, user.profile?.role, router]);

  return (
    <div className="min-h-screen flex flex-col">
      <TopNavigation />
      <main className="flex-1 bg-gradient-to-br from-[#f9fafa] via-white to-[#f8fafa] relative">
        <div className="absolute inset-0 bg-brand-primary opacity-[0.08] pointer-events-none"></div>
        <div className="relative z-10">
          {children}
        </div>
      </main>
    </div>
  );
}
