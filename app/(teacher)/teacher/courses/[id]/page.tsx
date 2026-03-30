'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { toast } from 'react-hot-toast'
import { getCourseProgressAction } from '@/lib/actions/progress'
import Avatar from '@/components/Avatar'
import TeacherAnnouncements from '@/components/teacher/TeacherAnnouncements'

interface Lesson {
    id: string
    title: string
    description: string
    video_url: string
    duration_minutes: number
    order_index: number
    course_id: string
    lesson_type?: string
}

export default function TeacherCourseContentPage({ params }: { params: Promise<{ id: string }> }) {
    const { user, loading: authLoading } = useCurrentUser()
    const router = useRouter()
    const [course, setCourse] = useState<any>(null)
    const [lessons, setLessons] = useState<Lesson[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [editingLesson, setEditingLesson] = useState<Lesson | null>(null)
    const [isSaving, setIsSaving] = useState(false)
    const [activeTab, setActiveTab] = useState<'content' | 'progress' | 'announcements'>('content')
    const [studentsProgress, setStudentsProgress] = useState<any[]>([])
    const [loadingProgress, setLoadingProgress] = useState(false)

    // Form states
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [videoUrl, setVideoUrl] = useState('')
    const [duration, setDuration] = useState('10')
    const [videoFile, setVideoFile] = useState<File | null>(null)
    const [uploadProgress, setUploadProgress] = useState(0)
    const [uploadType, setUploadType] = useState<'url' | 'file'>('url')
    const [lessonType, setLessonType] = useState<string>('VIDEO')
    const [selectedQuizId, setSelectedQuizId] = useState<string>('')
    const [courseQuizzes, setCourseQuizzes] = useState<any[]>([])

    const unwrappedParams = use(params)
    const courseId = unwrappedParams.id

    const fetchCourseData = async () => {
        if (!user) return
        setLoading(true)
        const supabase = createClient()
        
        try {
            const { data: courseData, error: courseError } = await supabase
                .from('courses')
                .select('*')
                .eq('id', courseId)
                .eq('teacher_id', user.id)
                .single()

            if (courseError || !courseData) {
                toast.error('Yetkiniz yok veya kurs bulunamadı.')
                router.push('/teacher/courses')
                return
            }

            setCourse(courseData)

            const { data: lessonsData, error: lessonsError } = await supabase
                .from('lessons')
                .select('*')
                .eq('course_id', courseId)
                .order('order_index', { ascending: true })

            if (lessonsError) throw lessonsError
            setLessons(lessonsData || [])

            // Fetch course quizzes
            const { data: quizzesData } = await (supabase
                .from('quizzes') as any)
                .select('id, title, lesson_id')
                .eq('course_id', courseId)
            
            setCourseQuizzes(quizzesData || [])

        } catch (err) {
            console.error("Error fetching course content:", err)
        } finally {
            setLoading(false)
        }
    }

    const fetchProgressData = async () => {
        setLoadingProgress(true)
        try {
            const data = await getCourseProgressAction(courseId)
            setStudentsProgress(data || [])
        } catch (err) {
            console.error("Error fetching progress:", err)
        } finally {
            setLoadingProgress(false)
        }
    }

    useEffect(() => {
        if (!authLoading) {
            fetchCourseData()
        }
    }, [user, authLoading])

    useEffect(() => {
        if (activeTab === 'progress') {
            fetchProgressData()
        }
    }, [activeTab])

    const openCreateModal = () => {
        setEditingLesson(null)
        setTitle('')
        setDescription('')
        setVideoUrl('')
        setVideoFile(null)
        setUploadProgress(0)
        setDuration('10')
        setLessonType('VIDEO')
        setSelectedQuizId('')
        setShowModal(true)
    }

    const openEditModal = (lesson: Lesson) => {
        setEditingLesson(lesson)
        setTitle(lesson.title)
        setDescription(lesson.description || '')
        setDuration(lesson.duration_minutes?.toString() || '10')
        const isUrl = lesson.video_url?.startsWith('http') && !lesson.video_url.includes('supabase')
        setUploadType(isUrl ? 'url' : 'file')
        setVideoUrl(lesson.video_url || '')
        setLessonType(lesson.lesson_type || 'VIDEO')
        
        // Find existing quiz for this lesson
        const existingQuiz = courseQuizzes.find(q => q.lesson_id === lesson.id)
        setSelectedQuizId(existingQuiz?.id || '')

        setVideoFile(null)
        setUploadProgress(0)
        setShowModal(true)
    }

    const uploadVideoFile = async (file: File) => {
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()
        const token = session?.access_token

        if (!token) throw new Error("Oturum açılamadı. Lütfen tekrar giriş yapın.")

        const fileExt = file.name.split('.').pop()
        const fileName = `${courseId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
        const filePath = `lesson-videos/${fileName}`
        
        // Use constants or direct access
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '')
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        
        if (!supabaseUrl || !supabaseKey) throw new Error("Supabase yapılandırması eksik.")
        
        const url = `${supabaseUrl}/storage/v1/object/course-content/${filePath}`

        return new Promise<string>((resolve, reject) => {
            const xhr = new XMLHttpRequest()
            
            // Set up event listeners BEFORE calling open()
            xhr.onload = () => {
                if (xhr.status === 200 || xhr.status === 201) {
                    const { data: { publicUrl } } = supabase.storage
                        .from('course-content')
                        .getPublicUrl(filePath)
                    resolve(publicUrl)
                } else {
                    console.error("XHR Fail Status:", xhr.status, xhr.responseText)
                    reject(new Error(`Yükleme başarısız oldu (Status: ${xhr.status})`))
                }
            }

            xhr.onerror = () => {
                console.error("XHR Network Error - ReadyState:", xhr.readyState, "Status:", xhr.status)
                reject(new Error("Ağ hatası oluştu. Lütfen internet bağlantınızı veya Supabase CORS ayarlarını kontrol edin."))
            }

            xhr.open('POST', url)
            
            // Explicitly set headers for Supabase Storage API
            xhr.setRequestHeader('Authorization', `Bearer ${token}`)
            xhr.setRequestHeader('apikey', supabaseKey)
            xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream')
            xhr.setRequestHeader('x-upsert', 'true') // Allow overwriting if needed
            
            // Now handle upload progress
            if (xhr.upload) {
                xhr.upload.onprogress = (event) => {
                    if (event.lengthComputable) {
                        const percent = Math.round((event.loaded / event.total) * 100)
                        setUploadProgress(percent)
                    }
                }
            }

            xhr.send(file)
        })
    }

    const handleSaveLesson = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!title.trim()) {
            toast.error('Lütfen ders başlığını doldurun.')
            return
        }

        setIsSaving(true)
        setUploadProgress(0)
        const supabase = createClient()

        try {
            let finalVideoUrl = videoUrl

            if (uploadType === 'file' && videoFile) {
                // Real-time progress upload
                finalVideoUrl = await uploadVideoFile(videoFile)
            }

            const lessonPayload: any = {
                title,
                description,
                video_url: lessonType === 'QUIZ' ? null : finalVideoUrl,
                duration_minutes: parseInt(duration),
                lesson_type: lessonType,
                is_published: true,
                updated_at: new Date().toISOString()
            }

            let savedLessonId = editingLesson?.id

            if (editingLesson) {
                const { error } = await (supabase
                    .from('lessons') as any)
                    .update(lessonPayload)
                    .eq('id', editingLesson.id)

                if (error) throw error
                toast.success('Ders güncellendi')
            } else {
                const newOrderIndex = lessons.length > 0 ? Math.max(...lessons.map(l => l.order_index)) + 1 : 1
                const { data: newLesson, error } = await (supabase
                    .from('lessons') as any)
                    .insert({
                        ...lessonPayload,
                        course_id: courseId,
                        order_index: newOrderIndex
                    })
                    .select()
                    .single()

                if (error) throw error
                savedLessonId = newLesson.id
                toast.success('Ders eklendi')
            }

            // Sync Quiz lesson_id
            if (lessonType === 'QUIZ' && selectedQuizId && savedLessonId) {
                // Clear any previous links to this lesson
                await (supabase
                    .from('quizzes') as any)
                    .update({ lesson_id: null })
                    .eq('lesson_id', savedLessonId)
                
                // Link new quiz
                await (supabase
                    .from('quizzes') as any)
                    .update({ lesson_id: savedLessonId })
                    .eq('id', selectedQuizId)
            } else if (savedLessonId) {
                // If type changed from quiz to something else, clear link
                await (supabase
                    .from('quizzes') as any)
                    .update({ lesson_id: null })
                    .eq('lesson_id', savedLessonId)
            }

            setShowModal(false)
            fetchCourseData()
        } catch (error: any) {
            console.error('Save error:', error)
            toast.error(error.message || 'Kaydedilemedi')
        } finally {
            setIsSaving(false)
            setUploadProgress(0)
        }
    }

    const handleDeleteLesson = async (id: string) => {
        if (!confirm('Bu dersi silmek istediğinizden emin misiniz?')) return

        const supabase = createClient()
        try {
            const { error } = await supabase.from('lessons').delete().eq('id', id)
            if (error) throw error
            toast.success('Ders silindi')
            fetchCourseData()
        } catch (error: any) {
            toast.error(error.message || 'Silinemedi')
        }
    }

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
                <div className="w-12 h-12 border-4 border-brand-primary/10 border-t-brand-primary rounded-full animate-spin"></div>
            </div>
        )
    }

    if (!course) return null

    return (
        <div className="min-h-screen bg-[#FDFDFE] p-6 lg:p-12 xl:p-14" dir="rtl transition-all">
            <div className="max-w-5xl mx-auto">
                {/* Compact Premium Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-12 border-b border-gray-100 pb-12">
                    <div className="text-right">
                        <Link href="/teacher/courses" className="text-[9px] font-black tracking-widest text-gray-400 hover:text-brand-primary flex items-center gap-2 mb-3 uppercase">
                            <i className="fas fa-arrow-right text-[8px]"></i>
                            Kurs Yönetimi
                        </Link>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-2">{course.title}</h1>
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                            <span className="w-2 h-2 bg-brand-primary rounded-full blur-[2px]"></span>
                            Müfredat ve Ders Ayarları
                        </p>
                    </div>
                    
                    <button
                        onClick={openCreateModal}
                        className="bg-brand-primary text-white pl-8 pr-6 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-[2px] hover:bg-brand-primary-dark transition-all shadow-xl shadow-brand-primary/10 flex items-center gap-3 active:scale-95"
                    >
                        Yeni Bir Ders Ekle
                        <i className="fas fa-plus bg-white/20 p-1.5 rounded-lg text-[9px]"></i>
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-10 border-b border-gray-100 mb-12">
                    <button
                        onClick={() => setActiveTab('content')}
                        className={`pb-4 text-[10px] font-black uppercase tracking-[2px] transition-all relative ${activeTab === 'content' ? 'text-brand-primary' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        Ders İçeriği
                        {activeTab === 'content' && <span className="absolute bottom-0 right-0 left-0 h-[3px] bg-brand-primary rounded-full shadow-[0_0_20px_rgba(32,69,68,0.4)]"></span>}
                    </button>
                    <button
                        onClick={() => setActiveTab('progress')}
                        className={`pb-4 text-[10px] font-black uppercase tracking-[2px] transition-all relative ${activeTab === 'progress' ? 'text-brand-primary' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        Öğrenci İlerlemesi
                        {activeTab === 'progress' && <span className="absolute bottom-0 right-0 left-0 h-[3px] bg-brand-primary rounded-full shadow-[0_0_20px_rgba(32,69,68,0.4)]"></span>}
                    </button>
                    <button
                        onClick={() => setActiveTab('announcements')}
                        className={`pb-4 text-[10px] font-black uppercase tracking-[2px] transition-all relative ${activeTab === 'announcements' ? 'text-brand-primary' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        Duyuru Gönder
                        {activeTab === 'announcements' && <span className="absolute bottom-0 right-0 left-0 h-[3px] bg-brand-primary rounded-full shadow-[0_0_20px_rgba(32,69,68,0.4)]"></span>}
                    </button>
                </div>

                {activeTab === 'content' ? (
                    /* List View */
                <div className="grid grid-cols-1 gap-4">
                    {lessons.length === 0 ? (
                        <div className="text-center py-20 bg-white border border-dashed border-gray-200 rounded-[32px]">
                            <div className="w-16 h-16 bg-gray-50 text-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                                <i className="fas fa-play text-2xl"></i>
                            </div>
                            <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest">Henüz ders bulunmuyor</h3>
                        </div>
                    ) : (
                        lessons.map((lesson, idx) => (
                            <div key={lesson.id} className="group bg-white p-5 rounded-3xl border border-gray-100/60 shadow-sm hover:shadow-xl hover:border-brand-primary/20 transition-all duration-500 flex items-center justify-between">
                                <div className="flex items-center gap-5">
                                    <div className="w-10 h-10 rounded-2xl bg-gray-50 text-gray-300 font-black text-[10px] flex items-center justify-center group-hover:bg-brand-primary group-hover:text-white transition-all shadow-inner">
                                        {String(idx + 1).padStart(2, '0')}
                                    </div>
                                    <div>
                                        <h4 className="font-black text-gray-900 group-hover:text-brand-primary transition-all text-base mb-0.5">{lesson.title}</h4>
                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-3">
                                            <span className="flex items-center gap-1.5"><i className="far fa-clock text-brand-accent"></i> {lesson.duration_minutes}dk</span>
                                            {lesson.video_url && <span className="text-brand-primary/70 flex items-center gap-1.5"><i className="fas fa-check-circle"></i> Video Aktif</span>}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => openEditModal(lesson)}
                                        className="w-10 h-10 rounded-xl bg-gray-50/50 text-gray-400 flex items-center justify-center hover:bg-brand-primary hover:text-white transition-all active:scale-90"
                                    >
                                        <i className="fas fa-pen text-[10px]"></i>
                                    </button>
                                    <button 
                                        onClick={() => handleDeleteLesson(lesson.id)}
                                        className="w-10 h-10 rounded-xl bg-gray-50/50 text-red-200 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all active:scale-90"
                                    >
                                        <i className="fas fa-trash text-[10px]"></i>
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
                ) : activeTab === 'progress' ? (
                    /* Progress View */
                    <div className="bg-white rounded-[32px] border border-gray-100 overflow-hidden shadow-sm">
                        {/* ... table content remains same ... */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-right">
                                <thead className="bg-gray-50/50">
                                    <tr>
                                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Öğrenci</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">İlerleme</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Sınav Notları</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-left">Tamamlanan</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {loadingProgress ? (
                                        <tr>
                                            <td colSpan={3} className="px-8 py-20 text-center">
                                                <div className="w-8 h-8 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin mx-auto"></div>
                                            </td>
                                        </tr>
                                    ) : studentsProgress.length > 0 ? (
                                        studentsProgress.map((student) => {
                                            const totalLessons = lessons.length
                                            const completedCount = student.completed_lessons?.length || 0
                                            const progressPercent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0

                                            return (
                                                <tr key={student.id} className="hover:bg-gray-50/30 transition-all group">
                                                    <td className="px-8 py-5">
                                                        <div className="flex items-center gap-4">
                                                            <Avatar src={student.profiles?.avatar_url} name={student.profiles?.full_name} size={40} />
                                                            <div className="font-bold text-gray-900 group-hover:text-brand-primary transition-colors">{student.profiles?.full_name}</div>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        <div className="flex flex-wrap justify-center gap-2">
                                                            {student.quiz_results?.length > 0 ? (
                                                                student.quiz_results.map((qr: any, qidx: number) => (
                                                                    <div key={qr.quiz_id + qidx} className={`px-3 py-1.5 rounded-xl border flex flex-col items-center gap-0.5 ${qr.passed ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
                                                                        <span className="text-[8px] font-black uppercase tracking-tighter opacity-70">{(qr.quizzes as any)?.title || 'Sınav'}</span>
                                                                        <span className="text-xs font-black">{qr.score}</span>
                                                                    </div>
                                                                ))
                                                            ) : (
                                                                <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">Henüz Yok</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-5 text-left">
                                                        <span className="text-sm font-bold text-gray-700">{completedCount} / {totalLessons} Ders</span>
                                                    </td>
                                                </tr>
                                            )
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan={3} className="px-8 py-20 text-center">
                                                <p className="text-xs font-black text-gray-300 uppercase tracking-widest">Kursa henüz öğrenci kayıt olmamış</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    /* Announcements View */
                    <div className="max-w-xl mx-auto">
                        <TeacherAnnouncements courseId={courseId} />
                    </div>
                )}

                {/* MODAL: COMPACT & ELEGANT */}
                {showModal && (
                    <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-[99999] flex items-start justify-center p-6 pt-24 overflow-y-auto">
                        <div className="bg-white rounded-[32px] w-full max-w-md shadow-[0_25px_70px_rgba(0,0,0,0.2)] relative animate-in fade-in slide-in-from-top-4 duration-500 overflow-hidden border border-white/50">
                            <div className="p-8 lg:p-10 text-right">
                                <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-50">
                                    <div>
                                        <h3 className="text-xl font-black text-gray-900 tracking-tight leading-none mb-2">
                                            {editingLesson ? 'Dersi Düzenle' : 'Ders Bilgileri'}
                                        </h3>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Müfredatı Güncelleyin</p>
                                    </div>
                                    <button 
                                        onClick={() => setShowModal(false)}
                                        className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all"
                                    >
                                        <i className="fas fa-times text-sm"></i>
                                    </button>
                                </div>

                                <form onSubmit={handleSaveLesson} className="space-y-6">
                                    <div className="space-y-4">
                                        <div className="relative">
                                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 mr-1">Ders Adı *</label>
                                            <input
                                                type="text"
                                                value={title}
                                                onChange={(e) => setTitle(e.target.value)}
                                                className="w-full px-5 py-3.5 bg-gray-50/50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary transition-all font-black text-gray-900 text-sm"
                                                placeholder="Örn: 01. Tanışma"
                                                required
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 mr-1">Süre (Dk)</label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={duration}
                                                    onChange={(e) => setDuration(e.target.value)}
                                                    className="w-full px-5 py-3.5 bg-gray-50/50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary transition-all font-black text-gray-900 text-sm"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 mr-1">Ders Tipi</label>
                                                <select
                                                    value={lessonType}
                                                    onChange={(e) => setLessonType(e.target.value)}
                                                    className="w-full px-5 py-3.5 bg-gray-50/50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary transition-all font-black text-gray-900 text-[10px] appearance-none"
                                                >
                                                    <option value="VIDEO">Video Ders</option>
                                                    <option value="QUIZ">Sınav</option>
                                                    <option value="READING">Okuma Materyali</option>
                                                    <option value="ASSIGNMENT">Ödev</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 mr-1">Kaynaq</label>
                                                {lessonType === 'VIDEO' ? (
                                                    <div className="flex p-1 bg-gray-100 rounded-xl gap-1">
                                                        <button type="button" onClick={()=>setUploadType('url')} className={`flex-1 py-2 text-[8px] font-black uppercase tracking-widest rounded-lg transition-all ${uploadType==='url'?'bg-white text-brand-primary shadow-sm':'text-gray-400'}`}>Link</button>
                                                        <button type="button" onClick={()=>setUploadType('file')} className={`flex-1 py-2 text-[8px] font-black uppercase tracking-widest rounded-lg transition-all ${uploadType==='file'?'bg-white text-brand-primary shadow-sm':'text-gray-400'}`}>Dosya</button>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center justify-center h-full">
                                                        <span className="text-[8px] font-black text-gray-300 uppercase letter-spacing-widest">N/A</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {lessonType === 'QUIZ' && (
                                            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 mr-1">Sınav Seçin *</label>
                                                <select
                                                    value={selectedQuizId}
                                                    onChange={(e) => setSelectedQuizId(e.target.value)}
                                                    className="w-full px-5 py-3.5 bg-brand-primary/5 border border-brand-primary/20 rounded-2xl focus:outline-none focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary transition-all font-black text-brand-primary text-sm appearance-none"
                                                    required
                                                >
                                                    <option value="">Sınav Seçiniz...</option>
                                                    {courseQuizzes.map(q => (
                                                        <option key={q.id} value={q.id}>{q.title}</option>
                                                    ))}
                                                </select>
                                                <p className="text-[8px] font-bold text-gray-400 mt-2 pr-1 uppercase tracking-widest">Sınav listenizde yoksa önce "Sınav Yönetimi" sayfasından oluşturun.</p>
                                            </div>
                                        )}

                                        <div>
                                            {lessonType === 'VIDEO' ? (
                                                uploadType === 'url' ? (
                                                    <div className="animate-in fade-in duration-300">
                                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 mr-1">Video Bağlantısı</label>
                                                        <input
                                                            type="url"
                                                            value={videoUrl}
                                                            onChange={(e) => setVideoUrl(e.target.value)}
                                                            className="w-full px-5 py-3.5 bg-white border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary transition-all font-bold text-gray-900 text-xs shadow-sm"
                                                            placeholder="YouTube / Vimeo / MP4 Link"
                                                            required={uploadType === 'url'}
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="animate-in fade-in duration-300">
                                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 mr-1">Video Dosyası</label>
                                                        <div className="border border-dashed border-gray-200 rounded-2xl p-6 hover:bg-brand-primary/[0.02] hover:border-brand-primary/20 transition-all text-center relative group">
                                                            <input type="file" onChange={(e)=>{
                                                                const f = e.target.files?.[0];
                                                                if(f && f.size < 100*1024*1024) setVideoFile(f);
                                                                else if(f) toast.error("Max 100MB");
                                                            }} className="absolute inset-0 opacity-0 cursor-pointer" />
                                                            <i className="fas fa-cloud-upload-alt text-xl text-gray-200 group-hover:text-brand-primary transition-all mb-2 block"></i>
                                                            <p className="text-[10px] font-black text-gray-400 uppercase truncate px-4">{videoFile ? videoFile.name : 'Dosya Seçin'}</p>
                                                        </div>
                                                    </div>
                                                )
                                            ) : null}
                                        </div>

                                        <div>
                                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 mr-1">Ders Notu (Opsiyonel)</label>
                                            <textarea
                                                value={description}
                                                onChange={(e) => setDescription(e.target.value)}
                                                className="w-full px-5 py-3.5 bg-gray-50/50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary transition-all font-bold text-gray-700 text-xs min-h-[80px]"
                                                placeholder="Bu derste ne anlatılıyor..."
                                            />
                                        </div>
                                    </div>

                                    {/* PROGRESS BAR */}
                                    {isSaving && uploadType === 'file' && videoFile && (
                                        <div className="pt-4 animate-in fade-in duration-300">
                                            <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-brand-primary mb-2">
                                                <span>Video Yükleniyor...</span>
                                                <span>%{uploadProgress}</span>
                                            </div>
                                            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-brand-primary transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="pt-8 flex gap-3">
                                        <button
                                            type="submit"
                                            disabled={isSaving}
                                            className="flex-[2] bg-brand-primary text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-[2px] hover:bg-brand-primary-dark transition-all shadow-xl shadow-brand-primary/10 disabled:opacity-50 active:scale-95"
                                        >
                                            {isSaving ? (
                                                <span className="flex items-center justify-center gap-2">
                                                    <i className="fas fa-circle-notch animate-spin"></i>
                                                    {uploadType === 'file' && videoFile ? (uploadProgress < 100 ? `${uploadProgress}%` : 'İşleniyor...') : 'Kaydediliyor...'}
                                                </span>
                                            ) : 'Dersi Kaydet'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setShowModal(false)}
                                            className="flex-1 bg-gray-50 text-gray-400 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[1px] hover:bg-red-50 hover:text-red-500 transition-all"
                                        >
                                            İptal
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
