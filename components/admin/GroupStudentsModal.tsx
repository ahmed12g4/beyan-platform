'use client'

import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import Avatar from '@/components/Avatar'
import { getGroupStudents, addGroupStudent, removeGroupStudent, getStudentsSearch } from '@/lib/actions/admin-groups'

interface GroupStudentsModalProps {
    isOpen: boolean
    onClose: () => void
    group: any
}

export default function GroupStudentsModal({ isOpen, onClose, group }: GroupStudentsModalProps) {
    const [students, setStudents] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [searchResults, setSearchResults] = useState<any[]>([])
    const [searching, setSearching] = useState(false)
    const [addingId, setAddingId] = useState<string | null>(null)

    const fetchStudents = async () => {
        if (!group?.id) return
        setLoading(true)
        const data = await getGroupStudents(group.id)
        setStudents(data)
        setLoading(false)
    }

    useEffect(() => {
        if (isOpen && group?.id) {
            fetchStudents()
        }
    }, [isOpen, group?.id])

    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (search.length >= 3) {
                setSearching(true)
                const results = await getStudentsSearch(search)
                setSearchResults(results)
                setSearching(false)
            } else {
                setSearchResults([])
            }
        }, 300)

        return () => clearTimeout(delayDebounceFn)
    }, [search])

    const handleAdd = async (studentId: string) => {
        setAddingId(studentId)
        const result = await addGroupStudent(group.id, studentId)
        if (result.success) {
            toast.success('Öğrenci eklendi')
            fetchStudents()
            setSearch('')
        } else {
            toast.error(result.error || 'Hata oluştu')
        }
        setAddingId(null)
    }

    const handleRemove = async (enrollmentId: string) => {
        const result = await removeGroupStudent(enrollmentId)
        if (result.success) {
            toast.success('Öğrenci çıkarıldı')
            fetchStudents()
        } else {
            toast.error(result.error || 'Hata oluştu')
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white">
                    <div>
                        <h2 className="text-xl font-black text-brand-primary uppercase tracking-tight">Grup Öğrencileri</h2>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{group?.title}</p>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-50 text-gray-400 transition-colors">
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                {/* Search Bar */}
                <div className="p-4 border-b border-gray-50 bg-gray-50/30">
                    <div className="relative group">
                        <i className={`fas ${searching ? 'fa-spinner fa-spin' : 'fa-search'} absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-primary transition-colors`}></i>
                        <input
                            type="text"
                            placeholder="Öğrenci ara (Min. 3 karakter)..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm font-medium outline-none focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/5 transition-all shadow-sm"
                        />

                        {/* Search Results Dropdown */}
                        {search.length >= 3 && (searchResults.length > 0 || !searching) && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-20 animate-slideUp max-h-[300px] overflow-y-auto custom-scrollbar">
                                {searchResults.length === 0 ? (
                                    <div className="px-4 py-4 text-center text-gray-400 text-xs font-bold">Öğrenci bulunamadı</div>
                                ) : (
                                    searchResults.map(s => {
                                        const isAlreadyEnrolled = students.some(existing => existing.student_id === s.id);
                                        return (
                                            <button
                                                key={s.id}
                                                onClick={() => !isAlreadyEnrolled && handleAdd(s.id)}
                                                disabled={addingId === s.id || isAlreadyEnrolled}
                                                className={`w-full px-4 py-3 hover:bg-gray-50 flex items-center gap-3 transition-colors text-left ${isAlreadyEnrolled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            >
                                                <Avatar src={s.avatar_url} name={s.full_name} size={32} />
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-xs font-bold text-gray-900 truncate">{s.full_name}</div>
                                                    <div className="text-[10px] text-gray-400 truncate">{s.email}</div>
                                                </div>
                                                {isAlreadyEnrolled ? (
                                                    <span className="text-[9px] font-black text-brand-primary bg-brand-primary/10 px-2 py-0.5 rounded-full uppercase">EKli</span>
                                                ) : addingId === s.id ? (
                                                    <i className="fas fa-spinner fa-spin text-brand-primary"></i>
                                                ) : (
                                                    <i className="fas fa-plus text-brand-primary text-[10px]"></i>
                                                )}
                                            </button>
                                        );
                                    })
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Students List */}
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {loading ? (
                        <div className="p-12 text-center text-gray-300">
                            <i className="fas fa-spinner fa-spin text-xl"></i>
                        </div>
                    ) : students.length === 0 ? (
                        <div className="p-12 text-center">
                            <i className="fas fa-user-slash text-2xl text-gray-200 mb-2"></i>
                            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Grupta öğrenci yok</p>
                        </div>
                    ) : (
                        students.map((s: any) => (
                            <div key={s.id} className="flex items-center gap-3 p-3 bg-white hover:bg-gray-50 rounded-2xl border border-transparent hover:border-gray-100 transition-all group">
                                <Avatar src={s.student?.avatar_url} name={s.student?.full_name} size={40} />
                                <div className="flex-1 min-w-0">
                                    <div className="text-[13px] font-bold text-gray-900 truncate">{s.student?.full_name}</div>
                                    <div className="text-[10px] text-gray-400 font-bold tracking-tight">Kayıt: {new Date(s.enrolled_at).toLocaleDateString('tr-TR')}</div>
                                </div>
                                <button
                                    onClick={() => handleRemove(s.id)}
                                    className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100 shadow-sm border border-transparent hover:border-red-100"
                                    title="Öğrenciyi Çıkar"
                                >
                                    <i className="fas fa-user-minus text-[10px]"></i>
                                </button>
                            </div>
                        ))
                    )}
                </div>

                <div className="p-6 border-t border-gray-50 flex justify-center bg-gray-50/30">
                    <button onClick={onClose} className="text-xs font-black uppercase tracking-widest text-gray-400 hover:text-brand-primary transition-colors">Kapat</button>
                </div>
            </div>
        </div>
    )
}
