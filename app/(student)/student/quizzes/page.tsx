'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { LoadingPage } from '@/components/ui/StateComponents'

export default function StudentQuizzesPage() {
    const { profile, loading: userLoading } = useCurrentUser()
    const [quizzes, setQuizzes] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (userLoading || !profile?.id) return

        const fetchQuizzes = async () => {
            const supabase = createClient()
            
            try {
                // 1. Get Enrolled Courses
                const { data: enrollments } = await supabase
                    .from('enrollments')
                    .select('course_id')
                    .eq('student_id', profile.id)
                    .eq('status', 'ACTIVE')

                const courseIds = (enrollments || []).map((e: any) => e.course_id)

                if (courseIds.length === 0) {
                    setQuizzes([])
                    setLoading(false)
                    return
                }

                // 2. Fetch Quizzes for these courses
                const { data: quizzesData } = await (supabase
                    .from('quizzes') as any)
                    .select(`
                        *,
                        course:courses(title),
                        lesson:lessons(title),
                        results:quiz_results(*)
                    `)
                    .in('course_id', courseIds)
                    .order('created_at', { ascending: false })

                // Filter results to only include this student's results
                const processedQuizzes = (quizzesData || []).map((q: any) => {
                    const studentResult = q.results?.find((r: any) => r.student_id === profile.id)
                    return {
                        ...q,
                        studentResult
                    }
                })

                setQuizzes(processedQuizzes)
            } catch (err) {
                console.error("Error fetching quizzes:", err)
            } finally {
                setLoading(false)
            }
        }

        fetchQuizzes()
    }, [profile?.id, userLoading])

    if (userLoading || loading) return <LoadingPage message="Sınavlar yükleniyor..." />

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12" dir="rtl">
            <div className="flex items-center justify-between mb-12">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 mb-2">Sınavlarım</h1>
                    <p className="text-gray-500 font-medium">Kayıtlı olduğunuz kurslardaki tüm sınavlar ve sonuçları.</p>
                </div>
                <div className="bg-brand-primary/5 px-4 py-2 rounded-xl border border-brand-primary/10">
                    <span className="text-brand-primary font-black text-sm">{quizzes.length} Toplam Sınav</span>
                </div>
            </div>

            {quizzes.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {quizzes.map((quiz) => (
                        <div key={quiz.id} className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-500 group">
                            <div className="flex justify-between items-start mb-6">
                                <div className="space-y-1">
                                    <span className="px-3 py-1 bg-gray-50 text-gray-400 text-[10px] font-black rounded-lg uppercase tracking-widest border border-gray-100">
                                        {quiz.course?.title || 'Genel Kurs'}
                                    </span>
                                    <h3 className="text-xl font-black text-gray-900 group-hover:text-brand-primary transition-colors">{quiz.title}</h3>
                                </div>
                                {quiz.studentResult ? (
                                    <div className={`px-4 py-2 rounded-2xl flex flex-col items-center ${quiz.studentResult.passed ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                                        <span className="text-[10px] font-black uppercase tracking-tighter">NOTUNUZ</span>
                                        <span className="text-xl font-black">{quiz.studentResult.score}%</span>
                                    </div>
                                ) : (
                                    <div className="px-4 py-2 bg-yellow-50 text-yellow-600 border border-yellow-100 rounded-2xl flex flex-col items-center">
                                        <span className="text-[10px] font-black uppercase tracking-tighter">DURUM</span>
                                        <span className="text-xs font-black">BEKLİYOR</span>
                                    </div>
                                )}
                            </div>

                            <div className="bg-gray-50 rounded-2xl p-4 mb-8 border border-gray-100/50">
                                <div className="flex items-center gap-3 text-sm font-medium text-gray-600 mb-2">
                                    <i className="fas fa-book-open text-brand-primary opacity-50"></i>
                                    <span>Bağlı Ders: {quiz.lesson?.title || 'Bamsız Sınav'}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm font-medium text-gray-600">
                                    <i className="fas fa-bullseye text-brand-primary opacity-50"></i>
                                    <span>Geçme Notu: %{quiz.min_passing_score}</span>
                                </div>
                            </div>

                            <Link href={`/student/quizzes/${quiz.id}`}>
                                <button className={`w-full py-4 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2 group/btn ${
                                    quiz.studentResult?.passed 
                                    ? 'bg-gray-100 text-gray-500 cursor-default' 
                                    : 'bg-brand-primary text-white hover:bg-brand-primary-dark shadow-lg shadow-brand-primary/10'
                                }`}>
                                    {quiz.studentResult?.passed ? 'TAMAMLANDI' : quiz.studentResult ? 'TEKRAR DENE' : 'SINAVA BAŞLA'}
                                    {!quiz.studentResult?.passed && <i className="fas fa-arrow-left group-hover/btn:-translate-x-1 transition-transform"></i>}
                                </button>
                            </Link>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-32 bg-gray-50/50 rounded-[40px] border border-dashed border-gray-200">
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                        <i className="fas fa-tasks text-3xl text-gray-200"></i>
                    </div>
                    <h3 className="text-xl font-black text-gray-900 mb-2">Henüz sınav bulunmuyor</h3>
                    <p className="text-gray-500 max-w-xs mx-auto text-sm">Kayıtlı olduğunuz kurslarda henüz bir sınav tanımlanmamış. Eğitmeniniz eklediğinde burada göreceksiniz.</p>
                </div>
            )}
        </div>
    )
}
