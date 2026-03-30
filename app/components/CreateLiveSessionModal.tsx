'use client'

import { useState } from 'react'
import { createLiveSession } from '@/lib/actions/sessions'
import { toast } from 'react-hot-toast'

interface CreateLiveSessionModalProps {
    isOpen: boolean
    onClose: () => void
    teacherId: string
    courses: { id: string, title: string }[]
}

export default function CreateLiveSessionModal({ isOpen, onClose, teacherId, courses }: CreateLiveSessionModalProps) {
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [date, setDate] = useState('')
    const [time, setTime] = useState('')
    const [duration, setDuration] = useState(60)
    const [meetUrl, setMeetUrl] = useState('')
    const [courseId, setCourseId] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        
        if (!title || !date || !time || !meetUrl) {
            toast.error('Lütfen zorunlu alanları doldurun.')
            return
        }

        setLoading(true)
        
        // Combine date and time
        const localSessionDate = new Date(`${date}T${time}`);

        const res = await createLiveSession({
            title,
            description,
            session_date: localSessionDate.toISOString(),
            duration_minutes: duration,
            meet_url: meetUrl,
            teacher_id: teacherId,
            course_id: courseId || null
        })

        if (res.success) {
            toast.success('Canlı ders başarıyla oluşturuldu.')
            onClose()
            // Reset state
            setTitle('')
            setDescription('')
            setDate('')
            setTime('')
            setMeetUrl('')
            setCourseId('')
        } else {
            toast.error(res.error || 'Bir hata oluştu.')
        }
        setLoading(false)
    }

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn overflow-y-auto">
            <div className="bg-white rounded-[32px] w-full max-w-lg shadow-2xl overflow-hidden animate-scaleIn my-8">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <h2 className="text-xl font-black text-gray-900 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center text-lg shadow-sm border border-brand-primary/10">
                            <i className="fas fa-video"></i>
                        </div>
                        Canlı Ders Planla
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors flex items-center justify-center">
                        <i className="fas fa-times text-gray-400"></i>
                    </button>
                </div>

                <div className="p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Ders Başlığı *</label>
                            <input
                                type="text"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all"
                                placeholder="Örn: Hafta 1 - Soru Çözümü"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Açıklama (İsteğe Bağlı)</label>
                            <textarea
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all resize-none min-h-[80px]"
                                placeholder="Derste işlenecek konular..."
                            ></textarea>
                        </div>
                        
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">İlişkili Kurs (İsteğe Bağlı)</label>
                            <select
                                value={courseId}
                                onChange={e => setCourseId(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all text-gray-700"
                            >
                                <option value="">Bağımsız Ders (Kursa Bağlı Değil)</option>
                                {courses.map(course => (
                                    <option key={course.id} value={course.id}>{course.title}</option>
                                ))}
                            </select>
                            <p className="text-[10px] text-gray-400 mt-2 italic">* Eğer bir kurs seçerseniz, o kursa kayıtlı tüm öğrencilere bildirim gider ve takvimlerinde görünür.</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Tarih *</label>
                                <input
                                    type="date"
                                    value={date}
                                    onChange={e => setDate(e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Saat *</label>
                                <input
                                    type="time"
                                    value={time}
                                    onChange={e => setTime(e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all"
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Süre (Dk) *</label>
                                <select
                                    value={duration}
                                    onChange={e => setDuration(Number(e.target.value))}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all text-gray-700"
                                >
                                    <option value={30}>30 Dakika</option>
                                    <option value={45}>45 Dakika</option>
                                    <option value={60}>60 Dakika</option>
                                    <option value={90}>90 Dakika</option>
                                    <option value={120}>120 Dakika</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Toplantı Linki *</label>
                                <input
                                    type="url"
                                    value={meetUrl}
                                    onChange={e => setMeetUrl(e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all"
                                    placeholder="Zoom/Meet Linki"
                                    required
                                />
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-100 flex gap-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-6 py-3.5 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                                disabled={loading}
                            >
                                İptal
                            </button>
                            <button
                                type="submit"
                                className="flex-1 px-6 py-3.5 bg-brand-primary text-white font-bold rounded-xl hover:bg-brand-primary-dark transition-colors shadow-lg shadow-brand-primary/25 disabled:opacity-50"
                                disabled={loading}
                            >
                                {loading ? 'Planlanıyor...' : 'Dersi Planla'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}
