'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { dailyTips } from '@/lib/dailyTips'
import { LoadingPage } from '@/components/ui/StateComponents'
import Avatar from '@/components/Avatar'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { getStudentSessions, recordAttendanceAction } from '@/lib/actions/sessions'
import { toast } from 'react-hot-toast'
import dynamic from 'next/dynamic'
import { getPlatformSettings } from '@/lib/actions/settings'
import UnifiedSchedule from '@/components/student/UnifiedSchedule';
import { getStudentXpData, getDailyActivityHistory, handleDailyLoginXp } from '@/lib/actions/xp'
import { getXpForLevel, calculateLevel } from '@/lib/xp-utils'

// Lazy-load PDF component — only pulled into bundle when needed
const StudentReportPDF = dynamic(() => import('@/components/student/StudentReportPDF'), { ssr: false })

interface DashboardCourse {
    id: string
    title: string
    instructor: string
    progress: number
}

interface LiveSession {
    id: string
    title: string
    scheduledAt: string
    duration: number
    instructor: string
    participantsCount: number
    maxParticipants: number
    status: string
    meetingLink: string | null
    courseId: string | null
}

interface LearningStats {
    totalCompletedLessons: number
    totalHoursLearned: number
    activeCourses: number
    currentStreak: number
}

export default function StudentDashboard() {
    const router = useRouter()
    const { profile, loading: userLoading } = useCurrentUser()
    const [enrolledCourses, setEnrolledCourses] = useState<DashboardCourse[]>([])
    const [nextSession, setNextSession] = useState<LiveSession | null>(null)
    const [stats, setStats] = useState<LearningStats | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [currentTip, setCurrentTip] = useState(dailyTips[0])
    const [activeTab, setActiveTab] = useState<'courses' | 'private' | 'groups'>('courses')
    const [privateBalances, setPrivateBalances] = useState<any[]>([])
    const [enrolledGroups, setEnrolledGroups] = useState<any[]>([])
    const [xpData, setXpData] = useState<any>(null)
    const [dailyActivity, setDailyActivity] = useState<any[]>([])
    const [showDailyReminder, setShowDailyReminder] = useState(false)

    // XP & Level calculations
    const totalXP = xpData?.total_xp || 0
    const currentLevel = xpData?.current_level || 1
    const nextLevelXP = getXpForLevel(currentLevel + 1)
    const currentLevelXP = getXpForLevel(currentLevel)
    const levelProgress = Math.min(100, Math.max(0, ((totalXP - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100))

    useEffect(() => {
        if (userLoading || !profile?.id) return

        const fetchData = async () => {
            // Handle daily login bonus first
            await handleDailyLoginXp()

            const supabase = createClient()
            const studentId = profile.id

            // 1. Fetch Enrolled Courses & Progress
            const { data: enrollments } = await supabase
                .from('enrollments')
                .select(`
                    course_id,
                    status,
                    course:courses (
                        id,
                        title,
                        teacher:profiles (full_name)
                    )
                `)
                .eq('student_id', studentId)
                .eq('status', 'ACTIVE')

            const courseIds = (enrollments || []).map((e: any) => e.course_id) || []
            const progressMap: Record<string, number> = {}

            if (courseIds.length > 0) {
                const { data: progress } = await supabase
                    .from('enrollment_progress')
                    .select('course_id, progress_percentage, completed_lessons')
                    .eq('student_id', studentId)
                    .in('course_id', courseIds)

                progress?.forEach((p: any) => {
                    progressMap[p.course_id] = p.progress_percentage || 0
                })
            }

            const coursesData: DashboardCourse[] = (enrollments || [])
                .filter((e: any) => e.course) // Only show courses that are visible (published)
                .map((e: any) => {
                    const course = e.course
                    return {
                        id: course?.id || '',
                        title: course?.title || '',
                        instructor: course?.teacher?.full_name || 'Eğitmen',
                        progress: progressMap[course?.id || ''] || 0
                    }
                })

            // 2. Fetch Next Live Session (Unified)
            const allSessions = await getStudentSessions()
            let session: LiveSession | null = null

            // Filter for upcoming or live sessions
            // We want sessions that serve now (end time > now)
            const upcoming = allSessions.filter((s: any) => {
                const endTime = new Date(s.session_date).getTime() + (s.duration_minutes * 60000);
                return endTime > new Date().getTime();
            });

            if (upcoming.length > 0) {
                // Sort by date ascending to get the nearest one
                upcoming.sort((a: any, b: any) => new Date(a.session_date).getTime() - new Date(b.session_date).getTime())
                const l = upcoming[0] as any

                // Determine status
                const now = new Date()
                const start = new Date(l.session_date)
                const end = new Date(start.getTime() + l.duration_minutes * 60000)
                const isLive = now >= start && now <= end

                session = {
                    id: l.id,
                    title: l.title,
                    scheduledAt: l.session_date,
                    duration: l.duration_minutes,
                    instructor: l.teacher?.full_name || 'Eğitmen',
                    participantsCount: 0,
                    maxParticipants: 100,
                    status: isLive ? 'LIVE' : 'UPCOMING',
                    meetingLink: l.meet_url,
                    courseId: l.course_id
                }
            }

            // 3. Calculate Stats
            const { data: allProgress } = await supabase
                .from('enrollment_progress')
                .select('completed_lessons')
                .eq('student_id', studentId)

            const totalCompleted = (allProgress as any)?.reduce((acc: number, curr: any) => acc + (curr.completed_lessons || 0), 0) || 0
            const totalHours = Math.round(totalCompleted * 0.5)

            // 4. Calculate Streak (Real logic now coming from XP backend - see line ~228)
            // We'll set it temporarily to 0 here and override it when we fetch xpData
            let streak = 0;

            // 5. Fetch Platform Settings for Tips
            const platformSettings = await getPlatformSettings()
            const tips = Array.isArray(platformSettings?.student_tips) ? platformSettings.student_tips : dailyTips
            const dayOfYear = Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24)
            setCurrentTip((tips[dayOfYear % tips.length] as any) || tips[0])

            // 6. Fetch Private Lesson Balances
            const { data: balances } = await supabase
                .from('student_lesson_balance')
                .select('*, teachers!teacher_id(profiles!user_id(full_name, avatar_url))')
                .eq('student_id', studentId)

            // 7. Fetch Enrolled Groups
            const { data: groups } = await supabase
                .from('group_enrollments')
                .select('*, groups(*, profiles!groups_teacher_id_fkey(full_name))')
                .eq('student_id', studentId)
                .eq('status', 'active')

            setEnrolledCourses(coursesData)
            setNextSession(session)
            setPrivateBalances(balances || [])
            setEnrolledGroups(groups || [])
            // 6. Fetch XP and Activity Data
            const [xpRes, activityRes] = await Promise.all([
                getStudentXpData(),
                getDailyActivityHistory()
            ])
            setXpData(xpRes)
            setDailyActivity(activityRes)

            setStats({
                totalCompletedLessons: totalCompleted,
                totalHoursLearned: totalHours,
                activeCourses: coursesData.length,
                currentStreak: xpRes?.streak_days || 0
            })

            setIsLoading(false)
        }

        fetchData()
    }, [userLoading, profile?.id])

    useEffect(() => {
        // Daily Reminder Logic (Shows once a day)
        const today = new Date().toISOString().split('T')[0];
        const lastSeenDate = localStorage.getItem('dailyReminderSeen');
        
        if (lastSeenDate !== today) {
            setShowDailyReminder(true);
            setTimeout(() => {
                localStorage.setItem('dailyReminderSeen', today);
            }, 5000); // 5 seconds after load, we consider it seen
        }
    }, [])

    if (isLoading || userLoading) return <LoadingPage message="Yükleniyor..." />

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">

            {/* 1. Welcome Section & Gamification */}
            <div className="mb-8">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2 tracking-tight">
                            Merhaba, {profile?.full_name?.split(' ')[0] || 'Öğrenci'} 👋
                        </h1>

                        <p className="text-gray-600 text-base sm:text-lg font-medium">
                            Bugün öğrenmek için harika bir gün! Yeni hedeflere ulaşmaya hazır mısın?
                        </p>
                    </div>
                    {/* PDF Report Button */}
                    {stats && (
                        <div className="flex-shrink-0">
                            <StudentReportPDF
                                data={{
                                    studentName: profile?.full_name || 'Öğrenci',
                                    studentEmail: profile?.email || '',
                                    month: new Intl.DateTimeFormat('tr-TR', { month: 'long' }).format(new Date()),
                                    year: new Date().getFullYear(),
                                    enrolledCourses: enrolledCourses.map(c => ({
                                        title: c.title,
                                        instructor: c.instructor,
                                        progress: c.progress,
                                        completedLessons: Math.round(c.progress / 10),
                                        totalLessons: 10,
                                    })),
                                    totalCompletedLessons: stats.totalCompletedLessons,
                                    totalHoursLearned: stats.totalHoursLearned,
                                    currentStreak: stats.currentStreak,
                                    level: currentLevel,
                                    totalXP,
                                    activeCourses: stats.activeCourses,
                                }}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* 1.5 GAMIFICATION: The "Addictive" Loop */}
            {
                stats && (
                    <div className="mb-12 grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
                        {/* Weekly Streak Tracker (Psychological Hook: Loss Aversion & Consistency) */}
                        <div className="lg:col-span-2 rounded-lg bg-brand-primary p-6 md:p-8 text-white shadow-xl relative overflow-hidden group hover:shadow-2xl transition-all duration-500 border border-[#2A5C5B]">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-accent opacity-[0.03] rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2 group-hover:scale-110 transition-transform duration-1000"></div>

                            <div className="relative z-10 flex flex-col h-full justify-between">
                                <div className="flex justify-between items-start mb-8">
                                    <div>
                                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-md rounded-full text-brand-accent text-[10px] font-bold mb-4 uppercase tracking-widest border border-white/5 shadow-inner">
                                            <i className="fas fa-fire text-brand-accent"></i> GÜNLÜK ÇALIŞMA SERİSİ
                                        </div>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-6xl md:text-8xl font-black tracking-tighter text-white drop-shadow-sm">{stats.currentStreak}</span>
                                            <span className="text-2xl text-[#A0AAB2] font-medium">Gün</span>
                                        </div>
                                        {showDailyReminder ? (
                                            <div className="mt-4 p-3 bg-brand-accent/10 border border-brand-accent/20 rounded-xl relative overflow-hidden animate-pulse">
                                                <div className="absolute top-0 left-0 w-1 h-full bg-brand-accent"></div>
                                                <p className="text-sm text-white font-medium pl-2">Seriyi bozmamak için bugün <strong className="text-brand-accent border-b border-brand-accent/50">1 ders</strong> tamamla!</p>
                                            </div>
                                        ) : (
                                            <p className="text-sm text-[#A0AAB2] mt-4 font-medium opacity-50">Bugünkü görevlerini başarıyla takip ediyorsun.</p>
                                        )}
                                    </div>
                                    <div className="hidden sm:flex flex-col items-end">
                                        <div className="px-5 py-3 bg-white/5 backdrop-blur-md rounded-lg border border-white/10 text-center shadow-lg">
                                            <p className="text-[9px] text-[#A0AAB2] font-bold uppercase tracking-widest mb-1.5">GÜNÜN GÖREVİ</p>
                                            <p className="text-sm font-bold text-brand-accent flex items-center gap-2">
                                                <i className="far fa-play-circle"></i> Ders İzle
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Weekly Circles (Zeigarnik Effect) */}
                                <div className="bg-white/5 rounded-lg p-5 md:p-6 border border-white/5 backdrop-blur-sm mt-4">
                                    <div className="flex justify-between items-center max-w-lg mx-auto">
                                {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map((day, i) => {
                                    const today = new Date();
                                    const jsDay = today.getDay();
                                    const todayIndex = jsDay === 0 ? 6 : jsDay - 1;
                                    let isToday = i === todayIndex;
                                    
                                    // Calculate the exact date for this index in the current week
                                    const dateOfThisDay = new Date(today);
                                    dateOfThisDay.setDate(today.getDate() - (todayIndex - i));
                                    const dateStr = dateOfThisDay.toISOString().split('T')[0];

                                    // Check against actual daily activity from DB
                                    let isActive = dailyActivity.some((a: any) => a.activity_date === dateStr);

                                            return (
                                                <div key={day} className="flex flex-col items-center gap-2.5 group/day cursor-pointer relative">
                                                    {isToday && !isActive && (
                                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-brand-accent rounded-full animate-bounce"></div>
                                                    )}
                                                    <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-lg transition-all duration-300 transform group-hover/day:scale-105 group-active/day:scale-95 shadow-lg ${isActive ? 'bg-brand-accent text-brand-primary' : isToday ? 'bg-white/10 border border-dashed border-brand-accent text-brand-accent' : 'bg-transparent border border-white/10 text-white/30 hover:bg-white/5'}`}>
                                                        {isActive ? <i className="fas fa-check text-sm md:text-base"></i> : isToday ? <i className="fas fa-play text-[10px] ml-0.5"></i> : <i className="fas fa-lock text-[10px]"></i>}
                                                    </div>
                                                    <span className={`text-[9px] md:text-[10px] font-bold uppercase tracking-wide transition-colors ${isToday ? 'text-brand-accent' : isActive ? 'text-white' : 'text-[#A0AAB2]'}`}>{day}</span>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Level / XP Progress (Psychological Hook: Progression / Status) */}
                        <div className="bg-white rounded-lg p-6 md:p-8 border border-gray-100 shadow-xl flex flex-col items-center justify-center relative overflow-hidden group hover:shadow-2xl transition-all duration-500">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary opacity-[0.02] rounded-full blur-3xl group-hover:scale-150 transition-all duration-1000"></div>

                            {(() => {
                                const xpForNextLevel = Math.pow(currentLevel, 2) * 100;
                                const xpForCurrentLevel = Math.pow(currentLevel - 1, 2) * 100;
                                const progressToNextLevel = totalXP === 0 ? 0 : Math.min(100, ((totalXP - xpForCurrentLevel) / (xpForNextLevel - xpForCurrentLevel)) * 100);

                                return (
                                    <div className="w-full flex flex-col items-center relative z-10">
                                        <div className="w-full flex justify-between items-center mb-6">
                                            <h3 className="font-bold text-[#4A5568] tracking-widest text-[10px] uppercase">Gelişim Puanı</h3>
                                            <div className="px-3 py-1.5 bg-brand-primary text-white rounded-lg text-[9px] font-bold uppercase tracking-widest shadow-sm flex items-center gap-1.5">
                                                <i className="fas fa-trophy text-brand-accent"></i> BRONZ LİG
                                            </div>
                                        </div>

                                        {/* Circular Progress (Dopamine hit visual) */}
                                        <div className="relative w-40 h-40 mb-8 group-hover:scale-105 transition-transform duration-700 ease-in-out">
                                            <svg className="w-full h-full transform -rotate-90 drop-shadow-sm" viewBox="0 0 100 100">
                                                {/* Background circle */}
                                                <circle cx="50" cy="50" r="42" fill="none" stroke="#F8F9FA" strokeWidth="6" />
                                                {/* Progress circle */}
                                                <circle
                                                    cx="50"
                                                    cy="50"
                                                    r="42"
                                                    fill="none"
                                                    stroke="#204544"
                                                    strokeWidth="6"
                                                    strokeDasharray="264"
                                                    strokeDashoffset={264 - (264 * progressToNextLevel) / 100}
                                                    className="transition-all duration-1500 ease-out"
                                                    strokeLinecap="round"
                                                />
                                            </svg>
                                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white m-3 rounded-full shadow-[0_0_15px_rgba(0,0,0,0.03)] border border-gray-50">
                                                <span className="text-gray-400 text-[9px] font-bold uppercase tracking-widest mb-[-4px]">Seviye</span>
                                                <span className="text-5xl font-black text-brand-primary tracking-tighter drop-shadow-sm">{currentLevel}</span>
                                            </div>
                                        </div>

                                        <div className="w-full text-center space-y-2">
                                            <div className="flex justify-between text-xs font-bold px-2 uppercase tracking-wider">
                                                <span className="text-gray-400">{totalXP} XP</span>
                                                <span className="text-brand-primary">{xpForNextLevel} XP</span>
                                            </div>
                                            <p className="text-[11px] text-[#4A5568] font-medium tracking-wide">
                                                Sonraki seviyeye <strong className="text-brand-primary font-black">{xpForNextLevel - totalXP} XP</strong> kaldı
                                            </p>
                                        </div>
                                    </div>
                                )
                            })()}
                        </div>
                    </div>
                )
            }


            {/* 2. Daily Tip Section (Moved Up) */}
            <div className="mb-12 relative rounded-3xl overflow-hidden bg-white p-8 md:p-12 text-center md:text-left shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-500 group border border-gray-100">
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-32 -right-32 w-[600px] h-[600px] bg-brand-accent opacity-[0.05] rounded-full blur-3xl group-hover:opacity-[0.08] group-hover:scale-110 transition-all duration-1000"></div>
                </div>
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
                    <div className="max-w-3xl">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-50 rounded-full text-brand-primary text-[10px] font-black mb-6 uppercase tracking-widest border border-brand-accent/20">
                            <i className="fas fa-lightbulb text-brand-accent animate-pulse"></i> GÜNÜN İPUCU
                        </div>
                        <h3 className="text-3xl md:text-4xl text-gray-900 font-black mb-6 leading-tight">
                            &quot;{currentTip.title}&quot;
                        </h3>
                        <p className="text-gray-600 leading-relaxed text-lg font-medium border-l-4 border-brand-accent pl-6 bg-gray-50/50 py-4 pr-4 rounded-r-2xl">
                            {currentTip.content}
                        </p>
                    </div>
                </div>
            </div>

            {/* 3. Next Lesson */}
            {
                nextSession && (
                    <div className="mb-12 animate-fadeIn">
                        <div className="flex items-center gap-3 mb-5 px-1 py-1">
                            <span className="w-1.5 h-6 bg-brand-accent rounded-full"></span>
                            <h2 className="text-xl font-bold text-gray-900 leading-none flex items-center pt-0.5">Sıradaki Dersiniz</h2>
                            <Link href="/student/schedule" className="ml-auto text-sm font-medium text-brand-primary hover:underline">
                                Tüm Canlı Dersleri Gör →
                            </Link>
                        </div>

                        <div className="relative overflow-hidden rounded-2xl bg-white text-brand-primary shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all duration-300 border border-gray-100">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-accent opacity-10 rounded-full blur-3xl transform translate-x-1/3 -translate-y-1/3 group-hover:opacity-20 transition-opacity duration-500"></div>

                            <div className="relative z-10 p-6 sm:p-10 flex flex-col md:flex-row gap-8 items-start md:items-center">
                                <div className="flex-shrink-0 bg-gray-50 rounded-xl p-4 text-center min-w-[100px] border border-gray-100">
                                    <div className="text-3xl font-bold text-brand-primary">
                                        {new Date(nextSession.scheduledAt).getHours()}:{new Date(nextSession.scheduledAt).getMinutes().toString().padStart(2, '0')}
                                    </div>
                                    <div className="text-sm text-gray-500 font-medium mt-1">
                                        {new Date(nextSession.scheduledAt).getDate() === new Date().getDate() ? 'Bugün' : new Date(nextSession.scheduledAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                                    </div>
                                    <div className="mt-2 text-xs bg-yellow-100 text-yellow-800 font-bold py-1 px-2 rounded-md">
                                        {nextSession.duration} dk
                                    </div>
                                </div>

                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="inline-block px-3 py-1 bg-brand-primary/5 text-brand-primary text-xs font-bold rounded-md">
                                            CANLI DERS
                                        </span>
                                        {nextSession.status === 'LIVE' && (
                                            <span className="animate-pulse inline-block px-3 py-1 bg-red-50 text-red-600 text-xs font-bold rounded-md border border-red-100">
                                                🔴 KESİNTİSİZ YAYIN
                                            </span>
                                        )}
                                    </div>
                                    <h3 className="text-2xl sm:text-3xl font-bold mb-3 leading-tight text-gray-900">
                                        {nextSession.title}
                                    </h3>

                                    <div className="flex flex-wrap items-center gap-6 text-gray-500 text-sm">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold overflow-hidden">
                                                {nextSession.instructor.charAt(0)}
                                            </div>
                                            <span className="font-bold text-gray-700">{nextSession.instructor}</span>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={async () => {
                                        if (nextSession.status === 'LIVE') {
                                            // Record attendance
                                            try {
                                                await recordAttendanceAction(nextSession.id);
                                            } catch (e) {
                                                console.error("Failed to record attendance", e);
                                            }
                                            window.open(nextSession.meetingLink || '', '_blank')
                                        } else {
                                            toast('Bu ders henüz başlamadı.', { icon: '⏳' })
                                        }
                                    }}
                                    className={`w-full md:w-auto px-8 py-4 rounded-xl font-bold text-center transition-all ${nextSession.status === 'LIVE'
                                        ? 'bg-brand-accent text-brand-primary hover:bg-yellow-400 shadow-lg'
                                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                                >
                                    {nextSession.status === 'LIVE' ? 'CANLI DERSE KATIL' : 'DERS BEKLENİYOR'}
                                    <span className="ml-2">→</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }


            <div className="mb-16 animate-fadeIn">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-8 border-b border-gray-100 pb-4">
                    <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 p-1 rounded-2xl w-full sm:w-auto overflow-x-auto scrollbar-hide shadow-sm">
                        {[
                            { id: 'courses', label: 'Kurslarım', icon: 'fa-play-circle' },
                            { id: 'private', label: 'Özel Derslerim', icon: 'fa-user-tie' },
                            { id: 'groups', label: 'Grup Dersleri', icon: 'fa-users' }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-white text-brand-primary shadow-md border border-gray-100 scale-[1.02]' : 'text-gray-500 hover:text-gray-900 hover:bg-white/50'}`}
                            >
                                <i className={`fas ${tab.icon} ${activeTab === tab.id ? 'text-brand-accent' : ''}`}></i>
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="min-h-[400px]">
                    {activeTab === 'courses' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-slideUp">
                            {enrolledCourses.length > 0 ? enrolledCourses.map((course) => (
                                <div key={course.id} className="bg-white rounded-3xl p-8 border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-500 group relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-brand-accent opacity-[0.05] rounded-full blur-3xl group-hover:scale-150 transition-all duration-700"></div>
                                    <div className="relative z-10">
                                        <h3 className="text-2xl font-black text-gray-900 mb-4 group-hover:text-brand-primary transition-colors">{course.title}</h3>
                                        <div className="flex items-center gap-3 mb-8 text-sm text-gray-500 font-medium">
                                            <div className="w-2 h-2 bg-brand-accent rounded-full animate-pulse shadow-[0_0_10px_rgba(254,221,89,0.5)]"></div>
                                            {course.instructor}
                                        </div>
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-end">
                                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">İlerleme</span>
                                                <span className="text-xl font-black text-brand-primary">{course.progress}%</span>
                                            </div>
                                            <div className="h-2.5 w-full bg-gray-50 rounded-full overflow-hidden ring-1 ring-inset ring-gray-100">
                                                <div className="h-full bg-gradient-to-r from-brand-accent/50 to-brand-accent rounded-full transition-all duration-1000" style={{ width: `${course.progress}%` }}>
                                                </div>
                                            </div>
                                            <Link href={`/student/my-lessons/${course.id}`} className="block pt-6">
                                                <button className="w-full py-4 rounded-xl bg-brand-primary text-white font-bold hover:bg-brand-primary-dark shadow-lg shadow-brand-primary/10 transition-all flex items-center justify-center gap-2 group/btn">
                                                    Öğrenmeye Devام Et
                                                    <i className="fas fa-arrow-right group-hover/btn:translate-x-1 transition-transform"></i>
                                                </button>
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <div className="col-span-1 md:col-span-2 text-center py-20 bg-gray-50/50 rounded-[40px] border border-dashed border-gray-200 relative overflow-hidden group">
                                    <div className="relative z-10">
                                        <div className="w-20 h-20 bg-white border border-gray-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                                            <i className="fas fa-book-open text-3xl text-gray-300"></i>
                                        </div>
                                        <h4 className="text-2xl font-bold text-gray-900 mb-3">Henüz bir kursunuz yok</h4>
                                        <p className="text-gray-500 mb-8 max-w-sm mx-auto text-sm leading-relaxed">Kendi hızınızda ilerleyebileceğiniz yüzlerce video dersi keşfedin.</p>
                                        <Link href="/courses">
                                            <button className="px-8 py-4 bg-brand-accent text-brand-primary font-black rounded-xl hover:bg-yellow-400 shadow-md hover:-translate-y-0.5 transition-all flex items-center gap-2 mx-auto">
                                                <i className="fas fa-search"></i>
                                                Kursları Keşfet
                                            </button>
                                        </Link>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'private' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-slideUp">
                            {privateBalances.length > 0 ? privateBalances.map((b) => (
                                <div key={b.id} className="bg-white rounded-3xl p-8 border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-500 group relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary opacity-[0.03] rounded-full blur-3xl group-hover:scale-150 transition-all duration-700"></div>
                                    <div className="relative z-10">
                                        <div className="flex items-center gap-4 mb-8 pb-6 border-b border-gray-50">
                                            <div className="w-16 h-16 rounded-2xl overflow-hidden relative shadow-sm ring-1 ring-gray-100 group-hover:ring-brand-accent transition-colors bg-gray-50">
                                                {b.teachers?.profiles?.avatar_url ? (
                                                    <Image src={b.teachers.profiles.avatar_url} alt={b.teachers.profiles.full_name} fill className="object-cover" />
                                                ) : (
                                                    <div className="w-full h-full bg-brand-primary text-brand-accent flex items-center justify-center text-2xl font-black">{b.teachers?.profiles?.full_name.charAt(0)}</div>
                                                )}
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-bold text-gray-900 group-hover:text-brand-primary transition-colors">{b.teachers?.profiles?.full_name}</h3>
                                                <p className="text-[10px] font-black text-brand-primary uppercase tracking-widest mt-1 flex items-center gap-1.5"><i className="fas fa-star text-brand-accent"></i> Özel Ders Hocam</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 mb-8">
                                            <div className="bg-gray-50 p-4 rounded-2xl text-center border border-gray-100">
                                                <div className="text-3xl font-black text-brand-primary">{b.lessons_remaining}</div>
                                                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Kalan Ders</div>
                                            </div>
                                            <div className="bg-gray-50 p-4 rounded-2xl text-center border border-gray-100">
                                                <div className="text-3xl font-black text-gray-300">{b.lessons_total}</div>
                                                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Toplam</div>
                                            </div>
                                        </div>

                                        <div className="flex gap-3">
                                            <Link href={`/teachers/${b.teacher_id}`} className="flex-1">
                                                <button className="w-full py-4 rounded-xl bg-brand-accent text-brand-primary font-black hover:bg-yellow-400 shadow-md transition-all flex items-center justify-center gap-2">
                                                    Randevu Al
                                                </button>
                                            </Link>
                                            <Link href="/student/messages" className="w-14 h-14 bg-gray-50 border border-gray-200 text-gray-400 rounded-xl flex items-center justify-center hover:bg-white hover:text-brand-primary hover:shadow-md transition-all">
                                                <i className="fas fa-comment-dots text-xl"></i>
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <div className="col-span-1 md:col-span-2 text-center py-20 bg-gray-50/50 rounded-[40px] border border-dashed border-gray-200 relative overflow-hidden group">
                                    <div className="relative z-10">
                                        <div className="w-20 h-20 bg-white border border-gray-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                                            <i className="fas fa-user-graduate text-3xl text-gray-300"></i>
                                        </div>
                                        <h4 className="text-2xl font-bold text-gray-900 mb-3">Birebir hocanız bulunmuyor</h4>
                                        <p className="text-gray-500 mb-8 max-w-sm mx-auto text-sm leading-relaxed">Uzman eğitmenlerimizden size özel ders paketleri satın alarak hızla ilerleyin.</p>
                                        <Link href="/private-lessons">
                                            <button className="px-8 py-4 bg-white border border-gray-200 text-gray-900 font-black rounded-xl hover:bg-gray-50 shadow-sm hover:-translate-y-0.5 transition-all flex items-center gap-2 mx-auto">
                                                <i className="fas fa-search"></i>
                                                Eğitmenleri Bul
                                            </button>
                                        </Link>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'groups' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-slideUp">
                            {enrolledGroups.length > 0 ? enrolledGroups.map((g) => (
                                <div key={g.id} className="bg-white rounded-3xl p-8 border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-500 group relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary opacity-[0.03] rounded-full blur-3xl group-hover:scale-150 transition-all duration-700"></div>
                                    <div className="relative z-10">
                                        <div className="flex justify-between items-start mb-6">
                                            <h3 className="text-2xl font-black text-gray-900 group-hover:text-brand-primary transition-colors">{g.groups?.title}</h3>
                                            <span className="px-3 py-1 bg-brand-primary text-brand-accent text-[10px] font-black rounded-full uppercase tracking-widest shadow-sm">Kayıtlı</span>
                                        </div>

                                        <div className="flex items-center justify-between mb-8 p-4 bg-gray-50 rounded-2xl border border-gray-100 group-hover:bg-white transition-colors">
                                            <div className="text-sm font-medium">
                                                <div className="text-[10px] font-black text-gray-400 uppercase mb-1">Eğitmen</div>
                                                <div className="text-gray-700 font-bold">{g.groups?.profiles?.full_name || 'Eğitmen'}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-[10px] font-black text-gray-400 uppercase mb-1">Başlangıç</div>
                                                <div className="text-gray-700 font-bold">{new Date(g.groups?.start_date).toLocaleDateString('tr-TR')}</div>
                                            </div>
                                        </div>

                                        <Link href={`/groups/${g.group_id}`} className="block">
                                            <button className="w-full py-4 rounded-xl bg-brand-primary text-white font-black hover:bg-brand-primary-dark shadow-lg shadow-brand-primary/10 transition-all flex items-center justify-center gap-2 group/btn">
                                                Grup Detayları & Dersler
                                                <i className="fas fa-arrow-right group-hover/btn:translate-x-1 transition-transform"></i>
                                            </button>
                                        </Link>
                                    </div>
                                </div>
                            )) : (
                                <div className="col-span-1 md:col-span-2 text-center py-20 bg-gray-50/50 rounded-[40px] border border-dashed border-gray-200 relative overflow-hidden group">
                                    <div className="relative z-10">
                                        <div className="w-20 h-20 bg-white border border-gray-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                                            <i className="fas fa-users text-3xl text-gray-300"></i>
                                        </div>
                                        <h4 className="text-2xl font-bold text-gray-900 mb-3">Herhangi bir gruba katılmadınız</h4>
                                        <p className="text-gray-500 mb-8 max-w-sm mx-auto text-sm leading-relaxed">Akranlarınızla birlikte öğrenmek ve pratik yapmak için canlı gruplara katılın.</p>
                                        <Link href="/groups">
                                            <button className="px-8 py-4 bg-white border border-gray-200 text-gray-900 font-black rounded-xl hover:bg-gray-50 shadow-sm hover:-translate-y-0.5 transition-all flex items-center gap-2 mx-auto">
                                                <i className="fas fa-search"></i>
                                                Grupları İncele
                                            </button>
                                        </Link>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* 4.5 UNIFIED SCHEDULE - MY AGENDA */}
            <div className="mb-16 animate-fadeIn">
                <div className="flex items-center justify-between mb-8 px-1">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-8 bg-brand-accent rounded-full shadow-sm"></div>
                        <h2 className="text-3xl font-black text-gray-900 tracking-tight">Ajandam</h2>
                    </div>
                </div>
                <div className="bg-white rounded-[40px] p-8 md:p-12 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary opacity-[0.02] rounded-full blur-3xl group-hover:opacity-[0.05] transition-opacity duration-700"></div>
                    <div className="relative z-10">
                        <UnifiedSchedule theme="light" />
                    </div>
                </div>
            </div>

            {/* 5. Platform Review Widget */}
            <div className="mb-12 bg-white rounded-3xl p-8 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group hover:shadow-[0_20px_40px_rgba(0,0,0,0.06)] transition-all duration-300">
                <div className="absolute top-0 right-0 w-48 h-48 bg-brand-accent opacity-[0.08] rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2 group-hover:opacity-20 transition-opacity duration-500"></div>
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
                    <div>
                        <h3 className="text-2xl font-black text-gray-900 mb-2">
                            Beyan Dil Akademi Deneyimini Değerlendir
                        </h3>
                        <p className="text-gray-500 max-w-lg text-sm leading-relaxed font-medium">
                            Düşünceleriniz bizim için çok değerli. Kurslarınıza gidip yorum ve puan bırakabilirsiniz.
                        </p>
                    </div>
                    <div className="flex flex-col items-center gap-4 bg-gray-50 p-6 rounded-2xl border border-gray-100 shadow-sm min-w-[220px]">
                        <div className="flex gap-2 text-brand-accent text-3xl pointer-events-none select-none" aria-hidden="true">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <span key={star}>★</span>
                            ))}
                        </div>
                        <Link
                            href="/student/review"
                            className="w-full mt-2 py-3 px-6 bg-brand-primary text-white text-sm font-black rounded-xl hover:bg-brand-primary-dark transition-all text-center flex items-center justify-center gap-2 shadow-sm"
                        >
                            <i className="fas fa-star text-brand-accent text-xs"></i>
                            Kursumuzu Değerlendir
                        </Link>
                    </div>
                </div>
            </div>

        </div >
    )
}
