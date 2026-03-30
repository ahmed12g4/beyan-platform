'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { useCurrentUser } from '@/hooks/useCurrentUser'

type TabType = 'recorded' | 'private' | 'group'

export default function MyLessonsPage() {
    const [activeTab, setActiveTab] = useState<TabType>('recorded')
    const { user, loading: authLoading } = useCurrentUser()
    const [loading, setLoading] = useState(true)
    const [courses, setCourses] = useState<any[]>([])
    const [privateLessons, setPrivateLessons] = useState<any[]>([])
    const [upcomingBookings, setUpcomingBookings] = useState<any[]>([])
    const [groups, setGroups] = useState<any[]>([])

    const fetchData = useCallback(async () => {
        if (!user) return;
        setLoading(true)
        const supabase = createClient()
        const userId = user.id

        try {
            // 1. Fetch Recorded Courses (Enrollments)
            const { data: enrollmentData } = await supabase
                .from('enrollments')
                .select(`
                    id,
                    course_id,
                    status,
                    courses!inner (
                        id,
                        title,
                        thumbnail_url,
                        teacher_id,
                        profiles!teacher_id (full_name, avatar_url),
                        lessons (id)
                    )
                `)
                .eq('student_id', userId)
                .or('status.eq.ACTIVE,status.is.null'); // Be flexible with status

            // Fetch progress for all active enrollments
            const enrollmentIds = (enrollmentData || []).map((en: any) => en.id);
            const { data: progressData } = await (supabase
                .from('lesson_progress') as any)
                .select('enrollment_id, lesson_id, is_completed')
                .in('enrollment_id', enrollmentIds);
            
            const coursesWithProgress = (enrollmentData || [])
                .filter((en: any) => en.courses)
                .map((en: any) => {
                    const course = en.courses;
                    const totalLessons = course.lessons?.length || 0;
                    const completedLessons = (progressData || []).filter((p: any) =>
                        p.enrollment_id === en.id && p.is_completed
                    ).length;
                    
                    const progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

                    return {
                        ...course,
                        enrollment_id: en.id,
                        progress,
                        completedLessons,
                        totalLessons,
                        teacher: course.profiles
                    };
                });
            setCourses(coursesWithProgress);

            // 2. Fetch Private Lessons
            const { data: balances } = await supabase
                .from('student_lesson_balance')
                .select(`
                    *,
                    teachers!teacher_id (
                        profiles!user_id (full_name, avatar_url)
                    )
                `)
                .eq('student_id', userId);

            setPrivateLessons(balances || []);

            const { data: bookings } = await (supabase.from('bookings') as any)
                .select(`
                    *,
                    teachers!teacher_id (
                        profiles!user_id (full_name, avatar_url)
                    )
                `)
                .eq('student_id', userId)
                .gte('booking_date', new Date().toISOString().split('T')[0])
                .neq('status', 'cancelled')
                .order('booking_date', { ascending: true });

            setUpcomingBookings(bookings || []);

            // 3. Fetch Groups
            const { data: groupEnrolls } = await supabase
                .from('group_enrollments')
                .select(`
                    id,
                    group_id,
                    groups (
                        id,
                        title,
                        thumbnail_url,
                        teacher_id,
                        profiles!teacher_id (full_name, avatar_url)
                    )
                `)
                .eq('student_id', userId)
                .eq('status', 'active');

            setGroups(groupEnrolls || []);

        } catch (err) {
            console.error("Error fetching my lessons:", err);
        } finally {
            setLoading(false)
        }
    }, [user])

    useEffect(() => {
        if (!authLoading && user) {
            fetchData()
        }
    }, [user, authLoading, fetchData])

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center">
                <div className="w-14 h-14 border-4 border-brand-primary/10 border-t-brand-primary rounded-full animate-spin mb-6"></div>
                <p className="text-gray-400 font-black uppercase tracking-widest text-xs">Yükleniyor...</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#f8fafc] pb-20" dir="rtl">
            {/* Header Section */}
            <div className="bg-white border-b border-gray-100 sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-brand-primary/10 rounded-[20px] flex items-center justify-center">
                                <i className="fas fa-graduation-cap text-2xl text-brand-primary"></i>
                            </div>
                            <div className="text-right">
                                <h1 className="text-3xl font-black text-gray-900 tracking-tight">Eğitimlerim</h1>
                                <p className="text-gray-500 font-medium text-sm mt-1">Öğrenme yolculuğunuzda kaldığınız yerden devam edin.</p>
                            </div>
                        </div>

                        {/* Custom Tabs */}
                        <div className="bg-gray-50 p-1.5 rounded-2xl border border-gray-100 flex items-center gap-1">
                            <button
                                onClick={() => setActiveTab('recorded')}
                                className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === 'recorded' ? 'bg-white shadow-sm text-brand-primary' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                <span className="flex items-center gap-2">
                                    <i className="fas fa-play-circle text-[10px]"></i>
                                    Kurslarım ({courses.length})
                                </span>
                            </button>
                            <button
                                onClick={() => setActiveTab('private')}
                                className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === 'private' ? 'bg-white shadow-sm text-brand-primary' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                <span className="flex items-center gap-2">
                                    <i className="fas fa-user text-[10px]"></i>
                                    Özel Dersler ({privateLessons.length})
                                </span>
                            </button>
                            <button
                                onClick={() => setActiveTab('group')}
                                className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === 'group' ? 'bg-white shadow-sm text-brand-primary' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                <span className="flex items-center gap-2">
                                    <i className="fas fa-users text-[10px]"></i>
                                    Gruplarım ({groups.length})
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Tab: Recorded Courses */}
                {activeTab === 'recorded' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {courses.length === 0 ? (
                            <div className="col-span-full py-24 bg-white rounded-[40px] border border-dashed border-gray-200 text-center">
                                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <i className="far fa-play-circle text-3xl text-gray-300"></i>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Henüz Bir Kursunuz Yok</h3>
                                <p className="text-gray-500 mb-8 max-w-sm mx-auto text-sm">Satın aldığınız tüm video kursları burada görünecektir.</p>
                                <Link href="/courses" className="px-8 py-3 bg-brand-primary text-white font-black rounded-xl hover:bg-brand-primary-dark transition-all shadow-lg shadow-brand-primary/20">
                                    Kursları İncele
                                </Link>
                            </div>
                        ) : (
                            courses.map((course) => (
                                <div key={course.id} className="group bg-white rounded-[40px] border border-gray-100 overflow-hidden shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.06)] transition-all duration-500 flex flex-col hover:-translate-y-2">
                                    <div className="aspect-[16/10] relative overflow-hidden bg-gray-50">
                                        {course.thumbnail_url ? (
                                            <Image 
                                                src={course.thumbnail_url} 
                                                alt={course.title} 
                                                fill 
                                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                                className="object-cover group-hover:scale-105 transition-transform duration-700" 
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-200">
                                                <i className="fas fa-play shadow-sm text-4xl"></i>
                                            </div>
                                        )}
                                        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-gray-100 shadow-sm text-[10px] font-black uppercase text-brand-primary">
                                            %{course.progress} TAMAMLANDI
                                        </div>
                                    </div>
                                    <div className="p-8 flex-1 flex flex-col">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-100 border border-gray-50 flex-shrink-0">
                                                {course.teacher?.avatar_url ? (
                                                    <Image src={course.teacher.avatar_url} alt={course.teacher.full_name} width={32} height={32} className="object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-brand-primary text-white font-black text-[10px]">{course.teacher?.full_name?.charAt(0)}</div>
                                                )}
                                            </div>
                                            <span className="text-xs font-bold text-gray-500">{course.teacher?.full_name}</span>
                                        </div>

                                        <h3 className="text-xl font-black text-gray-900 mb-6 group-hover:text-brand-primary transition-colors line-clamp-2 leading-tight h-14">{course.title}</h3>

                                        <div className="mt-auto">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{course.completedLessons} / {course.totalLessons} DERS</span>
                                            </div>
                                            <div className="w-full bg-gray-50 h-2 rounded-full mb-8 overflow-hidden">
                                                <div className="bg-brand-primary h-full rounded-full transition-all duration-1000" style={{ width: `${course.progress}%` }}></div>
                                            </div>
                                            <Link href={`/student/my-lessons/${course.id}`} className="block w-full text-center py-4 bg-gray-900 text-white font-black rounded-2xl hover:bg-black transition-all shadow-lg text-xs uppercase tracking-widest">
                                                Eğitime Devam Et
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* Tab: Private Lessons */}
                {activeTab === 'private' && (
                    <div className="grid gap-10">
                        {/* Balance Section */}
                        <div className="space-y-6">
                            <h2 className="text-2xl font-black text-gray-900 px-2 tracking-tight">Kalan Bakiyelerim</h2>
                            {privateLessons.length === 0 ? (
                                <div className="py-16 bg-white rounded-[40px] border border-dashed border-gray-200 text-center">
                                    <p className="text-gray-500 text-sm">Henüz bir özel ders bakiyeniz bulunmuyor.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {privateLessons.map((pkg) => (
                                        <div key={pkg.id} className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex items-center gap-6 group hover:shadow-xl transition-all duration-300">
                                            <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 flex-shrink-0">
                                                {pkg.teachers?.profiles?.avatar_url ? (
                                                    <Image src={pkg.teachers.profiles.avatar_url} alt={pkg.teachers.profiles.full_name} width={64} height={64} className="object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-brand-primary text-white font-black text-lg">{pkg.teachers?.profiles?.full_name?.charAt(0)}</div>
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-black text-gray-900 truncate">{pkg.teachers?.profiles?.full_name}</h3>
                                                <div className="flex items-center gap-4 mt-2">
                                                    <div className="px-3 py-1 bg-brand-primary/10 rounded-lg text-brand-primary font-black text-xl leading-none">
                                                        {pkg.lessons_remaining}
                                                    </div>
                                                    <span className="text-gray-400 font-bold text-xs uppercase tracking-tighter">DERS KALDI</span>
                                                </div>
                                            </div>
                                            <Link href={`/teachers/${pkg.teachers?.id || pkg.teacher_id}`} className="w-10 h-10 bg-gray-50 text-gray-400 rounded-xl flex items-center justify-center hover:bg-brand-primary hover:text-white transition-all shadow-sm">
                                                <i className="fas fa-calendar-plus"></i>
                                            </Link>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Appointments Section */}
                        <div className="space-y-6">
                            <h2 className="text-2xl font-black text-gray-900 px-2 tracking-tight">Yaklaşan Özel Derslerim</h2>
                            {upcomingBookings.length === 0 ? (
                                <div className="py-16 bg-white rounded-[40px] border border-dashed border-gray-200 text-center">
                                    <p className="text-gray-500 text-sm">Yaklaşan bir randevunuz bulunmuyor.</p>
                                </div>
                            ) : (
                                <div className="grid gap-4">
                                    {upcomingBookings.map((booking) => (
                                        <div key={booking.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 group">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500">
                                                    <i className="fas fa-video"></i>
                                                </div>
                                                <div>
                                                    <h4 className="font-black text-gray-900 leading-tight">{booking.teachers?.profiles?.full_name} ile Özel Ders</h4>
                                                    <div className="flex items-center gap-4 mt-1">
                                                        <span className="text-gray-500 text-xs font-bold uppercase">{new Date(booking.booking_date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' })}</span>
                                                        <span className="text-brand-primary text-xs font-black">{booking.start_time} - {booking.end_time}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <button className="px-6 py-2.5 bg-gray-50 text-gray-400 font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-red-50 hover:text-red-500 transition-all">
                                                    İptal Talebi
                                                </button>
                                                <Link href="/student/schedule" className="px-6 py-2.5 bg-brand-primary/10 text-brand-primary font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-brand-primary hover:text-white transition-all">
                                                    Ajandada Gör
                                                </Link>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Tab: Groups */}
                {activeTab === 'group' && (
                    <div className="grid gap-8">
                        {groups.length === 0 ? (
                            <div className="py-24 bg-white rounded-[40px] border border-dashed border-gray-200 text-center">
                                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <i className="fas fa-users text-2xl text-gray-300"></i>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Grup Eğitiminiz Yok</h3>
                                <p className="text-gray-500 mb-8 max-w-sm mx-auto text-sm">Herhangi bir grupta kaydınız bulunmuyor.</p>
                                <Link href="/groups" className="px-8 py-3 bg-brand-primary text-white font-black rounded-xl shadow-lg shadow-brand-primary/20">
                                    Grupları Keşfet
                                </Link>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {groups.map((enroll) => {
                                    const group = enroll.groups;
                                    return (
                                        <div key={enroll.id} className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm flex flex-col md:flex-row items-center gap-8 group hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                                            <div className="w-32 h-32 md:w-40 md:h-40 bg-gray-50 rounded-[32px] overflow-hidden border border-gray-50 flex-shrink-0">
                                                {group.thumbnail_url ? (
                                                    <Image src={group.thumbnail_url} alt={group.title} width={160} height={160} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-200 text-4xl">
                                                        <i className="fas fa-users"></i>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 text-center md:text-right">
                                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-50 text-green-600 text-[9px] font-black rounded-full uppercase tracking-widest mb-3">
                                                    <span className="w-1.5 h-1.5 bg-green-600 rounded-full animate-pulse"></span>
                                                    Aktif Katılım
                                                </div>
                                                <h3 className="text-2xl font-black text-gray-900 mb-2">{group.title}</h3>
                                                <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6 mt-4">
                                                    <div className="flex items-center justify-center md:justify-end gap-2">
                                                        <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-100">
                                                            {group.profiles?.avatar_url ? (
                                                                <Image src={group.profiles.avatar_url} alt={group.profiles.full_name} width={24} height={24} className="object-cover" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center bg-brand-primary text-white font-black text-[8px]">{group.profiles?.full_name?.charAt(0)}</div>
                                                            )}
                                                        </div>
                                                        <span className="text-xs font-bold text-gray-500">Eğitmen: {group.profiles?.full_name}</span>
                                                    </div>
                                                </div>
                                                <div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
                                                    <Link href={`/groups/${group.id}`} className="w-full sm:flex-1 py-4 bg-brand-primary text-white font-black rounded-2xl text-[10px] uppercase tracking-widest text-center shadow-lg shadow-brand-primary/20">
                                                        Detaylar
                                                    </Link>
                                                    <Link href="/student/schedule" className="w-full sm:flex-1 py-4 bg-gray-50 text-gray-400 font-black rounded-2xl text-[10px] uppercase tracking-widest text-center hover:bg-gray-100 transition-all">
                                                        Haftalık Program
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
