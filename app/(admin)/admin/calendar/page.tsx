'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { getAdminWeeklySessions } from '@/lib/actions/sessions'
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
    studentName?: string;
    studentAvatar?: string;
    meetLink?: string;
    status: string;
    duration: number;
}

export default function AdminCalendarPage() {
    const [events, setEvents] = useState<CalendarEvent[]>([])
    const [loading, setLoading] = useState(true)
    const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
        const d = new Date()
        const day = d.getDay()
        const diff = d.getDate() - day // Sunday start
        return new Date(new Date().setDate(diff))
    })

    const fetchSchedule = useCallback(async (start: Date) => {
        setLoading(true)
        const end = new Date(start)
        end.setDate(end.getDate() + 7)

        try {
            const data = await getAdminWeeklySessions(start.toISOString(), end.toISOString())
            
            const calendarEvents: CalendarEvent[] = (data || []).map((s: any) => ({
                id: s.id,
                title: s.title || s.course?.title || 'Ders',
                date: s.session_date.split('T')[0],
                startTime: s.session_date.split('T')[1].substring(0, 5),
                endTime: '', // Calculated
                type: s.type as 'PRIVATE' | 'GROUP',
                teacherName: s.teacher?.full_name || 'Eğitmen',
                teacherAvatar: s.teacher?.avatar_url,
                studentName: s.student?.full_name,
                studentAvatar: s.student?.avatar_url,
                meetLink: s.meet_url,
                status: s.status || 'SCHEDULED',
                duration: s.duration_minutes || 60
            }));

            // Calc end times
            calendarEvents.forEach(e => {
                const [h, m] = e.startTime.split(':').map(Number);
                const totalMinutes = h * 60 + m + e.duration;
                const endH = Math.floor(totalMinutes / 60) % 24;
                const endM = totalMinutes % 60;
                e.endTime = `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;
            });

            setEvents(calendarEvents)
        } catch (err) {
            console.error("Error fetching admin schedule:", err)
            toast.error("Takvim verileri yüklenirken bir hata oluştu.")
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchSchedule(currentWeekStart)
    }, [currentWeekStart, fetchSchedule])

    const weekDays = useMemo(() => {
        return Array.from({ length: 7 }).map((_, i) => {
            const d = new Date(currentWeekStart)
            d.setDate(d.getDate() + i)
            return d
        })
    }, [currentWeekStart])

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

    return (
        <div className="min-h-screen bg-[#FDFDFE] pb-20">
            {/* Header Section */}
            <div className="bg-white border-b border-gray-100 sticky top-0 z-30 shadow-sm px-6 py-8 sm:px-10">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="text-right">
                        <div className="flex items-center gap-4 mb-2">
                            <div className="w-12 h-12 bg-brand-primary/10 rounded-2xl flex items-center justify-center">
                                <i className="fas fa-calendar-alt text-2xl text-brand-primary"></i>
                            </div>
                            <div>
                                <h1 className="text-2xl font-black text-gray-900 tracking-tight">Master Takvim</h1>
                                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Platform Genel Programı ve Seans Takibi</p>
                            </div>
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

                    <div className="flex gap-4">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-[9px] font-black uppercase">
                            <i className="fas fa-circle text-[6px]"></i> Özel Ders
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] font-black uppercase">
                            <i className="fas fa-circle text-[6px]"></i> Grup/Canlı
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                {/* Desktop Grid View */}
                <div className="hidden lg:block bg-white rounded-[40px] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] overflow-hidden mb-12">
                    <div className="grid grid-cols-7 border-b border-gray-100">
                        {['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'].map((day, idx) => {
                            const isToday = weekDays[idx].toDateString() === new Date().toDateString();
                            return (
                                <div key={day} className={`py-6 text-center border-l first:border-l-0 border-gray-50 ${isToday ? 'bg-brand-primary/[0.02]' : ''}`}>
                                    <div className={`text-[9px] font-black uppercase tracking-[0.2em] mb-2 ${isToday ? 'text-brand-primary' : 'text-gray-400'}`}>{day}</div>
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
                                <div key={idx} className={`border-l first:border-l-0 border-gray-50 p-3 min-h-[150px] transition-colors ${isToday ? 'bg-brand-primary/[0.01]' : 'hover:bg-gray-50/30'}`}>
                                    <div className="space-y-3">
                                        {dayEvents.length > 0 ? dayEvents.map(event => (
                                            <div
                                                key={event.id}
                                                className={`group p-3 rounded-2xl border transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${event.type === 'PRIVATE'
                                                    ? 'bg-blue-50/40 border-blue-100 hover:bg-blue-50'
                                                    : 'bg-emerald-50/40 border-emerald-100 hover:bg-emerald-50'
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider ${event.type === 'PRIVATE' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                                        {event.type === 'PRIVATE' ? 'Özel' : 'Grup'}
                                                    </span>
                                                    <span className="text-[9px] font-bold text-gray-500">{event.startTime}</span>
                                                </div>
                                                <h4 className="text-[11px] font-black text-gray-900 mb-2 truncate group-hover:text-brand-primary transition-colors leading-tight">{event.title}</h4>
                                                
                                                <div className="space-y-1.5">
                                                    {/* Teacher */}
                                                    <div className="flex items-center gap-1.5">
                                                        <div className="w-4 h-4 rounded-full overflow-hidden bg-white border border-gray-100 flex-shrink-0 relative">
                                                            {event.teacherAvatar ? (
                                                                <Image src={event.teacherAvatar} alt={event.teacherName} fill className="object-cover" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center bg-brand-primary text-[6px] text-white font-black">{event.teacherName.charAt(0)}</div>
                                                            )}
                                                        </div>
                                                        <span className="text-[8px] font-bold text-gray-400 truncate"><span className="text-gray-600">Hoca:</span> {event.teacherName}</span>
                                                    </div>
                                                    
                                                    {/* Student (if Private) */}
                                                    {event.type === 'PRIVATE' && event.studentName && (
                                                        <div className="flex items-center gap-1.5">
                                                            <div className="w-4 h-4 rounded-full overflow-hidden bg-white border border-gray-100 flex-shrink-0 relative">
                                                                {event.studentAvatar ? (
                                                                    <Image src={event.studentAvatar} alt={event.studentName} fill className="object-cover" />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center bg-brand-accent text-[6px] text-brand-primary font-black">{event.studentName.charAt(0)}</div>
                                                                )}
                                                            </div>
                                                            <span className="text-[8px] font-bold text-gray-400 truncate"><span className="text-gray-600">Öğr:</span> {event.studentName}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )) : (
                                            <div className="py-10 text-center opacity-10">
                                                <i className="fas fa-calendar-day text-gray-300 text-lg"></i>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Mobile / List View */}
                <div className="lg:hidden space-y-6">
                    {loading && events.length === 0 ? (
                        Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="bg-white p-6 rounded-[32px] border border-gray-100 h-48 animate-pulse"></div>
                        ))
                    ) : events.length > 0 ? (
                        events.sort((a,b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime)).map(event => (
                            <div key={event.id} className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex flex-col gap-4">
                                <div className="flex justify-between items-start">
                                    <div className="flex flex-col gap-1">
                                        <span className={`text-[9px] font-black uppercase tracking-widest ${event.type === 'PRIVATE' ? 'text-blue-500' : 'text-emerald-500'}`}>
                                            {event.type === 'PRIVATE' ? 'Birebir Özel Ders' : 'Grup Canlı Ders'}
                                        </span>
                                        <h3 className="text-base font-black text-gray-900">{event.title}</h3>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs font-black text-gray-900">{event.startTime}</div>
                                        <div className="text-[9px] font-bold text-gray-400 uppercase">{event.duration} DK</div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-50">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-xl overflow-hidden relative border border-gray-100">
                                            {event.teacherAvatar ? <Image src={event.teacherAvatar} alt="" fill className="object-cover" /> : <div className="w-full h-full bg-brand-primary" />}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter">Eğitmen</span>
                                            <span className="text-[10px] font-black text-gray-900 truncate">{event.teacherName}</span>
                                        </div>
                                    </div>
                                    {event.studentName && (
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-xl overflow-hidden relative border border-gray-100">
                                                {event.studentAvatar ? <Image src={event.studentAvatar} alt="" fill className="object-cover" /> : <div className="w-full h-full bg-brand-accent" />}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter">Öğrenci</span>
                                                <span className="text-[10px] font-black text-gray-900 truncate">{event.studentName}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-20 bg-white rounded-[32px] border border-dashed border-gray-100">
                            <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Bu hafta için ders bulunmuyor</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
