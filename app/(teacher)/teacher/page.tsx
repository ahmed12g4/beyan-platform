'use client'

import { useState, useEffect } from 'react'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import Link from 'next/link'
import Avatar from '@/components/Avatar'
import { getTeacherDashboardData } from '@/lib/actions/teacher-dashboard'
import PageHeader from '@/components/admin/PageHeader'
import AdminCard from '@/components/admin/AdminCard'

// Shared StatBox Component (Consistent with Admin)
const StatBox = ({ label, value, icon, color = 'bg-brand-primary' }: any) => (
    <div className="bg-white p-5 rounded-lg border border-gray-100 shadow-sm hover:border-brand-primary/20 transition-all group relative overflow-hidden">
        <div className="absolute -right-4 -top-4 w-16 h-16 bg-gray-50 rounded-full group-hover:bg-brand-primary/5 transition-colors"></div>
        <div className="relative z-10">
            <div className="w-10 h-10 rounded-md bg-brand-primary/5 flex items-center justify-center text-brand-primary mb-3 text-sm group-hover:bg-brand-primary group-hover:text-white transition-all">
                <i className={`fas ${icon}`}></i>
            </div>
            <h4 className="text-2xl font-black text-brand-primary tracking-tight leading-none mb-1">{value}</h4>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{label}</p>
        </div>
    </div>
);

export default function TeacherDashboard() {
    const { profile, loading: userLoading } = useCurrentUser()
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchData() {
            try {
                const dashboardData = await getTeacherDashboardData();
                setData(dashboardData);
            } catch (error) {
                console.error('Failed to fetch teacher dashboard data:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    if (loading || userLoading) {
        return (
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col items-center justify-center min-h-[50vh]">
                <div className="w-8 h-8 border-4 border-brand-primary/10 border-t-brand-primary rounded-full animate-spin mb-4"></div>
                <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest">Yükleniyor...</p>
            </div>
        )
    }

    const { 
        stats = { courses: 0, students: 0, lessons: 0, groups: 0, unreadMessages: 0 }, 
        nextSession = null, 
        upcomingSessions = [], 
        activityFeed = [], 
        taughtGroups = [] 
    } = data || {};

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fadeIn">
            
            <PageHeader 
                title="Eğitmen Paneli"
                subtitle={`Hoş Geldin, ${profile?.full_name}`}
                action={
                    <div className="flex gap-2">
                        <Link href="/teacher/settings" className="w-10 h-10 bg-white border border-gray-100 rounded-lg flex items-center justify-center text-gray-400 hover:text-brand-primary transition-all shadow-sm">
                            <i className="fas fa-cog"></i>
                        </Link>
                    </div>
                }
            />

            {/* 1. Stat Row (High-Value Metrics) */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                <StatBox label="Aktif Kurslar" value={stats.courses} icon="fa-book" />
                <StatBox label="Toplam Öğrenci" value={stats.students} icon="fa-user-friends" />
                <StatBox label="Tanımlı Gruplar" value={stats.groups} icon="fa-layer-group" />
                <StatBox label="Tamamlanan Ders" value={stats.lessons} icon="fa-check-double" />
                <StatBox label="Yeni Mesajlar" value={stats.unreadMessages} icon="fa-comment-dots" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* 2. NEXT SESSION (Bold Teal Accent) */}
                <div className="space-y-6">
                    <div className="bg-brand-primary rounded-lg p-8 text-white flex flex-col shadow-xl shadow-brand-primary/20 relative overflow-hidden group min-h-[300px]">
                        <div className="absolute -right-10 -top-10 w-44 h-44 bg-white opacity-5 rounded-full group-hover:scale-110 duration-700 pointer-events-none"></div>
                        <div className="relative z-10 flex flex-col h-full">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-brand-accent mb-8 flex items-center gap-3">
                                <i className="fas fa-video animate-pulse"></i> Yayındaki Oturum
                            </h3>
                            
                            {nextSession ? (
                                <div className="flex-1 flex flex-col justify-between">
                                    <div>
                                        <h2 className="text-4xl font-black tracking-tight mb-3 leading-tight uppercase">{nextSession.title}</h2>
                                        <p className="text-white/60 text-[11px] font-black uppercase tracking-[0.2em]">{nextSession.course_title}</p>
                                    </div>
                                    <div className="mt-10 flex items-center justify-between">
                                        <div className="bg-white/10 px-5 py-3 rounded-xl border border-white/10 backdrop-blur-sm">
                                            <span className="text-2xl font-black">{new Date(nextSession.session_date).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                        <Link href={nextSession.meet_url || '#'} target="_blank" className="px-10 py-5 bg-brand-accent text-brand-primary font-black rounded-xl hover:bg-yellow-400 transition-all text-xs uppercase tracking-widest shadow-2xl shadow-brand-accent/20">
                                            DERSE KATIL <i className="fas fa-arrow-right ml-2 text-[10px]"></i>
                                        </Link>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center opacity-40 text-center border-2 border-dashed border-white/10 rounded-3xl">
                                    <i className="far fa-calendar-alt text-5xl mb-4"></i>
                                    <p className="text-sm font-black uppercase tracking-widest">Planlanmış yakın bir ders yok</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick Management Tools */}
                    <AdminCard padding={true} className="border-t-4 border-brand-primary shadow-lg">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Yönetim Merkesi</h3>
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Hızlı Erişim</span>
                        </div>
                        <div className="grid grid-cols-1 gap-3">
                             {[
                                { title: 'Grupları Yönet', icon: 'fa-users-cog', href: '/teacher/groups', sub: 'Öğrenci listeleri ve grup ayarları' },
                                { title: 'Sınavları Yönet', icon: 'fa-vial', href: '/teacher/quizzes', sub: 'Oluşturulan sınavlar ve sonuçlar' },
                                { title: 'Haftalık Takvim', icon: 'fa-calendar-alt', href: '/teacher/schedule', sub: 'Oturum planı ve zamanlama' }
                             ].map((tool, i) => (
                                 <Link key={i} href={tool.href} className="flex items-center justify-between p-4 bg-gray-50/50 hover:bg-brand-primary hover:text-white border border-gray-100 rounded-xl group transition-all group">
                                    <div className="flex items-center gap-4">
                                         <div className="w-12 h-12 bg-white text-brand-primary rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                                            <i className={`fas ${tool.icon}`}></i>
                                         </div>
                                         <div>
                                            <span className="text-sm font-black block group-hover:text-white leading-none mb-1">{tool.title}</span>
                                            <span className="text-[10px] text-gray-400 uppercase group-hover:text-white/60">{tool.sub}</span>
                                         </div>
                                    </div>
                                    <i className="fas fa-arrow-right text-gray-300 group-hover:text-white transform group-hover:translate-x-1 transition-all text-xs"></i>
                                 </Link>
                             ))}
                        </div>
                    </AdminCard>
                </div>

                {/* 3. ACTIVITY FEED & GROUPS (Right) */}
                <div className="space-y-6">
                    
                    {/* Live Activity Feed */}
                    <AdminCard padding={true} className="min-h-[380px] max-h-[380px] flex flex-col shadow-lg">
                        <div className="flex items-center justify-between mb-8 flex-shrink-0">
                             <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Canlı Sistem Akışı</h3>
                             <div className="w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
                        </div>
                        <div className="space-y-1 overflow-y-auto pr-2 flex-1 custom-scrollbar">
                            {activityFeed.length > 0 ? activityFeed.map((act: any, idx: number) => (
                                <div key={idx} className="flex items-center justify-between py-4 px-3 hover:bg-gray-50/80 rounded-xl transition-colors border-b border-gray-50 last:border-0 group">
                                     <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-[12px] shadow-sm ${act.type === 'ENROLLMENT' ? 'bg-blue-50 text-blue-500' : 'bg-brand-primary/5 text-brand-primary'}`}>
                                            <i className={`fas ${act.type === 'ENROLLMENT' ? 'fa-user-plus' : 'fa-calendar-alt'}`}></i>
                                        </div>
                                        <div>
                                            <span className="text-sm font-black text-gray-900 block leading-tight uppercase">{act.title}</span>
                                            <span className="text-[10px] text-gray-400 font-bold uppercase truncate block max-w-[200px] mt-1">{act.subtitle}</span>
                                        </div>
                                     </div>
                                     <span className="text-[10px] font-black text-gray-400 bg-gray-100 px-3 py-1 rounded-lg uppercase whitespace-nowrap">{new Date(act.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}</span>
                                </div>
                            )) : (
                                <div className="flex-1 flex flex-col items-center justify-center text-center opacity-30">
                                    <i className="fas fa-bolt text-4xl mb-4"></i>
                                    <p className="text-xs font-black uppercase tracking-widest">Henüz bir aktivite yok</p>
                                </div>
                            )}
                        </div>
                    </AdminCard>

                    {/* Groups Overview */}
                    <AdminCard padding={true} className="shadow-lg border-l-4 border-brand-accent">
                         <div className="flex items-center justify-between mb-8">
                             <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Grup Doluluk Oranları</h3>
                             <span className="text-[10px] font-black text-brand-accent uppercase tracking-widest">Gerçek Zamanlı</span>
                        </div>
                        <div className="space-y-6">
                             {taughtGroups.length > 0 ? taughtGroups.map((g: any, i: number) => (
                                 <div key={i} className="space-y-3">
                                     <div className="flex items-center justify-between text-xs">
                                         <span className="font-black text-gray-700 uppercase">{g.title}</span>
                                         <span className="font-black text-brand-primary">{g.student_count} / ∞ Öğrenci</span>
                                     </div>
                                     <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                                         <div 
                                            className="bg-brand-primary h-full rounded-full transition-all duration-1000" 
                                            style={{ width: `${Math.min((g.student_count / 20) * 100, 100)}%` }}
                                         ></div>
                                     </div>
                                 </div>
                             )) : (
                                 <p className="text-center py-10 text-gray-300 font-bold italic text-xs uppercase tracking-widest">Tanımlı grup bulunmuyor</p>
                             )}
                        </div>
                    </AdminCard>
                </div>
            </div>

            {/* Daily Tip Widget */}
            <div className="mt-8 p-8 bg-white border border-gray-100 rounded-lg flex flex-col md:flex-row items-center gap-8 group hover:border-brand-primary/20 transition-all shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/5 rounded-full blur-2xl transform translate-x-1/2 -translate-y-1/2"></div>
                <div className="w-16 h-16 bg-gray-50 text-gray-300 rounded-2xl flex items-center justify-center text-2xl group-hover:bg-brand-primary group-hover:text-white group-hover:rotate-12 transition-all shadow-sm">
                    <i className="fas fa-lightbulb"></i>
                </div>
                <div className="relative z-10 flex-1">
                     <h5 className="text-sm font-black text-brand-primary uppercase tracking-widest leading-none mb-2 decoration-brand-accent/30 underline underline-offset-4">&quot;{data.currentTip.title}&quot;</h5>
                     <p className="text-[13px] text-gray-500 font-medium leading-relaxed max-w-2xl">{data.currentTip.content}</p>
                </div>
            </div>

        </div>
    )
}
