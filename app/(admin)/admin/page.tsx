'use client';

import { useState, useEffect } from 'react';
import { THEME_CONFIG } from '@/lib/theme-config';
import Avatar from '@/components/Avatar';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import PageHeader from '@/components/admin/PageHeader';
import AdminCard from '@/components/admin/AdminCard';
import { getDashboardStats } from '@/lib/actions/admin-dashboard';

// --- Types ---

interface DashboardStat {
  id: string;
  label: string;
  value: string;
  icon: string;
}

// --- Sub-components ---

const StatBox = ({ item }: { item: DashboardStat }) => (
  <div className="bg-white p-6 rounded-lg border border-gray-100/80 shadow-sm hover:border-brand-primary/20 transition-all group hover:shadow-md relative overflow-hidden">
    <div className="absolute -right-4 -top-4 w-24 h-24 bg-gray-50 rounded-full group-hover:bg-brand-accent/10 transition-colors z-0"></div>
    <div className="relative z-10">
      <div className="flex justify-between items-start mb-4">
        <div className="w-12 h-12 rounded-md bg-brand-primary/5 flex items-center justify-center text-brand-primary group-hover:bg-brand-primary group-hover:text-white transition-colors text-lg">
          <i className={`fas ${item.icon}`}></i>
        </div>
      </div>
      <h4 className="text-3xl font-black text-brand-primary tracking-tight">{item.value}</h4>
      <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-2">{item.label}</p>
    </div>
  </div>
);

const LineChartSmall = ({ data }: { data: number[] }) => {
  if (data.every(v => v === 0)) {
    return (
      <div className="w-full h-48 flex items-center justify-center text-gray-400 text-sm">
        Henüz veri yok
      </div>
    );
  }
  const max = Math.max(...data) * 1.4 || 1;
  const points = data.map((v, i) => ({ x: i * (100 / (data.length - 1)), y: 100 - (v / max) * 100 }));
  let d = `M ${points[0].x},${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i], p2 = points[i + 1];
    d += ` C ${p1.x + (p2.x - p1.x) / 2},${p1.y} ${p1.x + (p2.x - p1.x) / 2},${p2.y} ${p2.x},${p2.y}`;
  }
  return (
    <svg className="w-full h-48 overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
      <path d={d} fill="none" stroke="#204544" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
      <path d={`${d} L 100,100 L 0,100 Z`} fill="url(#grad)" />
      <defs>
        <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#204544" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#204544" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
};

// --- Main Page ---

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStat[]>([]);
  const [roleCounts, setRoleCounts] = useState({ student: 0, teacher: 0, admin: 0, total: 1 });
  const [recentUsers, setRecentUsers] = useState<{ name: string; action: string; time: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingTasks, setPendingTasks] = useState({ comments: 0, inquiries: 0, teachers: 0 });
  const [interactionData, setInteractionData] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);
  const [chartDays, setChartDays] = useState<string[]>(['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const data = await getDashboardStats();

        // Calculate role distribution
        const total = data.totalUsers || 1;

        setRoleCounts({ 
          student: data.studentCount, 
          teacher: data.teacherCount, 
          admin: data.adminCount, 
          total 
        });
        
        setPendingTasks({ 
          comments: data.pendingComments, 
          inquiries: data.unreadInquiries, 
          teachers: data.pendingTeachers 
        });

        // Build stats
        setStats([
          { id: 'v', label: 'Tekil Ziyaretçi', value: String(data.visitorsCount), icon: 'fa-globe' },
          { id: 'u', label: 'Toplam Kullanıcı', value: String(data.totalUsers), icon: 'fa-user-friends' },
          { id: 'a', label: 'Aktif Öğrenci', value: String(data.studentCount), icon: 'fa-user-graduate' },
          { id: 'c', label: 'Yayında Kurs', value: String(data.publishedCourses), icon: 'fa-book' },
          { id: 'r', label: 'Bekleyen Yorum', value: String(data.pendingComments), icon: 'fa-clock' },
          { id: 't', label: 'Onay Bekleyen Öğretmen', value: String(data.pendingTeachers), icon: 'fa-chalkboard-teacher' },
        ]);

        // Recent activity
        const recent = data.recentUsers.map((p: any) => {
          const created = new Date(p.createdAt);
          const now = new Date();
          const diffMs = now.getTime() - created.getTime();
          const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
          const diffDays = Math.floor(diffHours / 24);
          const timeStr = diffDays > 0 ? `${diffDays}g` : diffHours > 0 ? `${diffHours}sa` : 'şimdi';

          return {
            name: p.name,
            action: p.action,
            time: timeStr,
          };
        });
        setRecentUsers(recent);

        // Interaction Logic
        const dayNames = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
        const shortDays = data.chartDays.map(d => dayNames[new Date(d).getDay()]);
        setChartDays(shortDays);
        setInteractionData(data.interactionData);

      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 animate-fadeIn">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <svg className="animate-spin h-8 w-8 text-brand-primary mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="text-gray-500 text-sm">Yükleniyor...</p>
          </div>
        </div>
      </div>
    );
  }

  const studentPct = Math.round((roleCounts.student / roleCounts.total) * 100);
  const teacherPct = Math.round((roleCounts.teacher / roleCounts.total) * 100);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 animate-fadeIn">

      <PageHeader
        title="Genel Bakış"
        action={
          <div className="flex gap-4">
            <Link href="/admin/settings" className="w-10 h-10 text-gray-400 hover:text-brand-primary bg-white border border-gray-100 hover:bg-gray-50 shadow-sm rounded-lg transition-all flex items-center justify-center">
              <i className="fas fa-cog text-sm"></i>
            </Link>
          </div>
        }
        subtitle="Sistem özeti ve güncel durum"
      />

      {/* 2. Compact Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-10">
        {stats.map(s => <StatBox key={s.id} item={s} />)}
      </div>

      {/* 3. Logic Center */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">

        {/* Growth Card */}
        <AdminCard padding={true} className="lg:col-span-2">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Haftalık Etkileşim</h3>
            <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-3 py-1 rounded-full">SON 7 GÜN</span>
          </div>
          <LineChartSmall data={interactionData} />
          <div className="mt-6 flex justify-between text-[10px] font-bold text-gray-400">
            {chartDays.map(d => <span key={d}>{d}</span>)}
          </div>
        </AdminCard>

        {/* Distribution / Quick Info */}
        <AdminCard padding={true} className="flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-6">Kullanıcı Rolleri</h3>
            <div className="space-y-5">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500 font-bold uppercase tracking-wider">Öğrenci</span>
                  <span className="font-black text-brand-primary">{studentPct}%</span>
                </div>
                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-brand-primary h-full transition-all duration-500" style={{ width: `${studentPct}%` }}></div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs mt-4">
                  <span className="text-gray-500 font-bold uppercase tracking-wider">Öğretmen</span>
                  <span className="font-black text-brand-accent">{teacherPct}%</span>
                </div>
                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-brand-accent h-full transition-all duration-500" style={{ width: `${teacherPct}%` }}></div>
                </div>
              </div>
            </div>
          </div>
          <Link href="/admin/users" className="mt-8 h-12 bg-brand-primary text-white text-[13px] font-black uppercase tracking-widest rounded-lg shadow-md shadow-[#204544]/20 hover:bg-brand-primary-dark hover:-translate-y-0.5 transition-all flex items-center justify-center text-center active:scale-95 group gap-2">
            Tümünü Yönet
            <i className="fas fa-arrow-right text-[10px] group-hover:translate-x-1 transition-transform"></i>
          </Link>
        </AdminCard>
      </div>

      {/* 4. Activity & System */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Activity Feed */}
        <AdminCard padding={true} className="min-h-[320px] max-h-[320px] flex flex-col">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-8 flex-shrink-0">Son Kayıtlar</h3>
          <div className="space-y-1 overflow-y-auto pr-2 custom-scrollbar flex-1">
            {recentUsers.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <i className="fas fa-users text-2xl mb-2"></i>
                <p className="text-sm">Henüz kayıtlı kullanıcı yok</p>
              </div>
            ) : (
              recentUsers.map((log, i) => (
                <div key={i} className="flex items-center justify-between group py-2 px-2 hover:bg-gray-50/80 rounded-lg transition-colors border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-3">
                    <Avatar name={log.name} size={32} />
                    <div className="flex flex-col">
                      <span className="text-[15px] font-bold text-gray-900 leading-tight">{log.name}</span>
                      <span className="text-[11px] text-gray-400 font-medium">{log.action}</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100">{log.time}</span>
                </div>
              ))
            )}
          </div>
        </AdminCard>

        {/* Pending Actions */}
        <div className="bg-brand-primary rounded-lg p-8 text-white flex flex-col shadow-xl shadow-[#204544]/20 relative overflow-hidden group min-h-[320px] max-h-[320px]">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-white opacity-5 rounded-full transition-transform group-hover:scale-110 duration-700 pointer-events-none"></div>
          <div className="absolute right-10 bottom-10 w-20 h-20 bg-brand-accent opacity-[0.03] rounded-full transition-transform group-hover:scale-125 duration-700 pointer-events-none"></div>

          <div className="relative z-10 flex-1 flex flex-col">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white mb-6 flex items-center gap-3">
              <i className="fas fa-bell text-brand-accent"></i> Bekleyen İşlemler
            </h3>

            {(pendingTasks.comments === 0 && pendingTasks.inquiries === 0 && pendingTasks.teachers === 0) ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center opacity-70">
                <i className="fas fa-check-circle text-4xl mb-3 text-green-400"></i>
                <p className="text-sm font-medium">Bütün işler tamamlandı!</p>
                <p className="text-[11px] mt-1">Şu an için bekleyen işlem bulunmuyor.</p>
              </div>
            ) : (
              <div className="space-y-3 flex-1">
                {pendingTasks.inquiries > 0 && (
                  <Link href="/admin/inquiries" className="flex items-center justify-between bg-white/10 hover:bg-white/20 transition-colors p-4 rounded-lg border border-white/10 group/item">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-brand-accent/20 text-brand-accent flex items-center justify-center">
                        <i className="fas fa-envelope-open-text"></i>
                      </div>
                      <div>
                        <div className="font-bold text-sm text-white">Okunmamış Mesajlar</div>
                        <div className="text-[10px] text-white/60">İletişim formundan gelen yeni mesajlar</div>
                      </div>
                    </div>
                    <span className="w-8 h-8 rounded-full bg-brand-accent text-brand-primary flex items-center justify-center font-black text-xs shadow-md group-hover/item:scale-110 transition-transform">
                      {pendingTasks.inquiries}
                    </span>
                  </Link>
                )}

                {pendingTasks.teachers > 0 && (
                  <Link href="/admin/users?tab=PENDING" className="flex items-center justify-between bg-white/10 hover:bg-white/20 transition-colors p-4 rounded-lg border border-white/10 group/item">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-green-500/20 text-green-300 flex items-center justify-center">
                        <i className="fas fa-user-clock"></i>
                      </div>
                      <div>
                        <div className="font-bold text-sm text-white">Öğretmen Başvuruları</div>
                        <div className="text-[10px] text-white/60">Onay bekleyen yeni öğretmen kayıtları</div>
                      </div>
                    </div>
                    <span className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center font-black text-xs shadow-md group-hover/item:scale-110 transition-transform">
                      {pendingTasks.teachers}
                    </span>
                  </Link>
                )}

                {pendingTasks.comments > 0 && (
                  <Link href="/admin/reviews" className="flex items-center justify-between bg-white/10 hover:bg-white/20 transition-colors p-4 rounded-lg border border-white/10 group/item">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-500/20 text-blue-300 flex items-center justify-center">
                        <i className="fas fa-comment-dots"></i>
                      </div>
                      <div>
                        <div className="font-bold text-sm text-white">Onay Bekleyen Yorumlar</div>
                        <div className="text-[10px] text-white/60">Öğrencilerin yaptığı yeni değerlendirmeler</div>
                      </div>
                    </div>
                    <span className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-black text-xs shadow-md group-hover/item:scale-110 transition-transform">
                      {pendingTasks.comments}
                    </span>
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
