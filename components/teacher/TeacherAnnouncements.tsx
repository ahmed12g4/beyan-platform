'use client'

import { useState } from 'react'
import { sendCourseAnnouncementAction } from '@/lib/actions/announcements'
import { toast } from 'react-hot-toast'

export default function TeacherAnnouncements({ courseId }: { courseId: string }) {
    const [title, setTitle] = useState('')
    const [message, setMessage] = useState('')
    const [isSending, setIsSending] = useState(false)

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!title.trim() || !message.trim()) {
            toast.error('Lütfen başlık ve mesaj alanlarını doldurun.')
            return
        }

        setIsSending(true)
        try {
            const res = await sendCourseAnnouncementAction({
                courseId,
                title,
                message
            })

            if (res.success) {
                toast.success(`${res.count} öğrenciye duyuru gönderildi.`)
                setTitle('')
                setMessage('')
            } else {
                toast.error(res.error || 'Duyuru gönderilemedi.')
            }
        } catch (error) {
            toast.error('Bir hata oluştu.')
        } finally {
            setIsSending(false)
        }
    }

    return (
        <div className="bg-white rounded-[40px] p-10 border border-gray-100 shadow-xl shadow-gray-200/40 relative overflow-hidden group">
            {/* Visual background element */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-brand-primary/5 rounded-full blur-[40px] group-hover:bg-brand-primary/10 transition-all duration-700"></div>
            
            <div className="relative z-10">
                <div className="flex items-center gap-4 mb-10">
                    <div className="w-12 h-12 bg-brand-primary/10 rounded-2xl flex items-center justify-center text-brand-primary border border-brand-primary/20">
                        <i className="fas fa-bullhorn text-xl"></i>
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-gray-900 tracking-tight">Kurs Duyurusu Yayınla</h3>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tüm kayıtlı öğrencilere anında bildirim gönderilir.</p>
                    </div>
                </div>

                <form onSubmit={handleSend} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block pr-1">Duyuru Başlığı</label>
                        <input 
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full h-14 px-6 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary transition-all font-bold text-gray-900"
                            placeholder="Örn: Yeni ders materyali eklendi!"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block pr-1">Mesaj İçeriği</label>
                        <textarea 
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            rows={4}
                            className="w-full p-6 bg-gray-50 border border-gray-100 rounded-3xl focus:outline-none focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary transition-all font-medium text-gray-700 leading-relaxed"
                            placeholder="Öğrencilerinize iletmek istediğiniz detayları buraya yazın..."
                            required
                        />
                    </div>

                    <button 
                        type="submit"
                        disabled={isSending}
                        className="w-full h-16 bg-brand-primary text-white rounded-2xl font-black text-[12px] uppercase tracking-[2px] hover:bg-brand-primary-dark transition-all shadow-xl shadow-brand-primary/20 disabled:opacity-50 active:scale-95 flex items-center justify-center gap-3"
                    >
                        {isSending ? (
                            <>
                                <i className="fas fa-circle-notch animate-spin"></i>
                                Gönderiliyor...
                            </>
                        ) : (
                            <>
                                Duyuruyu Şimdi Gönder
                                <i className="fas fa-paper-plane text-[10px]"></i>
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    )
}
