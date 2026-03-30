'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { getEmbedUrl } from '@/lib/utils/video-utils'
import { saveStudentNoteAction, getStudentNoteAction } from '@/lib/actions/lesson-notes'

export default function CourseWatchPage() {
    const params = useParams()
    const router = useRouter()
    const courseId = params.id as string
    const { user, loading: authLoading } = useCurrentUser()

    const [loading, setLoading] = useState(true)
    const [course, setCourse] = useState<any>(null)
    const [lessons, setLessons] = useState<any[]>([])
    const [activeLesson, setActiveLesson] = useState<any>(null)
    const [progress, setProgress] = useState<string[]>([]) 
    const [isIssuingCert, setIsIssuingCert] = useState(false)
    const [enrollmentId, setEnrollmentId] = useState<string | null>(null)
    const [courseContent, setCourseContent] = useState<any[]>([])
    const [activeTab, setActiveTab] = useState<'lessons' | 'resources' | 'notes'>('lessons')
    const [studentNote, setStudentNote] = useState('')
    const [isSavingNote, setIsSavingNote] = useState(false)
    const [isCinemaMode, setIsCinemaMode] = useState(false)
    const [activeQuizId, setActiveQuizId] = useState<string | null>(null)
    const [isQuizLoading, setIsQuizLoading] = useState(false)

    // Security: Prevent Right Click and Keyboard Shortcuts
    useEffect(() => {
        const handleContextMenu = (e: MouseEvent) => {
            if ((e.target as HTMLElement).closest('.video-container')) {
                e.preventDefault()
            }
        }

        const handleKeyDown = (e: KeyboardEvent) => {
            // Block Ctrl+S, Ctrl+U, F12, Ctrl+Shift+I, Ctrl+Shift+C, Ctrl+Shift+J
            if (
                (e.ctrlKey && (e.key === 's' || e.key === 'u' || e.key === 'p')) ||
                e.key === 'F12' ||
                (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'C' || e.key === 'J'))
            ) {
                e.preventDefault()
            }
        }

        window.addEventListener('contextmenu', handleContextMenu)
        window.addEventListener('keydown', handleKeyDown)

        return () => {
            window.removeEventListener('contextmenu', handleContextMenu)
            window.removeEventListener('keydown', handleKeyDown)
        }
    }, [])

    const fetchData = useCallback(async () => {
        if (!user) return;
        setLoading(true)
        const supabase = createClient()

        try {
            // 1. Verify Enrollment
            const { data: enrollment, error: enrollError } = await (supabase
                .from('enrollments') as any)
                .select('id')
                .eq('student_id', user.id)
                .eq('course_id', courseId)
                .single()

            if (enrollError || !enrollment) {
                console.error("No enrollment found")
                // router.push('/student/my-lessons') // Optional: Redirect if no access
                return;
            }
            setEnrollmentId(enrollment.id)

            // 2. Fetch Course & Teacher
            const { data: courseData } = await supabase
                .from('courses')
                .select('*, profiles!teacher_id (full_name, avatar_url)')
                .eq('id', courseId)
                .single()

            setCourse(courseData)

            // 3. Fetch Lessons
            const { data: lessonsData } = await supabase
                .from('lessons')
                .select('*')
                .eq('course_id', courseId)
                .order('order_index', { ascending: true })

            setLessons(lessonsData || [])
            if (lessonsData && lessonsData.length > 0) {
                setActiveLesson(lessonsData[0])
            }

            // 4. Fetch Progress
            const { data: progressData } = await (supabase
                .from('lesson_progress') as any)
                .select('lesson_id, is_completed')
                .eq('enrollment_id', enrollment.id)

            setProgress(((progressData as any[]) || []).filter((p: any) => p.is_completed).map((p: any) => p.lesson_id))

            // 5. Fetch Resources
            const { data: contentData } = await supabase
                .from('course_content')
                .select('*')
                .eq('course_id', courseId)

            setCourseContent(contentData || [])

        } catch (err) {
            console.error("Error loading watch page:", err)
        } finally {
            setLoading(false)
        }
    }, [courseId, user])

    useEffect(() => {
        if (!authLoading && user) {
            fetchData()
        }
    }, [user, authLoading, fetchData])

    const markAsCompleted = async (lessonId: string) => {
        if (progress.includes(lessonId) || !enrollmentId) return;

        const supabase = createClient()
        try {
            const { data: existing } = await supabase
                .from('lesson_progress')
                .select('id')
                .eq('enrollment_id', enrollmentId)
                .eq('lesson_id', lessonId)
                .single()

            if (existing) {
                await (supabase
                    .from('lesson_progress') as any)
                    .update({ is_completed: true, updated_at: new Date().toISOString() })
                    .eq('id', (existing as any).id)
            } else {
                await (supabase
                    .from('lesson_progress') as any)
                    .insert({
                        enrollment_id: enrollmentId,
                        lesson_id: lessonId,
                        is_completed: true
                    })
            }
            setProgress(prev => [...prev, lessonId])
        } catch (err) {
            console.error("Error updating progress:", err)
        }
    }

    const handleSaveNote = async () => {
        if (!activeLesson) return
        setIsSavingNote(true)
        const res = await saveStudentNoteAction(activeLesson.id, studentNote)
        if (res.success) {
            // Toast or visual feedback? 
            // toast.success('Not kaydedildi')
        }
        setIsSavingNote(false)
    }

    useEffect(() => {
        if (activeLesson) {
            getStudentNoteAction(activeLesson.id).then(setStudentNote)
            
            // Check for Quiz if lesson type is QUIZ
            if (activeLesson.lesson_type === 'QUIZ') {
                setIsQuizLoading(true)
                const supabase = createClient()
                supabase
                    .from('quizzes')
                    .select('id')
                    .eq('lesson_id', activeLesson.id)
                    .maybeSingle()
                    .then(({ data }) => {
                        setActiveQuizId(data?.id || null)
                        setIsQuizLoading(false)
                    })
            } else {
                setActiveQuizId(null)
            }
        }
    }, [activeLesson])

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-[#0a0c10] flex flex-col items-center justify-center">
                <div className="w-16 h-16 border-4 border-brand-primary/10 border-t-brand-primary rounded-full animate-spin mb-6"></div>
                <p className="text-gray-500 font-black uppercase tracking-widest text-[10px] animate-pulse">Beyan Dil Akademi - Yükleniyor</p>
            </div>
        )
    }

    if (!course) {
        return (
            <div className="min-h-screen bg-[#0a0c10] flex flex-col items-center justify-center p-8 text-center" dir="rtl">
                <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 mb-8 border border-red-500/20">
                    <i className="fas fa-exclamation-triangle text-3xl"></i>
                </div>
                <h2 className="text-2xl font-black text-white mb-4">Kurs bulunamadı!</h2>
                <p className="text-gray-400 mb-8 max-w-sm">Kurs bulunamadı veya bu kursa erişim yetkiniz yok.</p>
                <Link href="/student/my-lessons" className="px-8 py-3 bg-brand-primary text-white font-black rounded-xl hover:bg-brand-primary-dark transition-all">
                    Derslerime Dön
                </Link>
            </div>
        )
    }

    const totalProgress = lessons.length > 0 ? Math.round((progress.length / lessons.length) * 100) : 0
    const allCompleted = lessons.length > 0 && lessons.every(l => progress.includes(l.id))

    return (
        <div className="min-h-screen bg-[#0a0c10] text-gray-100 flex flex-col selection:bg-brand-primary/30" dir="rtl">
            {/* Header: Cinematic Bar */}
            <header className={`h-20 bg-[#0f1115]/90 backdrop-blur-3xl border-b border-white/[0.03] px-6 flex items-center justify-between sticky top-0 z-50 transition-all duration-500 ${isCinemaMode ? '-translate-y-full opacity-0' : 'translate-y-0 opacity-100'}`}>
                <div className="flex items-center gap-6">
                    <Link href="/student/my-lessons" className="w-11 h-11 flex items-center justify-center rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] transition-all border border-white/[0.05] group">
                        <i className="fas fa-chevron-right text-gray-400 group-hover:translate-x-1 group-hover:text-white transition-all"></i>
                    </Link>
                    <div className="hidden md:block">
                        <h1 className="text-xl font-black text-white leading-none tracking-tight">{course.title}</h1>
                        <p className="text-gray-500 text-[10px] uppercase font-black tracking-widest mt-2 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-brand-primary rounded-full"></span>
                            Eğitmen: {course.profiles?.full_name}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="hidden lg:flex flex-col items-end mr-6">
                         <span className="text-[10px] font-black text-gray-500 uppercase tracking-tighter mb-1.5">KURSA DEVAM EDİLİYOR</span>
                         <div className="w-40 bg-white/[0.05] h-1.5 rounded-full overflow-hidden">
                            <div className="bg-brand-primary h-full rounded-full transition-all duration-1000" style={{ width: `${totalProgress}%` }}></div>
                         </div>
                    </div>
                    
                    {allCompleted && (
                        <button className="px-6 py-2.5 bg-brand-primary text-white text-xs font-black rounded-xl hover:shadow-[0_0_30px_rgba(32,69,68,0.4)] transition-all">
                            Sertifikayı İndir
                        </button>
                    )}
                </div>
            </header>

            <div className="flex flex-col xl:flex-row flex-1 relative overflow-hidden">
                {/* Main Content: Player Area */}
                <div className={`flex-1 flex flex-col overflow-y-auto custom-scrollbar transition-all duration-700 ${isCinemaMode ? 'xl:w-full' : 'xl:w-[70%]'}`}>
                    
                    {/* Video Section - Secure Container */}
                    <div className="relative group video-container bg-black shadow-2xl">
                        <div className={`aspect-video w-full flex items-center justify-center relative transition-all duration-500 ${isCinemaMode ? 'max-h-[85vh]' : 'max-h-[70vh]'}`}>
                            {activeLesson?.lesson_type === 'QUIZ' ? (
                                <div className="p-12 text-center flex flex-col items-center animate-in zoom-in duration-700">
                                    <div className="w-24 h-24 bg-brand-primary/10 rounded-[32px] flex items-center justify-center text-brand-primary mb-8 border border-brand-primary/20 shadow-2xl shadow-brand-primary/20">
                                        <i className="fas fa-tasks text-4xl"></i>
                                    </div>
                                    <h3 className="text-3xl font-black text-white mb-4">Bu ders bir sınav içeriyor.</h3>
                                    <p className="text-gray-400 text-sm max-w-sm mb-12">Öğrendiklerinizi test etme vakti! Devam etmek için sınavı başarıyla tamamlamanız gerekiyor.</p>
                                    
                                    {isQuizLoading ? (
                                        <div className="w-8 h-8 border-4 border-brand-primary/10 border-t-brand-primary rounded-full animate-spin"></div>
                                    ) : activeQuizId ? (
                                        <Link 
                                            href={`/student/quizzes/${activeQuizId}`}
                                            className="px-12 py-5 bg-brand-primary text-white font-black rounded-2xl hover:bg-brand-primary-dark transition-all shadow-2xl shadow-brand-primary/30 flex items-center gap-4 group"
                                        >
                                            Sınava Başla
                                            <i className="fas fa-play-circle group-hover:scale-110 transition-transform"></i>
                                        </Link>
                                    ) : (
                                        <p className="text-red-400 font-bold text-xs uppercase tracking-widest">Sınav henüz hazır değil.</p>
                                    )}
                                </div>
                            ) : activeLesson?.video_url ? (
                                <>
                                    {/* Security Overlay (Invisible but blocks interaction) */}
                                    <div className="absolute inset-0 z-10 pointer-events-none select-none">
                                        <div className="absolute bottom-6 right-6 opacity-20 pointer-events-none select-none">
                                            <p className="text-[10px] font-black text-white/30 uppercase tracking-[10px]">{(user as any)?.full_name || 'BEYAN AKADEMİ'}</p>
                                        </div>
                                    </div>
                                    
                                    <iframe
                                        src={getEmbedUrl(activeLesson.video_url) || ''}
                                        className="w-full h-full border-0 relative z-0"
                                        allowFullScreen
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                        referrerPolicy="strict-origin-when-cross-origin"
                                        title={activeLesson.title}
                                    ></iframe>
                                </>
                            ) : (
                                <div className="p-12 text-center flex flex-col items-center">
                                    <div className="w-24 h-24 bg-white/[0.02] rounded-full flex items-center justify-center text-gray-700 mb-8 border border-white/[0.03]">
                                        <i className="fas fa-play-circle text-4xl animate-pulse"></i>
                                    </div>
                                    <h3 className="text-2xl font-black text-gray-500 mb-3">Bu ders henüz bir video içermiyor.</h3>
                                    <p className="text-gray-600 text-sm max-w-sm">Eğitmeniniz bu ders için içerik yüklediğinde burada göreceksiniz. Lütfen dokümanları kontrol edin.</p>
                                </div>
                            )}

                            {/* Cinema Mode Toggle Button */}
                            <button 
                                onClick={() => setIsCinemaMode(!isCinemaMode)}
                                className="absolute bottom-4 left-4 z-20 w-10 h-10 bg-black/60 backdrop-blur-md rounded-xl flex items-center justify-center text-white/50 hover:text-white transition-all border border-white/10 opacity-0 group-hover:opacity-100"
                                title="Sinema Modu"
                            >
                                <i className={`fas ${isCinemaMode ? 'fa-compress' : 'fa-expand'}`}></i>
                            </button>
                        </div>
                    </div>

                    {/* Lesson Meta Area */}
                    <div className="p-8 lg:p-12 xl:p-16 max-w-5xl mx-auto w-full">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12 pb-12 border-b border-white/[0.05]">
                            <div className="text-right">
                                <div className="flex items-center gap-3 mb-4">
                                    <span className="px-3 py-1 bg-brand-primary/10 border border-brand-primary/20 text-brand-primary text-[10px] font-black rounded-lg uppercase tracking-widest">
                                        {activeLesson?.lesson_type || 'VİDEO DERS'}
                                    </span>
                                    {progress.includes(activeLesson?.id) && (
                                        <span className="text-green-500 text-[10px] font-black flex items-center gap-1.5">
                                            <i className="fas fa-check-circle"></i> TAMAMLANDI
                                        </span>
                                    )}
                                </div>
                                <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white mb-4 leading-tight">{activeLesson?.title || 'Ders Seçilmedi'}</h2>
                                <p className="text-gray-400 text-sm leading-relaxed max-w-3xl">
                                    {activeLesson?.description || 'Bu ders için detaylı açıklama bulunmuyor.'}
                                </p>
                            </div>

                            <button
                                onClick={() => activeLesson && markAsCompleted(activeLesson.id)}
                                disabled={!activeLesson || progress.includes(activeLesson.id)}
                                className={`px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[2px] transition-all flex items-center justify-center gap-3 active:scale-95 ${progress.includes(activeLesson?.id)
                                    ? 'bg-green-500/10 text-green-500 border border-green-500/20'
                                    : 'bg-white text-black hover:bg-brand-primary hover:text-white shadow-xl shadow-black/20'
                                }`}
                            >
                                {progress.includes(activeLesson?.id) ? (
                                    <>
                                        <i className="fas fa-check-double"></i>
                                        Sıradaki Derse Geç
                                    </>
                                ) : (
                                    <>
                                        <i className="fas fa-flag-checkered"></i>
                                        Dersi Bitir
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Tabs Navigation */}
                        <div className="flex items-center gap-10 border-b border-white/[0.05] mb-12">
                            <button
                                onClick={() => setActiveTab('lessons')}
                                className={`pb-5 text-[10px] font-black uppercase tracking-[3px] transition-all relative ${activeTab === 'lessons' ? 'text-brand-primary' : 'text-gray-500 hover:text-gray-300'}`}
                            >
                                Ders Materyali
                                {activeTab === 'lessons' && <span className="absolute bottom-0 right-0 left-0 h-[3px] bg-brand-primary rounded-full shadow-[0_0_20px_rgba(32,69,68,0.8)]"></span>}
                            </button>
                            <button
                                onClick={() => setActiveTab('notes')}
                                className={`pb-5 text-[10px] font-black uppercase tracking-[3px] transition-all relative ${activeTab === 'notes' ? 'text-brand-primary' : 'text-gray-500 hover:text-gray-300'}`}
                            >
                                Kişisel Notlarım
                                {activeTab === 'notes' && <span className="absolute bottom-0 right-0 left-0 h-[3px] bg-brand-primary rounded-full shadow-[0_0_20px_rgba(32,69,68,0.8)]"></span>}
                            </button>
                            <button
                                onClick={() => setActiveTab('resources')}
                                className={`pb-5 text-[10px] font-black uppercase tracking-[3px] transition-all relative ${activeTab === 'resources' ? 'text-brand-primary' : 'text-gray-500 hover:text-gray-300'}`}
                            >
                                Kaynaklar ({courseContent.length})
                                {activeTab === 'resources' && <span className="absolute bottom-0 right-0 left-0 h-[3px] bg-brand-primary rounded-full shadow-[0_0_20px_rgba(32,69,68,0.8)]"></span>}
                            </button>
                        </div>

                        {/* Tab Content */}
                        <div className="animate-fadeIn">
                            {activeTab === 'lessons' ? (
                                <div className="bg-white/[0.02] border border-white/[0.05] rounded-[32px] p-10 prose prose-invert prose-brand max-w-none shadow-inner">
                                    <div className="flex items-center gap-3 mb-8">
                                        <div className="w-10 h-10 bg-brand-primary/10 rounded-xl flex items-center justify-center text-brand-primary">
                                            <i className="fas fa-info-circle"></i>
                                        </div>
                                        <h3 className="text-xl font-black text-white m-0">Eğitmen Notu</h3>
                                    </div>
                                    <div className="text-gray-300 leading-loose" dangerouslySetInnerHTML={{ __html: activeLesson?.description || 'Ders notu bulunmuyor.' }}></div>
                                </div>
                            ) : activeTab === 'notes' ? (
                                <div className="bg-white/[0.02] border border-white/[0.05] rounded-[32px] p-10 shadow-inner">
                                    <div className="flex items-center justify-between mb-8">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-brand-primary/10 rounded-xl flex items-center justify-center text-brand-primary">
                                                <i className="fas fa-edit"></i>
                                            </div>
                                            <h3 className="text-xl font-black text-white m-0 tracking-tight">Kişisel Notlarım</h3>
                                        </div>
                                        <button 
                                            onClick={handleSaveNote}
                                            disabled={isSavingNote}
                                            className="px-6 py-2.5 bg-brand-primary text-white text-[10px] font-black rounded-lg hover:bg-brand-primary-dark transition-all disabled:opacity-50 shadow-lg shadow-brand-primary/10"
                                        >
                                            {isSavingNote ? 'KAYDEDİLİYOR...' : 'KAYDET'}
                                        </button>
                                    </div>
                                    <textarea 
                                        value={studentNote}
                                        onChange={(e) => setStudentNote(e.target.value)}
                                        className="w-full h-64 bg-transparent border border-white/10 rounded-2xl p-6 text-gray-300 font-medium focus:ring-2 focus:ring-brand-primary/20 outline-none resize-none custom-scrollbar"
                                        placeholder="Bu dersle ilgili kendi notlarınızı buraya yazabilirsiniz..."
                                    />
                                    <p className="text-[10px] text-gray-500 mt-4 text-left font-bold uppercase tracking-widest opacity-40">Notlarınız sadece sizin tarafınızdan görülebilir.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {courseContent.length > 0 ? courseContent.map((file) => (
                                        <a
                                            key={file.id}
                                            href={file.file_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="group bg-white/[0.02] p-5 rounded-2xl border border-white/[0.05] flex items-center gap-5 hover:bg-white/[0.04] hover:border-brand-primary/30 transition-all duration-300"
                                        >
                                            <div className="w-14 h-14 bg-brand-primary/5 rounded-xl flex items-center justify-center text-brand-primary group-hover:scale-110 transition-transform shadow-lg">
                                                <i className={`fas ${file.content_type === 'PDF' ? 'fa-file-pdf' : 'fa-file-download'} text-2xl`}></i>
                                            </div>
                                            <div className="flex-1 min-w-0 text-right">
                                                <p className="text-sm font-black text-white truncate group-hover:text-brand-primary transition-colors">{file.name}</p>
                                                <p className="text-[9px] text-gray-500 font-black mt-1 uppercase tracking-widest">{file.content_type || 'DOSYA'} • {file.file_size ? `${(file.file_size / 1024).toFixed(1)} KB` : 'DOKÜMAN'}</p>
                                            </div>
                                            <i className="fas fa-external-link-alt text-gray-700 group-hover:text-brand-primary transition-colors"></i>
                                        </a>
                                    )) : (
                                        <div className="col-span-full py-16 text-center border border-dashed border-white/[0.05] rounded-3xl">
                                            <i className="fas fa-folder-open text-gray-800 text-3xl mb-4 block"></i>
                                            <p className="text-gray-600 text-[10px] font-black uppercase tracking-widest">Bu ders için indirilebilir kaynak bulunmuyor.</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sidebar: Course Content / Playlist */}
                <aside className={`w-full xl:w-[30%] bg-[#0d0f14] border-t xl:border-t-0 xl:border-r border-white/[0.03] flex flex-col transition-all duration-700 shadow-[-20px_0_40px_rgba(0,0,0,0.5)] z-40 ${isCinemaMode ? 'translate-x-full opacity-0 pointer-events-none' : 'translate-x-0 opacity-100'}`}>
                    <div className="p-8 border-b border-white/[0.05]">
                        <h3 className="text-lg font-black text-white tracking-tight mb-6">Kurs Müfredatı</h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-gray-500">
                                <span>TAMAMLANMA: %{totalProgress}</span>
                                <span>{progress.length} / {lessons.length} DERS</span>
                            </div>
                            <div className="w-full h-2 bg-white/[0.03] rounded-full overflow-hidden p-[2px] ring-1 ring-white/[0.05]">
                                <div className="bg-gradient-to-l from-brand-primary to-emerald-400 h-full rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(32,69,68,0.5)]" style={{ width: `${totalProgress}%` }}></div>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-3">
                        {lessons.length > 0 ? lessons.map((lesson, idx) => {
                            const isCompleted = progress.includes(lesson.id)
                            const isActive = activeLesson?.id === lesson.id

                            return (
                                <button
                                    key={lesson.id}
                                    onClick={() => {
                                        setActiveLesson(lesson)
                                        if (window.innerWidth < 1280) {
                                            window.scrollTo({ top: 0, behavior: 'smooth' })
                                        }
                                    }}
                                    className={`w-full p-5 rounded-2xl flex items-center gap-5 transition-all text-right group relative overflow-hidden border ${isActive
                                        ? 'bg-brand-primary/10 border-brand-primary/40 shadow-xl'
                                        : 'hover:bg-white/[0.03] border-white/[0.02] bg-white/[0.01]'
                                    }`}
                                >
                                    {isActive && <div className="absolute right-0 top-0 bottom-0 w-[5px] bg-brand-primary shadow-[0_0_20px_rgba(32,69,68,1)]"></div>}
                                    
                                    <div className="flex-shrink-0 relative">
                                        {isCompleted ? (
                                            <div className="w-10 h-10 rounded-xl bg-green-500/10 text-green-500 border border-green-500/20 flex items-center justify-center">
                                                <i className="fas fa-check"></i>
                                            </div>
                                        ) : (
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-[11px] font-black transition-all ${isActive ? 'bg-brand-primary text-white' : 'bg-white/[0.05] text-gray-600 border border-white/[0.05]'}`}>
                                                {isActive ? <i className="fas fa-play rotate-180 translate-x-0.5"></i> : idx + 1}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <h4 className={`text-sm font-black truncate mb-1 transition-all ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-200'}`}>
                                            {lesson.title}
                                        </h4>
                                        <div className="flex items-center gap-3 opacity-60">
                                            <span className={`text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 ${isActive ? 'text-brand-primary' : 'text-gray-600'}`}>
                                                <i className={`fas ${lesson.video_url ? 'fa-video' : 'fa-file-alt'}`}></i>
                                                {lesson.lesson_type || 'Ders'}
                                            </span>
                                            {lesson.duration_minutes && (
                                                <span className="text-[9px] font-bold text-gray-700">{lesson.duration_minutes} dk</span>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            )
                        }) : (
                            <div className="flex flex-col items-center justify-center py-20 px-8 text-center bg-white/[0.01] rounded-[32px] border border-dashed border-white/[0.05]">
                                <div className="w-16 h-16 bg-white/[0.02] rounded-full flex items-center justify-center text-gray-800 mb-6">
                                    <i className="fas fa-ghost text-2xl opacity-20"></i>
                                </div>
                                <h4 className="text-sm font-black text-gray-600 mb-2">Henüz ders eklenmemiş</h4>
                                <p className="text-[10px] font-bold text-gray-700 uppercase tracking-widest">Eğitmeniniz yakında dersleri yükleyecektir.</p>
                            </div>
                        )}
                    </div>
                </aside>
            </div>
        </div>
    )
}
