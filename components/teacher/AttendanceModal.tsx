'use client'

import { useState, useEffect } from 'react'
import { getSessionAttendanceAction, markNoShowAction, getGroupStudentsAction } from '@/lib/actions/sessions'
import { toast } from 'react-hot-toast'

interface AttendanceModalProps {
    isOpen: boolean
    onClose: () => void
    session: any
}

export default function AttendanceModal({ isOpen, onClose, session }: AttendanceModalProps) {
    const [students, setStudents] = useState<any[]>([])
    const [attendance, setAttendance] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (isOpen && session) {
            fetchAttendance()
        }
    }, [isOpen, session])

    const fetchAttendance = async () => {
        setLoading(true)
        try {
            // 1. Fetch recorded attendance
            const recorded = await getSessionAttendanceAction(session.id)
            setAttendance(recorded || [])

            // 2. Fetch expected students
            if (session.type === 'PRIVATE') {
                setStudents([{
                    id: session.student_id,
                    full_name: session.profiles?.full_name || 'Öğrenci',
                    avatar_url: session.profiles?.avatar_url
                }])
            } else if (session.group_id) {
                const groupStudents = await getGroupStudentsAction(session.group_id)
                setStudents(groupStudents || [])
            } else if (session.course_id) {
                // If it's a group session but tied to a course directly
                // This shouldn't really happen with the new decoupling but good to have
                setStudents([])
            }
        } catch (error) {
            console.error("Attendance fetch error:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleMarkNoShow = async (studentId: string) => {
        const res = await markNoShowAction(session.id, studentId)
        if (res.success) {
            toast.success('Yoklama kaydedildi.')
            fetchAttendance()
        } else {
            toast.error('Hata oluştu.')
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-scaleIn">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Ders Yoklaması</h2>
                        <p className="text-xs text-gray-500 mt-1">{session.title}</p>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors">
                        <i className="fas fa-times text-gray-400"></i>
                    </button>
                </div>

                <div className="p-6 max-h-[60vh] overflow-y-auto">
                    {loading ? (
                        <div className="flex justify-center py-10">
                            <div className="w-6 h-6 border-2 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin"></div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {students.length > 0 ? students.map((student) => {
                                const record = attendance.find(a => a.student_id === student.id)
                                const status = record?.status || 'NOT_RECORDED'
                                
                                return (
                                    <div key={student.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary font-bold overflow-hidden">
                                                {student.avatar_url ? <img src={student.avatar_url} alt="" className="w-full h-full object-cover" /> : student.full_name?.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="font-bold text-sm text-gray-900">{student.full_name}</div>
                                                <div className={`text-[10px] font-bold uppercase tracking-wider ${status === 'PRESENT' ? 'text-green-600' : status === 'ABSENT' ? 'text-red-500' : 'text-gray-400'}`}>
                                                    {status === 'PRESENT' ? 'KATILDI' : status === 'ABSENT' ? 'GELMEDİ' : 'BİLGİ YOK'}
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {status !== 'PRESENT' && status !== 'ABSENT' && (
                                            <button 
                                                onClick={() => handleMarkNoShow(student.id)}
                                                className="px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-xl text-xs font-bold hover:bg-gray-50 transition-all shadow-sm"
                                            >
                                                Gelmeyen Olarak İşaretle
                                            </button>
                                        )}
                                        {status === 'PRESENT' && (
                                            <div className="text-green-500 bg-green-50 w-8 h-8 rounded-full flex items-center justify-center border border-green-100">
                                                <i className="fas fa-check-circle"></i>
                                            </div>
                                        )}
                                        {status === 'ABSENT' && (
                                            <div className="text-red-500 bg-red-50 w-8 h-8 rounded-full flex items-center justify-center border border-red-100">
                                                <i className="fas fa-times-circle"></i>
                                            </div>
                                        )}
                                    </div>
                                )
                            }) : (
                                <div className="text-center py-10 text-gray-400 text-sm">
                                    Bu derse kayıtlı öğrenci bulunamadı.
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="p-6 bg-gray-50 flex justify-end">
                    <button onClick={onClose} className="px-6 py-3 bg-brand-primary text-white rounded-xl font-bold hover:bg-brand-primary-dark transition-all shadow-lg shadow-brand-primary/10">
                        Kapat
                    </button>
                </div>
            </div>
        </div>
    )
}
