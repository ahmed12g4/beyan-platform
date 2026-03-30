'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useCurrentUser } from '@/hooks/useCurrentUser'

interface Group {
    id: string
    title: string
    description: string
    schedule_desc: string
    zoom_link: string
    total_seats: number
    start_date: string
    end_date: string
    created_at: string
    price: number
    studentsCount: number
}

export default function TeacherGroupsPage() {
    const { user, profile, loading: authLoading } = useCurrentUser()
    const [groups, setGroups] = useState<Group[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (authLoading || !user) return

        async function fetchGroups() {
            setLoading(true)
            const supabase = createClient()
            
            try {
                // Fetch groups where this teacher is assigned
                const { data, error } = await supabase
                    .from('group_courses')
                    .select('*')
                    .eq('teacher_id', user!.id)
                    .order('created_at', { ascending: false })

                if (error) throw error
                
                // Get student counts for each group
                if (data && data.length > 0) {
                    const groupDataArray = data as any[];
                    const groupIds = groupDataArray.map(g => g.id)
                    const { data: enrollments, error: countError } = await supabase
                        .from('group_enrollments')
                        .select('group_course_id')
                        .in('group_course_id', groupIds)

                    if (!countError && enrollments) {
                        const countMap = enrollments.reduce((acc: any, curr: any) => {
                            acc[curr.group_course_id] = (acc[curr.group_course_id] || 0) + 1
                            return acc
                        }, {})

                        const formattedData = groupDataArray.map(group => ({
                            ...group,
                            studentsCount: countMap[group.id] || 0
                        }))
                        setGroups(formattedData)
                        return
                    }
                }
                
                setGroups((data as any) || [])
            } catch (err) {
                console.error("Error fetching teacher groups:", err)
            } finally {
                setLoading(false)
            }
        }

        fetchGroups()
    }, [user, authLoading])

    if (authLoading || loading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center">
                <div className="w-12 h-12 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin mb-4"></div>
                <p className="text-gray-500 font-medium">Gruplarınız Yükleniyor...</p>
            </div>
        )
    }

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12" dir="rtl">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 border-r-4 border-brand-accent pr-4">Gruplarım</h1>
            </div>

            <div className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-xl shadow-gray-200/40 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl transform translate-x-1/3 -translate-y-1/3 z-0"></div>

                <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {groups.length === 0 ? (
                        <div className="col-span-full py-16 text-center bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                                <i className="fas fa-users text-3xl text-gray-300"></i>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Henüz Bir Grubunuz Yok</h3>
                            <p className="text-gray-500 max-w-sm mx-auto">
                                Size atanmış aktif bir eğitim grubu bulunmamaktadır.
                            </p>
                        </div>
                    ) : (
                        groups.map((group) => {
                            const isCompleted = new Date(group.end_date) < new Date();
                            const isActive = new Date(group.start_date) <= new Date() && !isCompleted;

                            return (
                            <Link href={`/teacher/groups/${group.id}`} key={group.id}>
                                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col group hover:shadow-xl hover:border-brand-accent/50 hover:-translate-y-1 transition-all duration-300 h-full cursor-pointer">
                                    <div className="h-32 bg-gradient-to-br from-blue-50 to-indigo-50 relative overflow-hidden flex items-center justify-center">
                                        <i className="fas fa-users text-5xl text-blue-200/60 group-hover:scale-110 transition-transform duration-500"></i>
                                        <div className="absolute top-3 right-3 flex gap-2">
                                            <span className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded-md backdrop-blur-md shadow-sm ${
                                                isActive 
                                                    ? 'bg-green-500/90 text-white' 
                                                    : isCompleted
                                                    ? 'bg-gray-500/90 text-white'
                                                    : 'bg-amber-500/90 text-white'
                                            }`}>
                                                {isActive ? 'Aktif' : isCompleted ? 'Tamamlandı' : 'Yakında'}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div className="p-6 flex-1 flex flex-col">
                                        <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-1 group-hover:text-brand-primary transition-colors">
                                            {group.title}
                                        </h3>
                                        
                                        <div className="text-sm text-gray-500 space-y-2 mb-6">
                                            <div className="flex items-start gap-2">
                                                <i className="far fa-clock mt-1 text-xs text-gray-400"></i>
                                                <span className="line-clamp-2 leading-relaxed">{group.schedule_desc}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <i className="far fa-calendar-alt text-xs text-gray-400"></i>
                                                <span>{new Date(group.start_date).toLocaleDateString('tr-TR')} - {new Date(group.end_date).toLocaleDateString('tr-TR')}</span>
                                            </div>
                                        </div>
                                        
                                        <div className="mt-auto pt-6 flex items-center justify-between border-t border-gray-50">
                                            <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
                                                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
                                                    <i className="fas fa-user-graduate text-xs"></i>
                                                </div>
                                                <span>{group.studentsCount} / {group.total_seats} <span className="text-xs">Öğrenci</span></span>
                                            </div>
                                            <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-brand-primary group-hover:text-white transition-colors">
                                                <i className="fas fa-chevron-left text-[10px]"></i>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        )})
                    )}
                </div>
            </div>
        </div>
    )
}
