'use client'

import { useState } from 'react'
import { submitAssignmentAction } from '@/lib/actions/assignments'
import { toast } from 'react-hot-toast'

interface SubmitAssignmentModalProps {
    isOpen: boolean
    onClose: () => void
    assignment: any
    onSuccess: () => void
}

export default function SubmitAssignmentModal({ isOpen, onClose, assignment, onSuccess }: SubmitAssignmentModalProps) {
    const [notes, setNotes] = useState('')
    const [fileUrl, setFileUrl] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    if (!isOpen) return null

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        
        const res = await submitAssignmentAction({
            assignment_id: assignment.id,
            file_url: fileUrl,
            student_notes: notes
        })

        if (res.success) {
            toast.success('Ödev başarıyla teslim edildi.')
            onSuccess()
            onClose()
        } else {
            toast.error('Teslimat sırasında hata oluştu.')
        }
        setIsSubmitting(false)
    }

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-scaleIn p-8">
                <h2 className="text-2xl font-black text-gray-900 mb-2 tracking-tight">Ödev Teslim Et</h2>
                <p className="text-sm text-gray-500 mb-8">{assignment.title}</p>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest block">Teslim Dosyası (URL)</label>
                        <input 
                            placeholder="Dosya linki (Drive, Dropbox vb.)" 
                            className="w-full h-14 px-5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-brand-primary/20 outline-none font-bold"
                            value={fileUrl}
                            onChange={(e) => setFileUrl(e.target.value)}
                            required
                        />
                    </div>
                    
                    <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest block">Öğrenci Notları (Opsiyonel)</label>
                        <textarea 
                            placeholder="Öğretmeninize iletmek istediğiniz notlar..."
                            rows={3}
                            className="w-full p-5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-brand-primary/20 outline-none font-medium"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button type="button" onClick={onClose} className="flex-1 h-16 bg-gray-100 text-gray-600 rounded-2xl font-black hover:bg-gray-200 transition-all">İptal</button>
                        <button 
                            type="submit" 
                            disabled={isSubmitting}
                            className="flex-[2] h-16 bg-brand-primary text-white rounded-2xl font-black hover:bg-brand-primary-dark transition-all shadow-xl shadow-brand-primary/20 disabled:opacity-50"
                        >
                            {isSubmitting ? 'Gönderiliyor...' : 'Şimdi Teslim Et'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
