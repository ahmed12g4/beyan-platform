'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'react-hot-toast'
import { createQuizAction, deleteQuizAction, getQuizResultsAction } from '@/lib/actions/quizzes'
import Avatar from '@/components/Avatar'

interface Question {
    question_text: string
    options: string[]
    correct_option_index: number
}

export default function TeacherQuizzesPage() {
    const { user, loading: authLoading } = useCurrentUser()
    const router = useRouter()
    const [quizzes, setQuizzes] = useState<any[]>([])
    const [courses, setCourses] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [isSaving, setIsSaving] = useState(false)

    // Results Modal State
    const [showResultsModal, setShowResultsModal] = useState(false)
    const [selectedQuiz, setSelectedQuiz] = useState<any>(null)
    const [quizResults, setQuizResults] = useState<any[]>([])
    const [resultsLoading, setResultsLoading] = useState(false)

    // Form State
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [selectedCourse, setSelectedCourse] = useState('')
    const [minPassingScore, setMinPassingScore] = useState(50)
    const [questions, setQuestions] = useState<Question[]>([
        { question_text: '', options: ['', '', '', ''], correct_option_index: 0 }
    ])

    const fetchInitialData = async () => {
        if (!user) return
        setLoading(true)
        const supabase = createClient()
        
        try {
            // Fetch courses
            const { data: coursesData } = await supabase
                .from('courses')
                .select('id, title')
                .eq('teacher_id', user.id)
            
            setCourses(coursesData || [])

            // Fetch quizzes
            const { data: quizzesData } = await (supabase
                .from('quizzes') as any)
                .select('*, courses(title)')
                .order('created_at', { ascending: false })
            
            setQuizzes(quizzesData || [])
        } catch (err) {
            console.error("Error fetching quiz data:", err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (!authLoading) {
            fetchInitialData()
        }
    }, [user, authLoading])

    const handleAddQuestion = () => {
        setQuestions([...questions, { question_text: '', options: ['', '', '', ''], correct_option_index: 0 }])
    }

    const handleRemoveQuestion = (index: number) => {
        if (questions.length === 1) return
        setQuestions(questions.filter((_, i) => i !== index))
    }

    const handleQuestionChange = (index: number, field: string, value: any) => {
        const newQuestions = [...questions]
        if (field === 'question_text') {
            newQuestions[index].question_text = value
        } else if (field === 'correct_option_index') {
            newQuestions[index].correct_option_index = value
        }
        setQuestions(newQuestions)
    }

    const handleOptionChange = (qIndex: number, oIndex: number, value: string) => {
        const newQuestions = [...questions]
        newQuestions[qIndex].options[oIndex] = value
        setQuestions(newQuestions)
    }

    const handleSaveQuiz = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedCourse) return toast.error('Lütfen bir kurs seçin.')
        if (questions.some(q => !q.question_text.trim() || q.options.some(o => !o.trim()))) {
            return toast.error('Lütfen tüm soru ve seçenekleri doldurun.')
        }

        setIsSaving(true)
        const quizData = {
            title,
            description,
            course_id: selectedCourse,
            min_passing_score: minPassingScore
        }

        const res = await createQuizAction(quizData, questions)
        if (res.success) {
            toast.success('Sınav başarıyla oluşturuldu.')
            setShowModal(false)
            fetchInitialData()
            // Reset form
            setTitle('')
            setDescription('')
            setSelectedCourse('')
            setQuestions([{ question_text: '', options: ['', '', '', ''], correct_option_index: 0 }])
        } else {
            toast.error(res.error || 'Sınav oluşturulamadı.')
        }
        setIsSaving(false)
    }

    const handleDeleteQuiz = async (id: string, title: string) => {
        if (!confirm(`"${title}" sınavını silmek istediğinize emin misiniz?`)) return

        const res = await deleteQuizAction(id)
        if (res.success) {
            toast.success('Sınav silindi.')
            fetchInitialData()
        } else {
            toast.error(res.error || 'Sınav silinemedi.')
        }
    }

    const handleViewResults = async (quiz: any) => {
        setSelectedQuiz(quiz)
        setShowResultsModal(true)
        setResultsLoading(true)
        
        const res = await getQuizResultsAction(quiz.id)
        if (res.success) {
            setQuizResults(res.data || [])
        } else {
            toast.error('Sonuçlar yüklenemedi.')
        }
        setResultsLoading(false)
    }

    if (authLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#FDFDFE]">
                <div className="w-12 h-12 border-4 border-brand-primary/10 border-t-brand-primary rounded-full animate-spin"></div>
            </div>
        )
    }

    return (
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-12" dir="rtl">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-12 border-b border-gray-100 pb-12">
                <div className="text-right">
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-2">Sınav Yönetimi 📝</h1>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <span className="w-2 h-2 bg-brand-accent rounded-full blur-[1px]"></span>
                        Kurslarınız için sınavlar oluşturun ve yönetin
                    </p>
                </div>
                
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-brand-primary text-white pl-8 pr-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[2px] hover:bg-brand-primary-dark transition-all shadow-xl shadow-brand-primary/10 flex items-center gap-3 active:scale-95"
                >
                    Yeni Sınav Oluştur
                    <i className="fas fa-plus bg-white/20 p-2 rounded-lg text-[10px]"></i>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {quizzes.length === 0 ? (
                    <div className="col-span-full py-24 text-center bg-white rounded-[40px] border border-dashed border-gray-100 shadow-sm">
                        <div className="w-20 h-20 bg-gray-50 text-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                            <i className="fas fa-file-alt text-3xl"></i>
                        </div>
                        <h3 className="text-lg font-black text-gray-400 uppercase tracking-widest">Henüz sınav bulunmuyor</h3>
                    </div>
                ) : (
                    quizzes.map((quiz) => (
                        <div key={quiz.id} className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm hover:shadow-xl hover:border-brand-primary/20 transition-all duration-500 group relative overflow-hidden">
                            <div className="absolute -right-4 -top-4 w-24 h-24 bg-brand-primary/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                            
                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="w-12 h-12 bg-gray-50 text-brand-primary rounded-2xl flex items-center justify-center text-xl shadow-inner group-hover:bg-brand-primary group-hover:text-white transition-all">
                                        <i className="fas fa-tasks"></i>
                                    </div>
                                    <span className="bg-gray-50 text-gray-400 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">
                                        %{quiz.min_passing_score} Geçme Notu
                                    </span>
                                </div>
                                
                                <h3 className="text-xl font-black text-gray-900 group-hover:text-brand-primary transition-colors mb-2">{quiz.title}</h3>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6 line-clamp-1">
                                    <i className="fas fa-book-open ml-2 text-brand-accent"></i>
                                    {quiz.courses?.title || 'Genel Sınav'}
                                </p>
                                
                                <div className="flex items-center justify-between pt-6 border-t border-gray-50">
                                    <div className="text-[10px] font-bold text-gray-400 uppercase">
                                        {new Date(quiz.created_at).toLocaleDateString('tr-TR')}
                                    </div>
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => handleViewResults(quiz)}
                                            className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-50 text-gray-400 hover:bg-brand-primary hover:text-white transition-all"
                                            title="Sonuçları Gör"
                                        >
                                            <i className="fas fa-eye text-xs"></i>
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteQuiz(quiz.id, quiz.title)}
                                            className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-50 text-red-300 hover:bg-red-500 hover:text-white transition-all"
                                            title="Sil"
                                        >
                                            <i className="fas fa-trash text-xs"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* CREATE MODAL */}
            {showModal && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md z-[99999] flex items-center justify-center p-6 lg:p-12 overflow-y-auto">
                    <div className="bg-white rounded-[40px] w-full max-w-4xl max-h-[90vh] shadow-[0_32px_80px_rgba(0,0,0,0.3)] relative animate-in zoom-in-95 fade-in duration-500 overflow-hidden border border-white/50 flex flex-col">
                        <div className="p-8 lg:p-12 border-b border-gray-50 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-xl z-20">
                            <div>
                                <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-2">Yeni Sınav Oluştur 🚀</h2>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Öğrencilerinizi test edin</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all active:scale-90">
                                <i className="fas fa-times"></i>
                            </button>
                        </div>

                        <form onSubmit={handleSaveQuiz} className="p-8 lg:p-12 overflow-y-auto flex-1 space-y-10 custom-scrollbar">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 pr-1">Sınav Başlığı *</label>
                                        <input
                                            type="text"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary transition-all font-black text-gray-900"
                                            placeholder="Örn: Hafta 1 Değerlendirme"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 pr-1">Sınav Açıklaması</label>
                                        <textarea
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary transition-all font-medium text-gray-700 min-h-[120px]"
                                            placeholder="Bu sınavda ne ölçülüyor..."
                                        />
                                    </div>
                                </div>
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 pr-1">İlgili Kurs *</label>
                                        <select
                                            value={selectedCourse}
                                            onChange={(e) => setSelectedCourse(e.target.value)}
                                            className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary transition-all font-black text-gray-900 appearance-none"
                                            required
                                        >
                                            <option value="">Kurs Seçin</option>
                                            {courses.map(c => (
                                                <option key={c.id} value={c.id}>{c.title}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 pr-1">Minimum Geçme Notu (%)</label>
                                        <div className="flex items-center gap-6">
                                            <input
                                                type="range"
                                                min="0"
                                                max="100"
                                                step="5"
                                                value={minPassingScore}
                                                onChange={(e) => setMinPassingScore(parseInt(e.target.value))}
                                                className="flex-1 accent-brand-primary"
                                            />
                                            <span className="w-16 text-center font-black text-brand-primary bg-brand-primary/5 py-2 rounded-xl">%{minPassingScore}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-8 pt-8 border-t border-gray-100">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xl font-black text-gray-900 tracking-tight">Sorular 🧩</h3>
                                    <button
                                        type="button"
                                        onClick={handleAddQuestion}
                                        className="bg-gray-900 text-white px-6 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-black transition-all shadow-lg active:scale-95"
                                    >
                                        Soru Ekle
                                    </button>
                                </div>

                                <div className="space-y-12">
                                    {questions.map((q, qIndex) => (
                                        <div key={qIndex} className="p-8 bg-gray-50/50 rounded-[32px] border border-gray-100 relative group/q animate-in slide-in-from-right-4 duration-500">
                                            <button 
                                                type="button" 
                                                onClick={() => handleRemoveQuestion(qIndex)}
                                                className="absolute -left-3 -top-3 w-8 h-8 bg-white text-red-300 rounded-full shadow-md flex items-center justify-center hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover/q:opacity-100"
                                            >
                                                <i className="fas fa-trash text-[10px]"></i>
                                            </button>

                                            <div className="mb-8">
                                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 pr-1">Soru {qIndex + 1}</label>
                                                <input
                                                    type="text"
                                                    value={q.question_text}
                                                    onChange={(e) => handleQuestionChange(qIndex, 'question_text', e.target.value)}
                                                    className="w-full px-6 py-4 bg-white border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary transition-all font-bold text-gray-900"
                                                    placeholder="Soru metnini buraya yazın..."
                                                    required
                                                />
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {q.options.map((opt, oIndex) => (
                                                    <div key={oIndex} className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${q.correct_option_index === oIndex ? 'bg-brand-primary/5 border-brand-primary' : 'bg-white border-gray-100'}`}>
                                                        <input
                                                            type="radio"
                                                            name={`correct_${qIndex}`}
                                                            checked={q.correct_option_index === oIndex}
                                                            onChange={() => handleQuestionChange(qIndex, 'correct_option_index', oIndex)}
                                                            className="w-5 h-5 accent-brand-primary"
                                                        />
                                                        <input
                                                            type="text"
                                                            value={opt}
                                                            onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)}
                                                            className="bg-transparent border-none focus:ring-0 p-0 text-sm font-bold text-gray-700 w-full"
                                                            placeholder={`Seçenek ${String.fromCharCode(65 + oIndex)}`}
                                                            required
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-12 bg-white pb-6 z-10">
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="w-full bg-brand-primary text-white py-5 rounded-[24px] font-black text-[12px] uppercase tracking-[3px] hover:bg-brand-primary-dark transition-all shadow-2xl shadow-brand-primary/30 disabled:opacity-50 active:scale-[0.98]"
                                >
                                    {isSaving ? (
                                        <span className="flex items-center justify-center gap-3">
                                            <i className="fas fa-circle-notch animate-spin"></i>
                                            Sinav Kaydediliyor...
                                        </span>
                                    ) : 'Sınavı Yayınla ve Kaydet'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* RESULTS MODAL */}
            {showResultsModal && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md z-[99999] flex items-center justify-center p-6 sm:p-12 overflow-y-auto" dir="rtl">
                    <div className="bg-white rounded-[40px] w-full max-w-3xl max-h-[90vh] shadow-[0_32px_80px_rgba(0,0,0,0.3)] relative animate-in zoom-in-95 fade-in duration-500 overflow-hidden flex flex-col">
                        <div className="p-8 border-b border-gray-50 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-xl z-20">
                            <div className="text-right">
                                <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-2">Sınav Sonuçları 📊</h2>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{selectedQuiz?.title}</p>
                            </div>
                            <button onClick={() => setShowResultsModal(false)} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all">
                                <i className="fas fa-times"></i>
                            </button>
                        </div>

                        <div className="p-8 overflow-y-auto flex-1 custom-scrollbar">
                            {resultsLoading ? (
                                <div className="py-24 text-center">
                                    <div className="w-12 h-12 border-4 border-brand-primary/10 border-t-brand-primary rounded-full animate-spin mx-auto mb-4"></div>
                                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Yükleniyor...</p>
                                </div>
                            ) : quizResults.length === 0 ? (
                                <div className="py-24 text-center">
                                    <div className="w-20 h-20 bg-gray-50 text-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <i className="fas fa-user-slash text-3xl"></i>
                                    </div>
                                    <h3 className="text-lg font-black text-gray-400 uppercase tracking-widest">Henüz kimse bu sınava girmedi</h3>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {quizResults.map((result) => (
                                        <div key={result.id} className="p-6 bg-gray-50/50 rounded-[24px] border border-gray-100 flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-4">
                                                <Avatar 
                                                    src={result.profiles?.avatar_url}
                                                    name={result.profiles?.full_name || 'Öğrenci'}
                                                    size={48}
                                                />
                                                <div className="text-right">
                                                    <h4 className="font-bold text-gray-900">{result.profiles?.full_name || 'İsimsiz'}</h4>
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                                        {new Date(result.created_at).toLocaleString('tr-TR')}
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center gap-6">
                                                <div className="text-center">
                                                    <span className={`text-lg font-black ${result.passed ? 'text-green-500' : 'text-red-500'}`}>%{result.score}</span>
                                                    <p className={`text-[8px] font-black uppercase tracking-widest ${result.passed ? 'text-green-400' : 'text-red-400'}`}>
                                                        {result.passed ? 'GEÇTİ' : 'KALDI'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
