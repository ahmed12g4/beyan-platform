'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { getDetailedTeacherSessions, deleteAvailabilityAction, startSession, endSession } from '@/lib/actions/sessions'
import AvailabilityModal from '@/app/components/AvailabilityModal'
import CreateLiveSessionModal from '@/app/components/CreateLiveSessionModal'
import { toast } from 'react-hot-toast'
import Image from 'next/image'

export default function TeacherSchedulePage() {
    const { profile, loading: userLoading } = useCurrentUser()
    const [availability, setAvailability] = useState<any[]>([])
    const [sessions, setSessions] = useState<any[]>([])
    const [courses, setCourses] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isLiveModalOpen, setIsLiveModalOpen] = useState(false)
    const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
        const d = new Date()
        const day = d.getDay()
        const diff = d.getDate() - day // Sunday
        return new Date(new Date().setDate(diff))
    })

    const fetchData = useCallback(async (start: Date) => {
        if (!profile?.id) return
        setLoading(true)
        
        const end = new Date(start)
        end.setDate(end.getDate() + 7)

        try {
            const data = await getDetailedTeacherSessions({
                startDate: start.toISOString(),
                endDate: end.toISOString()
            })
            setAvailability(data.availability || [])
            setSessions(data.sessions || [])

            // Fetch teacher courses for the modal
            const supabase = createClient()
            const { data: teacherCourses } = await (supabase
                .from('courses') as any)
                .select('id, title')
                .eq('teacher_id', profile.id)
            setCourses(teacherCourses || [])

        } catch (err) {
            console.error("Error fetching teacher schedule:", err)
            toast.error("Program yüklenirken bir hata oluştu.")
        } finally {
            setLoading(false)
        }
    }, [profile])

    useEffect(() => {
        if (!userLoading && profile) {
            fetchData(currentWeekStart)
        }
    }, [userLoading, profile, currentWeekStart, fetchData])

    const navigateWeek = (dir: number) => {
        const d = new Date(currentWeekStart)
        d.setDate(d.getDate() + (dir * 7))
        setCurrentWeekStart(d)
    }

    const handleDeleteAvail = async (id: string) => {
        if (!confirm('Bu müsaitlik dilimini silmek istediğinize emin misiniz?')) return
        const res = await deleteAvailabilityAction(id)
        if (res.success) {
            toast.success('Müsaitlik silindi.')
            fetchData(currentWeekStart)
        }
    }

    const handleStartSession = async (id: string) => {
        const res = await startSession(id)
        if (res.success) {
            toast.success("Ders başlatıldı!")
            fetchData(currentWeekStart)
        }
    }

    const handleEndSession = async (id: string) => {
        const res = await endSession(id)
        if (res.success) {
            toast.success("Ders sonlandırıldı.")
            fetchData(currentWeekStart)
        }
    }

    const weekDays = Array.from({ length: 7 }).map((_, i) => {
        const d = new Date(currentWeekStart)
        d.setDate(d.getDate() + i)
        return d
    })

    if (userLoading || (loading && !sessions.length && !availability.length)) {
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
                            <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center">
                                <i className="fas fa-calendar-check text-2xl text-amber-600"></i>
                            </div>
                            <div>
                                <h1 className="text-2xl font-black text-gray-900 tracking-tight">Eğitmen Paneli: Program</h1>
                                <p className="text-gray-500 text-sm font-medium">Müsaitlik durumunuzu ve derslerinizi buradan yönetin.</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 bg-gray-50 p-1.5 rounded-2xl border border-gray-100">
                            <button onClick={() => navigateWeek(-1)} className="w-10 h-10 flex items-center justify-center hover:bg-white hover:shadow-sm rounded-xl transition-all text-gray-400 hover:text-brand-primary">
                                <i className="fas fa-chevron-left"></i>
                            </button>
                            <span className="px-5 py-2 text-sm font-black text-gray-600">
                                {weekDays[0].toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })} - {weekDays[6].toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                            </span>
                            <button onClick={() => navigateWeek(1)} className="w-10 h-10 flex items-center justify-center hover:bg-white hover:shadow-sm rounded-xl transition-all text-gray-400 hover:text-brand-primary">
                                <i className="fas fa-chevron-right"></i>
                            </button>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setIsLiveModalOpen(true)}
                                className="px-6 py-3 bg-brand-primary text-white font-black rounded-xl hover:bg-brand-primary-dark transition-all shadow-lg shadow-brand-primary/20 flex items-center gap-2"
                            >
                                <i className="fas fa-video"></i> Canlı Ders Planla
                            </button>
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="px-6 py-3 bg-emerald-500 text-white font-black rounded-xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2"
                            >
                                <i className="fas fa-plus"></i> Müsaitlik Ekle
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                {/* Desktop Grid */}
                <div className="hidden lg:block bg-white rounded-[40px] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden mb-12">
                    <div className="grid grid-cols-7 border-b border-gray-100">
                        {['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'].map((day, idx) => {
                            const isToday = weekDays[idx].toDateString() === new Date().toDateString();
                            return (
                                <div key={day} className={`py-6 text-center border-l first:border-l-0 border-gray-50 ${isToday ? 'bg-brand-primary/[0.02]' : ''}`}>
                                    <div className={`text-[10px] font-black uppercase tracking-[0.2em] mb-1 ${isToday ? 'text-brand-primary' : 'text-gray-400'}`}>{day}</div>
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
                            const daySessions = sessions.filter(s => s.session_date.split('T')[0] === dateStr)
                            const dayAvails = availability.filter(a => a.day_of_week === day.getDay())
                            const isToday = day.toDateString() === new Date().toDateString();

                            return (
                                <div key={idx} className={`border-l first:border-l-0 border-gray-50 p-4 min-h-[150px] transition-colors ${isToday ? 'bg-brand-primary/[0.01]' : 'hover:bg-gray-50/30'}`}>
                                    <div className="space-y-3">
                                        {/* 1. Booked Sessions */}
                                        {daySessions.map(session => (
                                            <div
                                                key={session.id}
                                                className={`group p-4 rounded-2xl border transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${session.type === 'PRIVATE'
                                                    ? 'bg-blue-50/50 border-blue-100'
                                                    : 'bg-indigo-50/50 border-indigo-100'
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${session.type === 'PRIVATE' ? 'bg-blue-100 text-blue-700' : 'bg-indigo-100 text-indigo-700'}`}>
                                                        {session.type === 'PRIVATE' ? 'Özel' : 'Grup'}
                                                    </span>
                                                    <span className="text-[9px] font-bold text-gray-500">{session.start_time}</span>
                                                </div>
                                                <h4 className="text-[10px] font-bold text-gray-900 mb-2 truncate">{session.title}</h4>
                                                {session.type === 'PRIVATE' && (
                                                    <div className="flex items-center gap-1.5 pt-2 border-t border-gray-100/30">
                                                        <div className="w-4 h-4 rounded-full overflow-hidden bg-white border border-gray-100 flex-shrink-0">
                                                            {session.student_avatar ? (
                                                                <Image src={session.student_avatar} alt={session.student_name} width={16} height={16} className="object-cover" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center bg-brand-primary text-[6px] text-white font-black">{session.student_name?.charAt(0)}</div>
                                                            )}
                                                        </div>
                                                        <span className="text-[8px] font-medium text-gray-500 truncate">{session.student_name}</span>
                                                    </div>
                                                )}
                                            </div>
                                        ))}

                                        {/* 2. Availability Slots */}
                                        {dayAvails.map(avail => (
                                            <div
                                                key={avail.id}
                                                className="group p-3 rounded-xl border border-emerald-100 bg-emerald-50/30 hover:bg-emerald-50 transition-all relative"
                                            >
                                                <div className="text-[9px] font-black text-emerald-700">{avail.start_time.substring(0, 5)} - {avail.end_time.substring(0, 5)}</div>
                                                <div className="text-[8px] font-bold text-emerald-500 uppercase tracking-tighter">Boş Müsaitlik</div>
                                                <button
                                                    onClick={() => handleDeleteAvail(avail.id)}
                                                    className="absolute -top-1 -right-1 w-5 h-5 bg-white border border-red-100 text-red-400 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center hover:bg-red-50 hover:text-red-600 transition-all shadow-sm"
                                                >
                                                    <i className="fas fa-times text-[8px]"></i>
                                                </button>
                                            </div>
                                        ))}

                                        {daySessions.length === 0 && dayAvails.length === 0 && (
                                            <div className="py-10 text-center opacity-10">
                                                <i className="fas fa-calendar-minus text-gray-300 text-lg"></i>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Details List View */}
                <div className="space-y-8">
                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-8 bg-brand-primary rounded-full"></div>
                            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Ders Detayları</h2>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {loading && !sessions.length ? (
                            Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className="bg-white p-6 rounded-[32px] border border-gray-100 h-48 animate-pulse"></div>
                            ))
                        ) : sessions.length > 0 ? sessions.map(session => (
                            <div key={session.id} className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.06)] transition-all duration-500 group">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex flex-col gap-1">
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${session.type === 'PRIVATE' ? 'text-blue-500' : 'text-indigo-500'}`}>
                                            {session.type === 'PRIVATE' ? 'Birebir Ders' : 'Grup Dersi'}
                                        </span>
                                        <h3 className="text-lg font-black text-gray-900">{session.title}</h3>
                                    </div>
                                    <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                        session.status === 'LIVE' ? 'bg-red-100 text-red-600 animate-pulse' : 
                                        session.status === 'ENDED' ? 'bg-gray-100 text-gray-500' : 
                                        'bg-brand-primary/10 text-brand-primary'
                                    }`}>
                                        {session.status === 'LIVE' ? 'CANLI' : session.status === 'ENDED' ? 'TAMAMLANDI' : 'GELECEK'}
                                    </div>
                                </div>

                                <div className="space-y-4 mb-8">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400">
                                            <i className="far fa-clock"></i>
                                        </div>
                                        <div>
                                            <div className="text-xs font-bold text-gray-900">{new Date(session.session_date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' })}</div>
                                            <div className="text-[10px] text-gray-400 font-bold uppercase">{session.start_time} - {session.end_time || '--:--'}</div>
                                        </div>
                                    </div>

                                    {session.type === 'PRIVATE' && (
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-50 border border-gray-100 flex-shrink-0">
                                                {session.student_avatar ? (
                                                    <Image src={session.student_avatar} alt={session.student_name} width={40} height={40} className="object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-brand-primary text-white font-black">{session.student_name?.charAt(0)}</div>
                                                )}
                                            </div>
                                            <div>
                                                <div className="text-xs font-bold text-gray-900">{session.student_name}</div>
                                                <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Öğrenci</div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-3">
                                    {session.status === 'SCHEDULED' || session.status === 'CONFIRMED' ? (
                                        <button
                                            onClick={() => handleStartSession(session.id)}
                                            className="flex-1 py-4 bg-brand-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-primary-dark transition-all shadow-lg shadow-brand-primary/20"
                                        >
                                            Dersi Başlat
                                        </button>
                                    ) : session.status === 'LIVE' ? (
                                        <>
                                            <a
                                                href={session.meet_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex-1 py-4 bg-red-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest text-center shadow-lg shadow-red-200"
                                            >
                                                Sınıfa Gir
                                            </a>
                                            <button
                                                onClick={() => handleEndSession(session.id)}
                                                className="flex-1 py-4 bg-gray-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest"
                                            >
                                                Bitir
                                            </button>
                                        </>
                                    ) : (
                                        <button disabled className="flex-1 py-4 bg-gray-100 text-gray-400 rounded-2xl text-[10px] font-black uppercase tracking-widest cursor-not-allowed">
                                            Ders Tamamlandı
                                        </button>
                                    )}
                                </div>
                            </div>
                        )) : (
                            <div className="col-span-full py-20 bg-white rounded-[40px] border border-dashed border-gray-200 text-center">
                                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <i className="far fa-calendar-times text-3xl text-gray-300"></i>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Henüz dersiniz yok</h3>
                                <p className="text-gray-500 max-w-sm mx-auto text-sm">Seçili tarihlerde herhangi bir dersiniz veya müsaitliğiniz bulunmuyor.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <AvailabilityModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={() => fetchData(currentWeekStart)}
            />
            {profile?.id && (
                <CreateLiveSessionModal
                    isOpen={isLiveModalOpen}
                    onClose={() => {
                        setIsLiveModalOpen(false)
                        fetchData(currentWeekStart)
                    }}
                    teacherId={profile.id}
                    courses={courses}
                />
            )}
        </div>
    )
}
