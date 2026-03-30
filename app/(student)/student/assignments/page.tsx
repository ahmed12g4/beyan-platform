'use client'

import { useState, useEffect } from 'react'
import { getAssignmentsAction, submitAssignmentAction } from '@/lib/actions/assignments'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { toast } from 'react-hot-toast'
import Link from 'next/link'
import SubmitAssignmentModal from '@/components/assignments/SubmitAssignmentModal'

export default function StudentAssignmentsPage() {
    const { profile, loading: userLoading } = useCurrentUser()
    const [assignments, setAssignments] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedAssignment, setSelectedAssignment] = useState<any | null>(null)
    const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false)

    useEffect(() => {
        if (!userLoading && profile) {
            fetchAssignments()
        }
    }, [userLoading, profile])

    const fetchAssignments = async () => {
        setLoading(true)
        try {
            const data = await getAssignmentsAction({})
            setAssignments(data || [])
        } catch (error) {
            console.error("Fetch assignments error:", error)
        } finally {
            setLoading(false)
        }
    }

    if (loading || userLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="w-8 h-8 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin"></div>
            </div>
        )
    }

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex items-center gap-3 mb-8">
                <div className="w-2 h-8 bg-brand-accent rounded-full"></div>
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">Ödevlerim</h1>
            </div>
            
            <div className="grid gap-6">
                {assignments.length > 0 ? (
                    assignments.map((assignment) => (
                        <div key={assignment.id} className="bg-white p-8 rounded-3xl border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.06)] transition-all duration-300 group">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-6">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="inline-block px-3 py-1 bg-brand-primary/5 text-brand-primary text-[10px] font-black rounded-md uppercase tracking-widest">
                                            {assignment.course_id ? 'KURS ÖDEVİ' : 'GRUP ÖDEVİ'}
                                        </span>
                                        {assignment.due_date && new Date(assignment.due_date) < new Date() && (
                                            <span className="inline-block px-3 py-1 bg-red-50 text-red-600 text-[10px] font-black rounded-md uppercase tracking-widest">
                                                SÜRESİ DOLDU
                                            </span>
                                        )}
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-brand-primary transition-colors">{assignment.title}</h3>
                                    <p className="text-gray-500 text-sm mt-2 line-clamp-2">{assignment.description}</p>
                                </div>
                                <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100 min-w-[150px]">
                                    <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-brand-primary">
                                        <i className="far fa-calendar-alt"></i>
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Teslim Tarihi</div>
                                        <div className="text-sm font-bold text-gray-900">
                                            {assignment.due_date ? new Date(assignment.due_date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' }) : 'Belirtilmedi'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex items-center justify-between pt-6 border-t border-gray-50">
                                <div className="flex items-center gap-4">
                                    {assignment.file_url && (
                                        <a 
                                            href={assignment.file_url} 
                                            target="_blank" 
                                            className="h-12 px-5 bg-gray-100 text-gray-600 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-gray-200 transition-all"
                                        >
                                            <i className="fas fa-file-download"></i> Materyal
                                        </a>
                                    )}
                                </div>
                                
                                <button 
                                    onClick={() => {
                                        setSelectedAssignment(assignment)
                                        setIsSubmitModalOpen(true)
                                    }}
                                    className="h-12 px-8 bg-brand-primary text-white rounded-xl font-bold hover:bg-brand-primary-dark transition-all flex items-center gap-2 shadow-lg shadow-brand-primary/10"
                                >
                                    Ödevi Teslim Et <i className="fas fa-arrow-right text-xs"></i>
                                </button>
                            </div>
                        </div>
                    )
                )) : (
                    <div className="text-center py-32 bg-white rounded-3xl border-2 border-dashed border-gray-100 shadow-sm">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <i className="fas fa-tasks text-3xl text-gray-300"></i>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Henüz Ödev Yok</h3>
                        <p className="text-gray-400 max-w-xs mx-auto">Harika! Şu an için yapmanız gereken bir ödev bulunmamaktadır.</p>
                    </div>
                )}
            </div>

            {selectedAssignment && (
                <SubmitAssignmentModal 
                    isOpen={isSubmitModalOpen}
                    onClose={() => setIsSubmitModalOpen(false)}
                    assignment={selectedAssignment}
                    onSuccess={fetchAssignments}
                />
            )}
        </div>
    )
}
