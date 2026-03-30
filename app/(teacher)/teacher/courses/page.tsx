'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { useCurrentUser } from '@/hooks/useCurrentUser'

export default function TeacherCoursesPage() {
    const { user, loading: authLoading } = useCurrentUser()
    const [courses, setCourses] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (authLoading || !user) return

        async function fetchCourses() {
            setLoading(true)
            const supabase = createClient()
            
            try {
                // Fetch courses where the teacher is the owner
                const { data, error } = await supabase
                    .from('courses')
                    .select(`
                        id,
                        title,
                        description,
                        thumbnail_url,
                        price,
                        is_published,
                        created_at,
                        enrollments (count)
                    `)
                    .eq('teacher_id', user!.id)
                    .order('created_at', { ascending: false })

                if (error) throw error
                
                // Format the enrollments count
               const formattedData = (data || []).map((course: any) => ({
    ...course,
    studentsCount: course.enrollments?.[0]?.count || 0
}))

                
                setCourses(formattedData)
            } catch (err) {
                console.error("Error fetching teacher courses:", err)
            } finally {
                setLoading(false)
            }
        }

        fetchCourses()
    }, [user, authLoading])

    if (authLoading || loading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center">
                <div className="w-12 h-12 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin mb-4"></div>
                <p className="text-gray-500 font-medium">Kurslarınız Yükleniyor...</p>
            </div>
        )
    }

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12" dir="rtl">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 border-r-4 border-brand-accent pr-4">Kurslarım</h1>
            </div>

            <div className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-xl shadow-gray-200/40 relative overflow-hidden">
                {/* Decorative background element */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-brand-accent/5 rounded-full blur-3xl transform translate-x-1/3 -translate-y-1/3 z-0"></div>

                <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {courses.length === 0 ? (
                        <div className="col-span-full py-16 text-center bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                                <i className="fas fa-book-open text-3xl text-gray-300"></i>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Henüz Bir Kursunuz Yok</h3>
                            <p className="text-gray-500 max-w-sm mx-auto">
                                Platformda size atanmış kayıtlı bir video kursu bulunmamaktadır.
                            </p>
                        </div>
                    ) : (
                        courses.map((course) => (
                            <div key={course.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col group hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                                <div className="aspect-video bg-gray-50 relative overflow-hidden">
                                    {course.thumbnail_url ? (
                                        <Image 
                                            src={course.thumbnail_url} 
                                            alt={course.title} 
                                            fill 
                                            className="object-cover group-hover:scale-105 transition-transform duration-500" 
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-200 bg-gray-100">
                                            <i className="fas fa-play-circle text-4xl"></i>
                                        </div>
                                    )}
                                    <div className="absolute top-3 right-3 flex gap-2">
                                        <span className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded-md backdrop-blur-md shadow-sm ${
                                            course.is_published 
                                                ? 'bg-green-500/90 text-white' 
                                                : 'bg-amber-500/90 text-white'
                                        }`}>
                                            {course.is_published ? 'Yayında' : 'Taslak'}
                                        </span>
                                    </div>
                                </div>
                                
                                <div className="p-6 flex-1 flex flex-col">
                                    <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-brand-primary transition-colors">
                                        {course.title}
                                    </h3>
                                    
                                    <div className="mt-auto pt-6 flex items-center justify-between border-t border-gray-50">
                                        <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
                                            <i className="fas fa-users text-gray-400"></i>
                                            <span>{course.studentsCount} Öğrenci</span>
                                        </div>
                                        <Link href={`/teacher/courses/${course.id}`}>
                                            <button className="px-5 py-2.5 bg-brand-primary/10 text-brand-primary font-bold rounded-xl hover:bg-brand-primary hover:text-white transition-colors text-sm flex items-center gap-2">
                                                İçeriği Yönet
                                                <i className="fas fa-chevron-left text-[10px]"></i>
                                            </button>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}
