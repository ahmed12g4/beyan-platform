'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { cancelBookingAction, startSession } from '@/lib/actions/sessions'
import { toast } from 'react-hot-toast'
import ConfirmationModal from '@/components/ui/ConfirmationModal'
import AttendanceModal from '@/components/teacher/AttendanceModal'

type TabType = 'private' | 'group' | 'past'

export default function TeacherSessionsPage() {
    const { profile, loading: userLoading } = useCurrentUser()
    const [activeTab, setActiveTab] = useState<TabType>('private')
    const [privateSessions, setPrivateSessions] = useState<any[]>([])
    const [groupSessions, setGroupSessions] = useState<any[]>([])
    const [pastSessions, setPastSessions] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState(false)
    const [selectedSession, setSelectedSession] = useState<any | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false)
    const [attendanceSession, setAttendanceSession] = useState<any | null>(null)

    const fetchData = async () => {
        if (!profile?.id) return
        setLoading(true)
        const supabase = createClient()

        // 0. Get teacher id first
        const { data: teacher } = await supabase
            .from('teachers')
            .select('id')
            .eq('user_id', profile.id)
            .maybeSingle();

        if (!teacher) {
            setLoading(false);
            return;
        }
        const tid = (teacher as any).id;

        // 1. Fetch Private Bookings (Upcoming)
        const { data: bookings } = await (supabase
            .from('bookings') as any)
            .select('*, profiles!student_id(full_name)')
            .eq('teacher_id', tid)
            .neq('status', 'cancelled')
            .neq('status', 'completed')
            .order('booking_date', { ascending: true })

        setPrivateSessions(bookings || [])

        // 2. Fetch Group Sessions (Current/Upcoming)
        const { data: groups } = await (supabase
            .from('groups') as any)
            .select('*, group_enrollments(count)')
            .eq('teacher_id', profile.id)

        setGroupSessions(groups || [])

        // 3. Fetch Past Sessions (Recent 20)
        // Combine ended live sessions and completed bookings
        const { data: pastLive } = await (supabase
            .from('live_sessions') as any)
            .select('*, course:courses(title)')
            .eq('teacher_id', profile.id)
            .eq('status', 'ENDED')
            .order('session_date', { ascending: false })
            .limit(10);
        
        const { data: pastBookings } = await (supabase
            .from('bookings') as any)
            .select('*, profiles!student_id(full_name)')
            .eq('teacher_id', tid)
            .eq('status', 'completed')
            .order('booking_date', { ascending: false })
            .limit(10);

        const combinedPast = [
            ...(pastLive || []).map(s => ({ ...s, type: 'GROUP' })),
            ...(pastBookings || []).map(b => ({ ...b, type: 'PRIVATE', title: `Özel Ders: ${b.profiles?.full_name}` }))
        ].sort((a, b) => new Date(b.session_date || b.booking_date).getTime() - new Date(a.session_date || a.booking_date).getTime());

        setPastSessions(combinedPast);

        setLoading(false)
    }

    useEffect(() => {
        if (!userLoading && profile) {
            fetchData()
        }
    }, [userLoading, profile])

    const handleCancel = async () => {
        if (!selectedSession) return
        setActionLoading(true)
        const res = await cancelBookingAction(selectedSession.id)
        if (res.success) {
            toast.success('Hizmet iptal edildi ve bakiye iade edildi.')
            fetchData()
        } else {
            toast.error('İptal işlemi başarısız.')
        }
        setActionLoading(false)
        setIsModalOpen(false)
    }

    if (loading || userLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="w-8 h-8 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin"></div>
            </div>
        )
    }

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Yaklaşan Derslerim</h1>
                <div className="flex bg-gray-100 p-1 rounded-xl">
                    <button
                        onClick={() => setActiveTab('private')}
                        className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'private' ? 'bg-white text-brand-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Özel Dersler
                    </button>
                    <button
                        onClick={() => setActiveTab('group')}
                        className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'group' ? 'bg-white text-brand-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Gruplarım
                    </button>
                    <button
                        onClick={() => setActiveTab('past')}
                        className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'past' ? 'bg-white text-brand-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Geçmiş Dersler
                    </button>
                </div>
            </div>


            <div className="grid gap-6">
                {activeTab === 'private' ? (
                    privateSessions.length > 0 ? (
                        privateSessions.map((session) => (
                            <div key={session.id} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between group hover:shadow-md transition-all border-l-4 border-l-blue-500">
                                <div>
                                    <h3 className="text-xl font-bold text-brand-primary mb-1">
                                        {session.profiles?.full_name || 'Öğrenci'}
                                    </h3>
                                    <p className="text-gray-500 text-sm">
                                        <i className="far fa-calendar-alt mr-2"></i>
                                        {new Date(session.booking_date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })} |
                                        <i className="far fa-clock ml-2 mr-2"></i>
                                        {session.start_time.substring(0, 5)} - {session.end_time.substring(0, 5)}
                                    </p>
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => {
                                            setSelectedSession(session)
                                            setIsModalOpen(true)
                                        }}
                                        className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg font-bold transition-all text-sm"
                                    >
                                        İptal Et
                                    </button>
                                    <Link href="/teacher/schedule" className="px-6 py-2.5 border border-gray-200 text-gray-600 rounded-lg font-bold hover:bg-gray-50 transition-all">
                                        Detaylar
                                    </Link>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-20 bg-gray-50 rounded-xl border-2 border-dashed border-gray-100">
                            <p className="text-gray-400">Şu an planlanmış özel ders bulunmamaktadır.</p>
                        </div>
                    )
                ) : activeTab === 'group' ? (
                    groupSessions.length > 0 ? (
                        groupSessions.map((group) => (
                            <div key={group.id} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between group hover:shadow-md transition-all border-l-4 border-l-purple-500">
                                <div>
                                    <h3 className="text-xl font-bold text-brand-primary mb-1">{group.title}</h3>
                                    <p className="text-gray-500 text-sm">
                                        {group.group_enrollments?.[0]?.count || 0} / {group.max_students} Öğrenci
                                    </p>
                                </div>
                                <div className="flex gap-3">
                                    <Link href={`/groups/${group.id}`} target="_blank" className="px-6 py-2.5 bg-brand-primary text-white rounded-lg font-bold hover:bg-brand-primary-dark transition-all">
                                        Detaylar
                                    </Link>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-20 bg-gray-50 rounded-xl border-2 border-dashed border-gray-100">
                            <p className="text-gray-400">Şu an aktif grubunuz bulunmamaktadır.</p>
                        </div>
                    )
                ) : (
                    // Past Sessions
                    pastSessions.length > 0 ? (
                        pastSessions.map((session) => (
                            <div key={session.id} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between group">
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${session.type === 'PRIVATE' ? 'bg-blue-50 text-blue-500' : 'bg-purple-50 text-purple-500'}`}>
                                        <i className={`fas ${session.type === 'PRIVATE' ? 'fa-user' : 'fa-users'}`}></i>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900">{session.title}</h3>
                                        <p className="text-xs text-gray-500">
                                            {new Date(session.session_date || session.booking_date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="px-3 py-1 bg-green-50 text-green-600 text-[10px] font-bold rounded-full border border-green-100 uppercase tracking-widest">Tamamlandı</span>
                                    <button 
                                        onClick={() => {
                                            setAttendanceSession(session)
                                            setIsAttendanceModalOpen(true)
                                        }}
                                        className="text-brand-primary text-xs font-bold hover:underline"
                                    >
                                        Yoklama
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-20 bg-gray-50 rounded-xl border-2 border-dashed border-gray-100">
                            <p className="text-gray-400">Henüz tamamlanmış bir ders bulunmamaktadır.</p>
                        </div>
                    )
                )}
            </div>


            <ConfirmationModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConfirm={handleCancel}
                title="Dersi İptal Et"
                message="Bu dersi iptal etmek istediğinize emin misiniz? Öğrencinin ders kredisi iade edilecektir."
                type="danger"
                confirmText="Evet, İptal Et"
                isLoading={actionLoading}
            />

            <AttendanceModal 
                isOpen={isAttendanceModalOpen}
                onClose={() => setIsAttendanceModalOpen(false)}
                session={attendanceSession}
            />
        </div>
    )
}
