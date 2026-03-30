'use client'

import { useState, useEffect } from 'react'
import { getSubmissionsAction, gradeAssignmentAction } from '@/lib/actions/assignments'
import { toast } from 'react-hot-toast'
import Avatar from '@/components/Avatar'

interface SubmissionsModalProps {
    isOpen: boolean
    onClose: () => void
    assignment: any
}

export default function SubmissionsModal({ isOpen, onClose, assignment }: SubmissionsModalProps) {
    const [submissions, setSubmissions] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedSubmission, setSelectedSubmission] = useState<any | null>(null)
    const [grade, setGrade] = useState('')
    const [feedback, setFeedback] = useState('')
    const [isGrading, setIsGrading] = useState(false)

    useEffect(() => {
        if (isOpen && assignment) {
            fetchSubmissions()
        }
    }, [isOpen, assignment])

    const fetchSubmissions = async () => {
        setLoading(true)
        try {
            const data = await getSubmissionsAction(assignment.id)
            setSubmissions(data || [])
        } catch (error) {
            console.error("Fetch submissions error:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleGrade = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedSubmission) return
        
        setIsGrading(true)
        const res = await gradeAssignmentAction(selectedSubmission.id, { grade, feedback })
        
        if (res.success) {
            toast.success('Puanlama kaydedildi.')
            setSelectedSubmission(null)
            fetchSubmissions()
        } else {
            toast.error('Hata oluştu.')
        }
        setIsGrading(false)
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl animate-scaleIn flex flex-col max-h-[90vh] text-left">
                <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div>
                        <h2 className="text-2xl font-black text-gray-900 tracking-tight">Ödev Teslimatları</h2>
                        <p className="text-sm text-gray-500 mt-1">{assignment.title}</p>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 rounded-full hover:bg-white flex items-center justify-center transition-all shadow-sm border border-gray-100">
                        <i className="fas fa-times text-gray-400"></i>
                    </button>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                    {/* Submissions List */}
                    <div className="w-full md:w-1/2 border-r border-gray-100 overflow-y-auto p-6 space-y-4">
                        {loading ? (
                            <div className="flex justify-center py-20">
                                <div className="w-8 h-8 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin"></div>
                            </div>
                        ) : submissions.length > 0 ? (
                            submissions.map((sub) => (
                                <button 
                                    key={sub.id}
                                    onClick={() => {
                                        setSelectedSubmission(sub)
                                        setGrade(sub.grade || '')
                                        setFeedback(sub.teacher_feedback || '')
                                    }}
                                    className={`w-full text-left p-5 rounded-2xl border transition-all ${selectedSubmission?.id === sub.id ? 'border-brand-primary bg-brand-primary/5 shadow-md ring-2 ring-brand-primary/10' : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm'}`}
                                >
                                    <div className="flex items-center gap-4">
                                        <Avatar src={sub.profiles?.avatar_url} name={sub.profiles?.full_name} size={48} />
                                        <div className="flex-1 min-w-0">
                                            <div className="font-bold text-gray-900 truncate">{sub.profiles?.full_name}</div>
                                            <div className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-0.5">
                                                {new Date(sub.created_at).toLocaleDateString('tr-TR')}
                                            </div>
                                        </div>
                                        {sub.status === 'GRADED' ? (
                                            <div className="px-3 py-1 bg-green-50 text-green-600 rounded-lg text-[10px] font-black border border-green-100">PUANLANDI</div>
                                        ) : (
                                            <div className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black border border-blue-100">YENİ</div>
                                        )}
                                    </div>
                                </button>
                            ))
                        ) : (
                            <div className="text-center py-20 text-gray-400">
                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <i className="fas fa-inbox text-2xl opacity-20"></i>
                                </div>
                                <p className="font-bold">Henüz teslimat yok</p>
                            </div>
                        )}
                    </div>

                    {/* Grading Section */}
                    <div className="w-full md:w-1/2 bg-gray-50/30 p-8 overflow-y-auto border-t md:border-t-0 md:border-l border-gray-100">
                        {selectedSubmission ? (
                            <div className="animate-fadeIn">
                                <div className="mb-8">
                                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Teslim Detayları</h3>
                                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                                        <div>
                                            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Öğrenci Notu</div>
                                            <p className="text-sm text-gray-700 italic">{selectedSubmission.student_notes || 'Not bırakılmamış.'}</p>
                                        </div>
                                        {selectedSubmission.file_url && (
                                            <a href={selectedSubmission.file_url} target="_blank" className="flex items-center gap-3 p-4 bg-brand-primary/5 rounded-xl border border-brand-primary/10 text-brand-primary font-bold text-sm hover:bg-brand-primary/10 transition-all">
                                                <i className="fas fa-external-link-alt"></i> Ödev Dosyasını Görüntüle
                                            </a>
                                        )}
                                    </div>
                                </div>

                                <form onSubmit={handleGrade} className="space-y-6">
                                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Değerlendirme</h3>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold text-gray-500 ml-1">Puan / Not</label>
                                        <input 
                                            value={grade}
                                            onChange={(e) => setGrade(e.target.value)}
                                            placeholder="Örn: 95/100, A+, Başarılı"
                                            className="w-full h-14 px-5 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-brand-primary/20 outline-none font-bold"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold text-gray-500 ml-1">Geribildirim</label>
                                        <textarea 
                                            value={feedback}
                                            onChange={(e) => setFeedback(e.target.value)}
                                            rows={4}
                                            placeholder="Öğrenciye iletmek istediğiniz yorumlar..."
                                            className="w-full p-5 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-brand-primary/20 outline-none font-medium"
                                        />
                                    </div>
                                    <button 
                                        type="submit" 
                                        disabled={isGrading}
                                        className="w-full h-16 bg-brand-primary text-white rounded-2xl font-black hover:bg-brand-primary-dark transition-all shadow-xl shadow-brand-primary/20 disabled:opacity-50"
                                    >
                                        {isGrading ? 'Kaydediliyor...' : 'Puanla ve Bildir'}
                                    </button>
                                </form>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 py-10 md:py-0">
                                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100 mb-4">
                                    <i className="fas fa-mouse-pointer"></i>
                                </div>
                                <p className="text-sm font-bold">Lütfen değerlendirmek için bir öğrenci seçin.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
