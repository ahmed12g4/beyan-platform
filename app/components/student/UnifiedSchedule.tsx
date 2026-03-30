"use client";

import { useEffect, useState } from "react";
import { getStudentSessions } from "@/lib/actions/sessions";
import Image from "next/image";

interface Session {
    id: string;
    title: string;
    session_date: string;
    duration_minutes: number;
    meet_url: string | null;
    teacher: {
        full_name: string;
        avatar_url: string | null;
    };
    type: 'GROUP' | 'PRIVATE';
    student_name?: string;
}

interface UnifiedScheduleProps {
    initialSessions?: Session[];
    isAdmin?: boolean;
    theme?: 'light' | 'dark';
}

export default function UnifiedSchedule({ initialSessions, isAdmin = false, theme = 'light' }: UnifiedScheduleProps) {
    const [sessions, setSessions] = useState<Session[]>(initialSessions || []);
    const [loading, setLoading] = useState(!initialSessions);

    useEffect(() => {
        if (!initialSessions) {
            async function load() {
                const data = await getStudentSessions();
                setSessions(data as any);
                setLoading(false);
            }
            load();
        }
    }, [initialSessions]);

    if (loading) {
        return (
            <div className="flex flex-col gap-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className={`h-24 rounded-2xl animate-pulse ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'}`}></div>
                ))}
            </div>
        );
    }

    if (sessions.length === 0) {
        return (
            <div className={`text-center py-12 rounded-[32px] border border-dashed ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm ${theme === 'dark' ? 'bg-white/5' : 'bg-white'}`}>
                    <i className={`far fa-calendar-times text-2xl ${theme === 'dark' ? 'text-slate-500' : 'text-gray-300'}`}></i>
                </div>
                <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-500'}`}>Planlanmış ders bulunmuyor.</p>
                <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-slate-400' : 'text-gray-400'}`}>{isAdmin ? 'Henüz hiçbir ders planlanmamış.' : 'Yeni dersler için kurslarımıza veya eğitmenlerimize göz atın.'}</p>
            </div>
        );
    }

    // Group sessions by date
    const grouped = sessions.reduce((acc, s) => {
        const date = new Date(s.session_date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' });
        if (!acc[date]) acc[date] = [];
        acc[date].push(s);
        return acc;
    }, {} as Record<string, Session[]>);

    return (
        <div className="space-y-8">
            {Object.entries(grouped).map(([date, daySessions]) => (
                <div key={date} className="relative">
                    <h3 className={`text-sm font-bold uppercase tracking-widest mb-4 flex items-center gap-3 ${theme === 'dark' ? 'text-slate-400' : 'text-gray-400'}`}>
                        {date}
                        <span className={`flex-1 h-px ${theme === 'dark' ? 'bg-white/10' : 'bg-gray-100'}`}></span>
                    </h3>

                    <div className="space-y-4">
                        {daySessions.map((s) => {
                            const time = new Date(s.session_date).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
                            const isLive = new Date() >= new Date(s.session_date) &&
                                new Date() <= new Date(new Date(s.session_date).getTime() + s.duration_minutes * 60000);

                            return (
                                <div key={s.id} className={`group relative p-5 rounded-2xl border transition-all duration-300 hover:shadow-lg ${theme === 'dark' ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white border-gray-100'} ${isLive ? (theme === 'dark' ? '!border-brand-accent ring-1 ring-brand-accent/30' : 'border-brand-accent ring-1 ring-brand-accent/20') : ''}`}>
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                        {/* Time Box */}
                                        <div className="flex-shrink-0 w-20 text-center">
                                            <div className={`text-xl font-black ${theme === 'dark' ? 'text-white' : 'text-brand-primary'}`}>{time}</div>
                                            <div className={`text-[10px] font-bold uppercase ${theme === 'dark' ? 'text-slate-400' : 'text-gray-400'}`}>{s.duration_minutes} DK</div>
                                        </div>

                                        {/* Divider */}
                                        <div className={`hidden sm:block w-px h-10 ${theme === 'dark' ? 'bg-white/10' : 'bg-gray-100'}`}></div>

                                        {/* Content */}
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${s.type === 'PRIVATE' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                                                    {s.type === 'PRIVATE' ? 'Birebir Ders' : 'Grup Dersi'}
                                                </span>
                                                {isLive && (
                                                    <span className="flex items-center gap-1 text-[9px] font-black text-red-600 animate-pulse uppercase tracking-wider">
                                                        <span className="w-1.5 h-1.5 bg-red-600 rounded-full"></span> Şimdi Canlı
                                                    </span>
                                                )}
                                            </div>
                                            <h4 className={`text-lg font-bold transition-colors ${theme === 'dark' ? 'text-white group-hover:text-brand-accent' : 'text-gray-900 group-hover:text-brand-primary'}`}>{s.title}</h4>

                                            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-2">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-6 h-6 rounded-full overflow-hidden relative shadow-sm border ${theme === 'dark' ? 'bg-white/10 border-transparent' : 'bg-gray-100 border-white'}`}>
                                                        {s.teacher.avatar_url ? (
                                                            <Image src={s.teacher.avatar_url} alt={s.teacher.full_name} fill className="object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-[10px] bg-brand-primary text-white font-black">{s.teacher.full_name.charAt(0)}</div>
                                                        )}
                                                    </div>
                                                    <span className={`text-xs font-bold tracking-tight ${theme === 'dark' ? 'text-slate-400' : 'text-gray-500'}`}>Eğitmen: <span className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>{s.teacher.full_name}</span></span>
                                                </div>

                                                {isAdmin && s.student_name && (
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-6 h-6 rounded-full bg-brand-accent/20 flex items-center justify-center">
                                                            <i className="fas fa-user-graduate text-[10px] text-brand-primary"></i>
                                                        </div>
                                                        <span className={`text-xs font-bold tracking-tight ${theme === 'dark' ? 'text-slate-400' : 'text-gray-500'}`}>Öğrenci: <span className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>{s.student_name}</span></span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Action */}
                                        <div className="w-full sm:w-auto mt-4 sm:mt-0">
                                            {s.meet_url ? (
                                                <a
                                                    href={s.meet_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className={`block w-full text-center px-6 py-2.5 rounded-xl font-bold transition-all ${isLive ? 'bg-brand-accent text-brand-primary hover:bg-[#ffe680] shadow-lg shadow-brand-accent/20 text-xs' : (theme === 'dark' ? 'bg-white/5 text-white hover:bg-white/10 text-xs' : 'bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600 text-xs')}`}
                                                >
                                                    {isLive ? 'Derse Katıl' : 'Bekleniyor'}
                                                </a>
                                            ) : (
                                                <button disabled className={`w-full px-6 py-2.5 rounded-xl font-bold cursor-not-allowed border text-xs ${theme === 'dark' ? 'bg-white/5 text-slate-500 border-white/5' : 'bg-gray-50 text-gray-300 border-gray-100'}`}>
                                                    Link Bekleniyor
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
}
