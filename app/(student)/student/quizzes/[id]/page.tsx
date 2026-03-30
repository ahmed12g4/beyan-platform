'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { getQuizAction, submitQuizAction } from '@/lib/actions/quizzes'
import { toast } from 'react-hot-toast'
import Link from 'next/link'

export default function StudentQuizPage() {
    const params = useParams()
    const quizId = params.id as string
    const { user, loading: authLoading } = useCurrentUser()
    const router = useRouter()

    const [quiz, setQuiz] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [currentQuestion, setCurrentQuestion] = useState(0)
    const [answers, setAnswers] = useState<(number | null)[]>([])
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [result, setResult] = useState<any>(null)

    useEffect(() => {
        async function fetchQuiz() {
            setLoading(true)
            const res = await getQuizAction(quizId)
            if (res.success) {
                setQuiz(res.data)
                setAnswers(new Array(res.data.questions.length).fill(null))
            } else {
                toast.error("Sınav yüklenemedi.")
            }
            setLoading(false)
        }

        if (quizId) fetchQuiz()
    }, [quizId])

    const handleOptionSelect = (optionIndex: number) => {
        if (result) return // Disable if finished
        const newAnswers = [...answers]
        newAnswers[currentQuestion] = optionIndex
        setAnswers(newAnswers)
    }

    const handleSubmit = async () => {
        if (answers.includes(null)) {
            return toast.error("Lütfen tüm soruları cevaplayın.")
        }

        setIsSubmitting(true)
        const res = await submitQuizAction(quizId, user!.id, answers)
        if (res.success) {
            setResult(res)
            toast.success("Sınav tamamlandı!")
        } else {
            toast.error(res.error || "Sınav gönderilemedi.")
        }
        setIsSubmitting(false)
    }

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-[#0a0c10] flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-brand-primary/10 border-t-brand-primary rounded-full animate-spin"></div>
            </div>
        )
    }

    if (!quiz) {
        return (
            <div className="min-h-screen bg-[#0a0c10] flex flex-col items-center justify-center text-white" dir="rtl">
                <h2 className="text-2xl font-black mb-4">Sınav Bulunamadı</h2>
                <Link href="/student/my-lessons" className="text-brand-primary font-bold">Geri Dön</Link>
            </div>
        )
    }

    if (result) {
        return (
            <div className="min-h-screen bg-[#0a0c10] flex items-center justify-center p-6" dir="rtl">
                <div className="max-w-xl w-full bg-[#0f1115] border border-white/[0.05] rounded-[48px] p-12 text-center animate-in zoom-in-95 duration-500 shadow-2xl">
                    <div className={`w-24 h-24 mx-auto mb-8 rounded-full flex items-center justify-center text-4xl ${result.passed ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                        <i className={`fas ${result.passed ? 'fa-trophy' : 'fa-times-circle'}`}></i>
                    </div>
                    
                    <h2 className="text-3xl font-black text-white mb-2">
                        {result.passed ? 'Tebrikler! Geçtiniz 🎊' : 'Tekrar Deneyin 😕'}
                    </h2>
                    <p className="text-gray-500 text-[10px] font-black uppercase tracking-[3px] mb-8">
                        SINAV SONUCU
                    </p>

                    <div className="grid grid-cols-2 gap-4 mb-12">
                        <div className="bg-white/5 p-6 rounded-3xl border border-white/[0.03]">
                            <p className="text-[10px] font-black text-gray-500 uppercase mb-2">PUANINIZ</p>
                            <p className={`text-4xl font-black ${result.passed ? 'text-green-500' : 'text-red-500'}`}>%{result.score}</p>
                        </div>
                        <div className="bg-white/5 p-6 rounded-3xl border border-white/[0.03]">
                            <p className="text-[10px] font-black text-gray-500 uppercase mb-2">GEÇME NOTU</p>
                            <p className="text-4xl font-black text-white">%{quiz.min_passing_score}</p>
                        </div>
                    </div>

                    <div className="flex flex-col gap-4">
                        <Link 
                            href={`/student/my-lessons/${quiz.course_id}`}
                            className="bg-brand-primary text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-[2px] shadow-lg shadow-brand-primary/20 hover:scale-[1.02] transition-all active:scale-95"
                        >
                            Derslere Devam Et
                        </Link>
                        {!result.passed && (
                            <button 
                                onClick={() => {
                                    setResult(null);
                                    setCurrentQuestion(0);
                                    setAnswers(new Array(quiz.questions.length).fill(null));
                                }}
                                className="bg-white/5 text-gray-400 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[2px] border border-white/10 hover:bg-white/10 transition-all"
                            >
                                Tekrar Dene
                            </button>
                        )}
                    </div>
                </div>
            </div>
        )
    }

    const question = quiz.questions[currentQuestion]
    const progress = ((currentQuestion + 1) / quiz.questions.length) * 100

    return (
        <div className="min-h-screen bg-[#0a0c10] flex flex-col items-center p-6 lg:p-12 selection:bg-brand-primary/30" dir="rtl">
            <div className="max-w-4xl w-full flex flex-col h-full animate-in fade-in duration-1000">
                
                {/* Header */}
                <div className="flex justify-between items-center mb-12">
                    <div>
                        <h1 className="text-2xl font-black text-white tracking-tight leading-none mb-3">{quiz.title}</h1>
                        <p className="text-gray-500 text-[9px] font-black uppercase tracking-[2px] flex items-center gap-2">
                            <span className="w-2 h-2 bg-brand-accent rounded-full"></span>
                            Soru {currentQuestion + 1} / {quiz.questions.length}
                        </p>
                    </div>
                    <Link href={`/student/my-lessons/${quiz.course_id}`} className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-gray-500 hover:text-white transition-all border border-white/[0.05]">
                         <i className="fas fa-times"></i>
                    </Link>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-1 bg-white/[0.05] rounded-full overflow-hidden mb-16 px-0.5 pt-0.5">
                    <div className="bg-brand-primary h-full rounded-full transition-all duration-500 shadow-[0_0_20px_rgba(32,69,68,1)]" style={{ width: `${progress}%` }}></div>
                </div>

                {/* Question Area */}
                <div className="flex-1">
                    <div className="bg-[#0f1115] border border-white/[0.05] rounded-[48px] p-8 lg:p-16 shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/5 rounded-full blur-[100px] pointer-events-none group-hover:scale-150 transition-transform duration-1000"></div>
                        
                        <div className="relative z-10">
                            <h2 className="text-2xl lg:text-3xl font-black text-white mb-16 leading-tight max-w-2xl">
                                {question.question_text}
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {question.options.map((opt: string, idx: number) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleOptionSelect(idx)}
                                        className={`p-6 lg:p-8 rounded-[32px] text-right font-bold transition-all border flex items-center gap-6 group/opt relative overflow-hidden ${
                                            answers[currentQuestion] === idx 
                                                ? 'bg-brand-primary text-white border-brand-primary shadow-xl shadow-brand-primary/10' 
                                                : 'bg-white/[0.02] text-gray-400 border-white/[0.05] hover:border-white/20'
                                        }`}
                                    >
                                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black transition-all ${
                                            answers[currentQuestion] === idx 
                                                ? 'bg-white text-brand-primary' 
                                                : 'bg-white/10 group-hover/opt:bg-white/20'
                                        }`}>
                                            {String.fromCharCode(64 + idx + 1)}
                                        </div>
                                        <span className="flex-1 text-lg">{opt}</span>
                                        {answers[currentQuestion] === idx && (
                                            <i className="fas fa-check-circle text-white/50 text-xl animate-in zoom-in duration-300"></i>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Controls */}
                <div className="mt-12 flex justify-between items-center bg-[#0f1115]/80 backdrop-blur-xl p-6 rounded-[32px] border border-white/[0.05]">
                    <button
                        onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
                        disabled={currentQuestion === 0}
                        className="px-8 py-4 text-[10px] font-black uppercase tracking-[2px] text-gray-500 hover:text-white transition-all disabled:opacity-0"
                    >
                        <i className="fas fa-chevron-right ml-3"></i>
                        Önceki Soru
                    </button>

                    {currentQuestion === quiz.questions.length - 1 ? (
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting || answers.includes(null)}
                            className="bg-brand-primary text-white pl-12 pr-10 py-5 rounded-2xl font-black text-[12px] uppercase tracking-[3px] shadow-2xl shadow-brand-primary/30 hover:bg-brand-primary-dark transition-all disabled:opacity-50 active:scale-95 flex items-center gap-4"
                        >
                            {isSubmitting ? 'GÖNDERİLİYOR...' : 'SINAVI BİTİR'}
                            <i className="fas fa-paper-plane text-xs opacity-50"></i>
                        </button>
                    ) : (
                        <button
                            onClick={() => setCurrentQuestion(prev => Math.min(quiz.questions.length - 1, prev + 1))}
                            disabled={answers[currentQuestion] === null}
                            className="bg-white text-black pl-10 pr-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[2px] hover:bg-brand-primary hover:text-white transition-all shadow-xl active:scale-95 disabled:opacity-30 group"
                        >
                            Sonraki Soru
                            <i className="fas fa-chevron-left mr-3 group-hover:-translate-x-1 transition-transform"></i>
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}
