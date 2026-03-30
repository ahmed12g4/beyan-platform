'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { adminEnrollStudentAction, adminDropEnrollmentAction } from '@/lib/actions/enrollments'
import { toast } from 'react-hot-toast'
import Avatar from '@/components/Avatar'
import ConfirmModal from '@/components/ConfirmModal'

interface Student {
    id: string
    full_name: string
    email: string
    avatar_url: string | null
}

interface Enrollment {
    id: string
    enrolled_at: string
    progress: number
    status: string
    student: Student
}

export default function AdminCourseStudents({ courseId }: { courseId: string }) {
    const [enrollments, setEnrollments] = useState<Enrollment[]>([])
    const [loading, setLoading] = useState(true)
    const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [searchResults, setSearchResults] = useState<Student[]>([])
    const [searching, setSearching] = useState(false)
    const [dropStudentId, setDropStudentId] = useState<string | null>(null)
    const [isDropping, setIsDropping] = useState(false)

    const fetchEnrollments = async () => {
        setLoading(true)
        const supabase = createClient()

        // Custom query to get enrollments with student details
        const { data, error } = await supabase
            .from('enrollments')
            .select(`
                id, enrolled_at, status,
                student:profiles!enrollments_student_id_fkey(id, full_name, email, avatar_url)
            `)
            .eq('course_id', courseId)
            .order('enrolled_at', { ascending: false })

        if (error) {
            console.error('Error fetching enrollments:', error)
            toast.error('Öğrenci listesi yüklenemedi')
        } else {
            const formatted = data.map((e: any) => ({
                id: e.id,
                enrolled_at: e.enrolled_at,
                status: e.status,
                student: e.student,
                progress: 0 // View join failed, temporarily 0 to fix crash
            }))
            setEnrollments(formatted)
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchEnrollments()
    }, [courseId])

    const handleSearch = async (term: string) => {
        setSearchTerm(term)
        if (term.length < 3) return

        setSearching(true)
        const supabase = createClient()
        const { data } = await supabase
            .from('profiles')
            .select('id, full_name, email, avatar_url')
            .eq('role', 'student')
            .ilike('email', `%${term}%`)
            .limit(5)

        setSearchResults(data || [])
        setSearching(false)
    }

    const handleEnroll = async (studentId: string) => {
        const result = await adminEnrollStudentAction(studentId, courseId)
        if (result.success) {
            toast.success('Öğrenci kursa eklendi')
            setIsEnrollModalOpen(false)
            fetchEnrollments()
            setSearchTerm('')
            setSearchResults([])
        } else {
            toast.error(result.error || 'Ekleme başarısız')
        }
    }

    const confirmDrop = async () => {
        if (!dropStudentId) return
        setIsDropping(true)

        const result = await adminDropEnrollmentAction(dropStudentId, courseId)
        if (result.success) {
            toast.success('Öğrenci kurstan çıkarıldı')
            fetchEnrollments()
        } else {
            toast.error(result.error || 'İşlem başarısız')
        }
        setIsDropping(false)
        setDropStudentId(null)
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold">Kayıtlı Öğrenciler ({enrollments.length})</h3>
                <button
                    onClick={() => setIsEnrollModalOpen(true)}
                    className="px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary-dark transition-colors flex items-center gap-2"
                >
                    <i className="fas fa-plus"></i> Öğrenci Ekle
                </button>
            </div>

            {loading ? (
                <div className="text-center py-8 text-gray-500">Yükleniyor...</div>
            ) : enrollments.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-md border border-dashed border-gray-200">
                    <p className="text-gray-500">Henüz bu kursa kayıtlı öğrenci yok.</p>
                </div>
            ) : (
                <div className="bg-white rounded-md border border-gray-100/80 shadow-sm overflow-x-auto hover:shadow-md transition-shadow">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase">Öğrenci</th>
                                <th className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase">Kayıt Tarihi</th>
                                <th className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase">İlerleme</th>
                                <th className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase">Durum</th>
                                <th className="text-right py-3 px-4 text-xs font-bold text-gray-500 uppercase">İşlemler</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {enrollments.map((enrollment) => (
                                <tr key={enrollment.id} className="hover:bg-gray-50/50">
                                    <td className="py-3 px-4">
                                        <div className="flex items-center gap-3">
                                            <Avatar name={enrollment.student.full_name} src={enrollment.student.avatar_url} size={32} />
                                            <div>
                                                <div className="font-medium text-gray-900">{enrollment.student.full_name}</div>
                                                <div className="text-xs text-gray-500">{enrollment.student.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4 text-sm text-gray-600">
                                        {new Date(enrollment.enrolled_at).toLocaleDateString('tr-TR')}
                                    </td>
                                    <td className="py-3 px-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-20 bg-gray-200 rounded-full h-2">
                                                <div
                                                    className="bg-green-500 h-2 rounded-full"
                                                    style={{ width: `${enrollment.progress}%` }}
                                                />
                                            </div>
                                            <span className="text-xs font-medium text-gray-600">%{enrollment.progress}</span>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${enrollment.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                                            }`}>
                                            {enrollment.status === 'ACTIVE' ? 'Aktif' : enrollment.status}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-right">
                                        <button
                                            onClick={() => setDropStudentId(enrollment.student.id)}
                                            className="text-red-400 hover:text-red-600 p-2 transition-colors"
                                            title="Kurstan Çıkar"
                                        >
                                            <i className="fas fa-trash-alt"></i>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Enroll Modal */}
            {isEnrollModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-md w-full max-w-md p-6 shadow-md animate-fadeIn">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-gray-900">Öğrenci Ekle</h3>
                            <button onClick={() => setIsEnrollModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <i className="fas fa-times"></i>
                            </button>
                        </div>

                        <div className="mb-4">
                            <div className="relative">
                                <i className="fas fa-search absolute left-3 top-3 text-gray-400"></i>
                                <input
                                    type="text"
                                    placeholder="Öğrenci email adresi ara..."
                                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-primary outline-none"
                                    value={searchTerm}
                                    onChange={(e) => handleSearch(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="max-h-60 overflow-y-auto space-y-2 border-t border-gray-100 pt-2">
                            {searching ? (
                                <div className="text-center py-4 text-gray-500 text-sm">Aranıyor...</div>
                            ) : searchResults.length > 0 ? (
                                searchResults.map(student => (
                                    <button
                                        key={student.id}
                                        onClick={() => handleEnroll(student.id)}
                                        className="w-full flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors text-left"
                                    >
                                        <Avatar name={student.full_name} src={student.avatar_url} size={32} />
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium text-sm text-gray-900">{student.full_name}</div>
                                            <div className="text-xs text-gray-500 truncate">{student.email}</div>
                                        </div>
                                        <div className="text-brand-primary text-xs font-bold">EKLE</div>
                                    </button>
                                ))
                            ) : searchTerm.length > 2 ? (
                                <div className="text-center py-4 text-gray-500 text-sm">Öğrenci bulunamadı.</div>
                            ) : (
                                <div className="text-center py-4 text-gray-400 text-xs">Aramak için yazmaya başlayın...</div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <ConfirmModal
                isOpen={!!dropStudentId}
                isLoading={isDropping}
                onClose={() => setDropStudentId(null)}
                onConfirm={confirmDrop}
                title="Öğrenciyi Kurstan Çıkar"
                message="Bu öğrenciyi kurstan çıkarmak istediğinizden emin misiniz? Öğrencinin kurs ilerlemesi silinebilir."
                confirmText="Evet, Çıkar"
            />
        </div>
    )
}
