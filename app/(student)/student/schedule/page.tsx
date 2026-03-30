'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { getStudentSessions } from '@/lib/actions/sessions'
import Image from 'next/image'
import { toast } from 'react-hot-toast'

type CalendarEvent = {
    id: string;
    title: string;
    date: string;
    startTime: string;
    endTime: string;
    type: 'PRIVATE' | 'GROUP';
    teacherName: string;
    teacherAvatar?: string;
    meetLink?: string;
    status: string;
    duration: number;
}

export default function StudentSchedulePage() {
    const { user, loading: authLoading } = useCurrentUser()
    const [events, setEvents] = useState<CalendarEvent[]>([])
    const [loading, setLoading] = useState(true)
    const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
        const d = new Date()
        const day = d.getDay()
        const diff = d.getDate() - day // Sunday
        return new Date(new Date().setDate(diff))
    })

    const fetchSchedule = useCallback(async (start: Date) => {
        if (!user) return;
        setLoading(true)
        
        const end = new Date(start)
        end.setDate(end.getDate() + 7)

        try {
            const allSessions = await getStudentSessions({
                startDate: start.toISOString(),
                endDate: end.toISOString()
            })

            const calendarEvents: CalendarEvent[] = (allSessions || []).map((s: any) => ({
                id: s.id,
                title: s.type === 'PRIVATE' ? 'Birebir Özel Ders' : (s.title || s.course?.title || 'Grup Dersi'),
                date: s.session_date.split('T')[0],
                startTime: s.session_date.split('T')[1].substring(0, 5),
                endTime: '', // Calculated below
                type: s.type as 'PRIVATE' | 'GROUP',
                teacherName: s.teacher?.full_name || 'Eğitmen',
                teacherAvatar: s.teacher?.avatar_url,
                meetLink: s.meet_url,
                status: s.status || 'SCHEDULED',
                duration: s.duration_minutes || 60
            }));

            // Calculate end times
            calendarEvents.forEach(e => {
                const [h, m] = e.startTime.split(':').map(Number);
                const totalMinutes = h * 60 + m + e.duration;
                const endH = Math.floor(totalMinutes / 60) % 24;
                const endM = totalMinutes % 60;
                e.endTime = `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;
            });

            setEvents(calendarEvents)
        } catch (err) {
            console.error("Error fetching schedule:", err)
            toast.error("Program yüklenirken bir hata oluştu.")
        } finally {
            setLoading(false)
        }
    }, [user])

    useEffect(() => {
        if (!authLoading && user) {
            fetchSchedule(currentWeekStart)
        }
    }, [user, authLoading, currentWeekStart, fetchSchedule])

    const weekDays = Array.from({ length: 7 }).map((_, i) => {
        const d = new Date(currentWeekStart)
        d.setDate(d.getDate() + i)
        return d
    })

    const navigateWeek = (dir: number) => {
        const d = new Date(currentWeekStart)
        d.setDate(d.getDate() + (dir * 7))
        setCurrentWeekStart(d)
    }

    const goToToday = () => {
        const d = new Date()
        const day = d.getDay()
        const diff = d.getDate() - day
        setCurrentWeekStart(new Date(new Date().setDate(diff)))
    }

    if (authLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="w-12 h-12 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin"></div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#f8fafc] pb-20">
            {/* Header Section */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-brand-primary/10 rounded-2xl flex items-center justify-center">
                                <i className="fas fa-calendar-alt text-2xl text-brand-primary"></i>
                            </div>
                            <div>
                                <h1 className="text-2xl font-black text-gray-900 tracking-tight">Ders Programı</h1>
                                <p className="text-gray-500 text-sm font-medium">Haftalık ders planınızı ve canlı oturumlarınızı takip edin.</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 bg-gray-50 p-1.5 rounded-2xl border border-gray-100">
                            <button onClick={() => navigateWeek(-1)} className="w-10 h-10 flex items-center justify-center hover:bg-white hover:shadow-sm rounded-xl transition-all text-gray-400 hover:text-brand-primary">
                                <i className="fas fa-chevron-left"></i>
                            </button>
                            <button onClick={goToToday} className="px-5 py-2 hover:bg-white hover:shadow-sm rounded-xl transition-all text-sm font-black text-gray-600 hover:text-brand-primary">
                                Bugün
                            </button>
                            <button onClick={() => navigateWeek(1)} className="w-10 h-10 flex items-center justify-center hover:bg-white hover:shadow-sm rounded-xl transition-all text-gray-400 hover:text-brand-primary">
                                <i className="fas fa-chevron-right"></i>
                            </button>
                        </div>

                        <Link href="/student" className="hidden md:flex px-6 py-3 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-all items-center gap-2 shadow-sm">
                            <i className="fas fa-arrow-left"></i>
                            Geri Dön
                        </Link>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                {/* Calendar Desktop View */}
                <div className="hidden lg:block bg-white rounded-[40px] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden mb-12">
                    <div className="grid grid-cols-7 border-b border-gray-100">
                        {['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'].map((day, idx) => {
                            const isToday = weekDays[idx].toDateString() === new Date().toDateString();
                            return (
                                <div key={day} className={`py-6 text-center border-l first:border-l-0 border-gray-50 ${isToday ? 'bg-brand-primary/[0.02]' : ''}`}>
                                    <div className={`text-[10px] font-black uppercase tracking-[0.2em] mb-2 ${isToday ? 'text-brand-primary' : 'text-gray-400'}`}>{day}</div>
                                    <div className={`text-2xl font-black ${isToday ? 'text-brand-primary' : 'text-gray-900'}`}>{weekDays[idx].getDate()}</div>
                                </div>
                            )
                        })}
                    </div>

                    <div className="grid grid-cols-7 min-h-[600px] relative">
                        {loading && (
                            <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-10 flex items-center justify-center">
                                <div className="w-10 h-10 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin"></div>
                            </div>
                        )}
                        {weekDays.map((day, idx) => {
                            const dateStr = day.toISOString().split('T')[0]
                            const dayEvents = events.filter(e => e.date === dateStr)
                            const isToday = day.toDateString() === new Date().toDateString();

                            return (
                                <div key={idx} className={`border-l first:border-l-0 border-gray-50 p-4 min-h-[150px] transition-colors ${isToday ? 'bg-brand-primary/[0.01]' : 'hover:bg-gray-50/30'}`}>
                                    <div className="space-y-3">
                                        {dayEvents.length > 0 ? dayEvents.map(event => (
                                            <div
                                                key={event.id}
                                                className={`group p-4 rounded-2xl border transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${event.type === 'PRIVATE'
                                                    ? 'bg-blue-50/50 border-blue-100 hover:bg-blue-50'
                                                    : 'bg-emerald-50/50 border-emerald-100 hover:bg-emerald-50'
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${event.type === 'PRIVATE' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                                        {event.type === 'PRIVATE' ? 'Özel' : 'Grup'}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-gray-500">{event.startTime}</span>
                                                </div>
                                                <h4 className="text-xs font-bold text-gray-900 mb-2 truncate group-hover:text-brand-primary transition-colors">{event.title}</h4>
                                                <div className="flex items-center gap-1.5 pt-2 border-t border-gray-100/50">
                                                    <div className="w-5 h-5 rounded-full overflow-hidden bg-white border border-gray-100 flex-shrink-0">
                                                        {event.teacherAvatar ? (
                                                            <Image src={event.teacherAvatar} alt={event.teacherName} width={20} height={20} className="object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center bg-brand-primary text-[8px] text-white font-black">{event.teacherName.charAt(0)}</div>
                                                        )}
                                                    </div>
                                                    <span className="text-[9px] font-medium text-gray-500 truncate">{event.teacherName}</span>
                                                </div>
                                                {event.meetLink && (
                                                    <a
                                                        href={event.meetLink}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="mt-3 w-full py-2 bg-white border border-gray-200 rounded-lg text-[9px] font-black text-center block hover:bg-brand-primary hover:border-brand-primary hover:text-white transition-all shadow-sm"
                                                    >
                                                        Sınıfa Katıl
                                                    </a>
                                                )}
                                            </div>
                                        )) : (
                                            <div className="py-10 text-center opacity-20 grayscale scale-75 group-hover:grayscale-0 group-hover:opacity-100 transition-all">
                                                <i className="fas fa-coffee text-gray-300 text-xl"></i>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* List View / Mobile View */}
                <div className="space-y-8">
                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-8 bg-brand-accent rounded-full mb-1"></div>
                            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Haftalık Detaylar</h2>
                        </div>
                        <span className="text-xs font-bold text-gray-400 bg-white px-4 py-2 rounded-full border border-gray-100">
                            {events.length} Toplam Ders
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {loading && !events.length ? (
                            Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className="bg-white p-6 rounded-[32px] border border-gray-100 h-48 animate-pulse"></div>
                            ))
                        ) : events.length > 0 ? events
                            .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime))
                            .map(event => {
                                const isLive = event.status === 'LIVE';
                                const isFinished = event.status === 'ENDED';
                                
                                return (
                                    <div key={event.id} className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-500 group relative overflow-hidden">
                                        <div className={`absolute top-0 right-0 w-32 h-32 opacity-[0.03] rounded-full blur-3xl group-hover:scale-150 transition-all duration-700 ${event.type === 'PRIVATE' ? 'bg-blue-500' : 'bg-emerald-500'}`}></div>
                                        
                                        <div className="relative z-10">
                                            <div className="flex justify-between items-start mb-6">
                                                <div className="flex flex-col gap-1">
                                                    <span className={`text-[10px] font-black uppercase tracking-widest ${event.type === 'PRIVATE' ? 'text-blue-500' : 'text-emerald-500'}`}>
                                                        {event.type === 'PRIVATE' ? 'Birebir Ders' : 'Grup Dersi'}
                                                    </span>
                                                    <h3 className="text-lg font-black text-gray-900 group-hover:text-brand-primary transition-colors">{event.title}</h3>
                                                </div>
                                                <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                                    isLive ? 'bg-red-100 text-red-600 animate-pulse' : 
                                                    isFinished ? 'bg-gray-100 text-gray-500' : 
                                                    'bg-brand-primary/10 text-brand-primary'
                                                }`}>
                                                    {isLive ? 'CANLI' : isFinished ? 'BİTTİ' : 'GELECEK'}
                                                </div>
                                            </div>

                                            <div className="space-y-4 mb-8">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 group-hover:bg-brand-primary group-hover:text-white transition-all">
                                                        <i className="far fa-calendar"></i>
                                                    </div>
                                                    <div>
                                                        <div className="text-xs font-bold text-gray-900">{new Date(event.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' })}</div>
                                                        <div className="text-[10px] text-gray-400 font-bold uppercase">{event.startTime} - {event.endTime} ({event.duration} Dakika)</div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-50 border border-gray-100 flex-shrink-0">
                                                        {event.teacherAvatar ? (
                                                            <Image src={event.teacherAvatar} alt={event.teacherName} width={40} height={40} className="object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center bg-brand-primary text-white font-black">{event.teacherName.charAt(0)}</div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="text-xs font-bold text-gray-900">{event.teacherName}</div>
                                                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Eğitmen</div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex gap-3">
                                                {event.meetLink && !isFinished ? (
                                                    <a
                                                        href={event.meetLink}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className={`flex-1 py-4 rounded-2xl text-center font-black text-xs transition-all flex items-center justify-center gap-2 shadow-lg ${
                                                            isLive 
                                                            ? 'bg-red-600 text-white hover:bg-red-700 shadow-red-200' 
                                                            : 'bg-brand-primary text-white hover:bg-brand-primary-dark shadow-brand-primary/20'
                                                        }`}
                                                    >
                                                        <i className="fas fa-video text-[10px]"></i>
                                                        Sınıfa Katıl
                                                    </a>
                                                ) : (
                                                    <button disabled className="flex-1 py-4 bg-gray-100 text-gray-400 rounded-2xl text-[10px] font-black uppercase tracking-widest cursor-not-allowed">
                                                        {isFinished ? 'Ders Tamamlandı' : 'Link Bekleniyor'}
                                                    </button>
                                                )}
                                                <button className="w-14 h-14 bg-gray-50 border border-gray-100 text-gray-400 rounded-2xl flex items-center justify-center hover:bg-white hover:text-brand-primary hover:shadow-md transition-all">
                                                    <i className="far fa-bell text-lg"></i>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )
                            }) : (
                            <div className="col-span-full py-20 bg-white rounded-[40px] border border-dashed border-gray-200 text-center">
                                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <i className="far fa-calendar-times text-3xl text-gray-300"></i>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Planlı ders bulunmuyor</h3>
                                <p className="text-gray-500 max-w-sm mx-auto text-sm">Seçili tarihlerde herhangi bir dersiniz bulunmuyor. Yeni dersler için kurslarımıza göz atabilirsiniz.</p>
                                <Link href="/courses" className="inline-block mt-8 px-8 py-3 bg-brand-primary text-white font-black rounded-xl hover:bg-brand-primary-dark transition-all">
                                    Kursları Keşfet
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

