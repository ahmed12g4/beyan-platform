'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { toast } from 'react-hot-toast'

export default function TeacherGroupDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { user, profile, loading: authLoading } = useCurrentUser()
    const router = useRouter()
    const [group, setGroup] = useState<any>(null)
    const [students, setStudents] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    const unwrappedParams = use(params)
    const groupId = unwrappedParams.id

    const fetchGroupData = async () => {
        if (!user) return
        setLoading(true)
        const supabase = createClient()
        
        try {
            // Check ownership and get group details
            const { data, error: groupError } = await supabase
                .from('group_courses')
                .select('*')
                .eq('id', groupId)
                .eq('teacher_id', user.id)
                .single()

            const groupData = data as any;

            if (groupError || !groupData) {
                toast.error('Bu gruba erişim yetkiniz yok.')
                router.push('/teacher/groups')
                return
            }

            setGroup({
                ...groupData,
                isCompleted: new Date(groupData.end_date) < new Date(),
                isActive: new Date(groupData.start_date) <= new Date() && new Date(groupData.end_date) >= new Date()
            })

            // Get enrolled students
            const { data: enrollments, error: enrollmentsError } = await supabase
                .from('group_enrollments')
                .select(`
                    id, 
                    enrolled_at,
                    student:profiles!student_id(id, full_name, avatar_url, phone)
                `)
                .eq('group_course_id', groupId)

            if (enrollmentsError) throw enrollmentsError
            
            // Format students
            const formattedStudents = (enrollments || []).map((e: any) => ({
                enrollment_id: e.id,
                enrolled_at: e.enrolled_at,
                id: e.student?.id,
                full_name: e.student?.full_name || 'İsimsiz',
                avatar_url: e.student?.avatar_url,
                phone: e.student?.phone
            }))

            setStudents(formattedStudents)

        } catch (err) {
            console.error("Error fetching group details:", err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (!authLoading) {
            fetchGroupData()
        }
    }, [user, authLoading])

    if (authLoading || loading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center">
                <div className="w-12 h-12 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin mb-4"></div>
                <p className="text-gray-500 font-medium">Grup Detayları Yükleniyor...</p>
            </div>
        )
    }

    if (!group) return null

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12" dir="rtl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <Link href="/teacher/groups" className="text-sm text-gray-400 hover:text-brand-primary font-medium flex items-center gap-2 mb-2 transition-colors">
                        <i className="fas fa-arrow-right"></i>
                        Gruplara Dön
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900 border-r-4 border-brand-accent pr-4">{group.title}</h1>
                </div>
                {group.zoom_link && (
                    <a
                        href={group.zoom_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-brand-accent/20 text-brand-primary px-6 py-3 rounded-xl font-bold hover:bg-brand-accent/30 transition shadow-sm border border-brand-accent/30 flex items-center gap-2"
                    >
                        <i className="fas fa-video"></i>
                        Canlı Derse Katıl
                    </a>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content - Students List */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-xl shadow-gray-200/40 relative">
                        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center justify-between">
                            <span className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center">
                                    <i className="fas fa-users"></i>
                                </div>
                                Öğrenci Listesi
                            </span>
                            <span className="text-sm font-bold bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
                                {students.length} / {group.total_seats}
                            </span>
                        </h2>

                        <div className="space-y-4">
                            {students.length === 0 ? (
                                <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                    <i className="fas fa-user-friends text-4xl text-gray-300 mb-3"></i>
                                    <h3 className="text-lg font-bold text-gray-600">Henüz Kayıtlı Öğrenci Yok</h3>
                                </div>
                            ) : (
                                students.map((student, idx) => (
                                    <div key={student.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl hover:border-brand-primary/30 transition-all gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 relative shadow-sm border border-white">
                                                {student.avatar_url ? (
                                                    <Image src={student.avatar_url} alt={student.full_name} fill className="object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-lg bg-gray-100 text-gray-400 font-bold">{student.full_name.charAt(0)}</div>
                                                )}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-gray-900">{student.full_name}</h4>
                                                <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                                                    <span className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-md">
                                                        Kayıt: {new Date(student.enrolled_at).toLocaleDateString('tr-TR')}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 justify-end sm:justify-start">
                                            <span className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded-md bg-green-100 text-green-700`}>
                                                Aktif
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Sidebar - Group Info */}
                <div className="space-y-6">
                    <div className="bg-white rounded-[32px] p-6 border border-gray-100 shadow-xl shadow-gray-200/40">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <i className="fas fa-info-circle text-brand-primary"></i> Grup Bilgileri
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Durum</p>
                                <span className={`px-2.5 py-1 inline-block text-[10px] font-black uppercase tracking-widest rounded-md ${
                                    group.isActive ? 'bg-green-100 text-green-700' : group.isCompleted ? 'bg-gray-100 text-gray-600' : 'bg-amber-100 text-amber-700'
                                }`}>
                                    {group.isActive ? 'Aktif' : group.isCompleted ? 'Tamamlandı' : 'Yakında'}
                                </span>
                            </div>
                            
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Tarih Aralığı</p>
                                <p className="text-sm font-medium text-gray-900">{new Date(group.start_date).toLocaleDateString('tr-TR')} - {new Date(group.end_date).toLocaleDateString('tr-TR')}</p>
                            </div>
                            
                            {group.description && (
                                <div>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Açıklama</p>
                                    <p className="text-sm text-gray-700">{group.description}</p>
                                </div>
                            )}

                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Program</p>
                                <p className="text-sm text-gray-700 p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-start gap-2">
                                    <i className="far fa-calendar-alt mt-1 text-gray-400"></i>
                                    {group.schedule_desc}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
