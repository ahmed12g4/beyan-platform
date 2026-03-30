'use client'

import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { createAdminGroup, updateAdminGroup } from '@/lib/actions/admin-groups'

interface GroupModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
    group?: any // For edit mode
    teachers: any[]
}

const DAYS = [
    { id: 1, name: 'Pazartesi' },
    { id: 2, name: 'Salı' },
    { id: 3, name: 'Çarşamba' },
    { id: 4, name: 'Perşembe' },
    { id: 5, name: 'Cuma' },
    { id: 6, name: 'Cumartesi' },
    { id: 0, name: 'Pazar' }
]

export default function GroupModal({ isOpen, onClose, onSuccess, group, teachers }: GroupModalProps) {
    const isEdit = !!group
    const [loading, setLoading] = useState(false)
    const [uploading, setUploading] = useState(false)

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        thumbnail_url: '',
        teacher_id: '',
        price: 0,
        lessons_count: 8,
        start_date: '',
        end_date: '',
        max_students: 10,
        google_meet_link: '',
        is_published: true
    })

    const [sessions, setSessions] = useState<any[]>([])

    useEffect(() => {
        if (group) {
            setFormData({
                title: group.title || '',
                description: group.description || '',
                thumbnail_url: group.thumbnail_url || '',
                teacher_id: group.teacher_id || '',
                price: group.price || 0,
                lessons_count: group.lessons_count || 8,
                start_date: group.start_date || '',
                end_date: group.end_date || '',
                max_students: group.max_students || 10,
                google_meet_link: group.google_meet_link || '',
                is_published: group.is_published ?? true
            })
            // Fetch sessions if edit mode (this ideally should be passed or fetched)
            // For now, assume we'll fetch them in the parent or they're passed
            setSessions(group.sessions || [])
        } else {
            setFormData({
                title: '',
                description: '',
                thumbnail_url: '',
                teacher_id: '',
                price: 0,
                lessons_count: 8,
                start_date: '',
                end_date: '',
                max_students: 10,
                google_meet_link: '',
                is_published: true
            })
            setSessions([])
        }
    }, [group, isOpen])

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        try {
            setUploading(true)
            const supabase = createClient()
            const fileExt = file.name.split('.').pop()
            const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`
            const filePath = `${fileName}`

            const { error: uploadError } = await supabase.storage
                .from('groups')
                .upload(filePath, file)

            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage
                .from('groups')
                .getPublicUrl(filePath)

            setFormData(prev => ({ ...prev, thumbnail_url: publicUrl }))
            toast.success('Görsel yüklendi')
        } catch (error: any) {
            toast.error('Görsel yüklenemedi: ' + error.message)
        } finally {
            setUploading(false)
        }
    }

    const toggleDay = (dayId: number) => {
        if (sessions.find(s => s.day_of_week === dayId)) {
            setSessions(prev => prev.filter(s => s.day_of_week !== dayId))
        } else {
            setSessions(prev => [...prev, { day_of_week: dayId, start_time: '10:00', end_time: '11:00' }])
        }
    }

    const updateSessionTime = (dayId: number, field: 'start_time' | 'end_time', value: string) => {
        setSessions(prev => prev.map(s => s.day_of_week === dayId ? { ...s, [field]: value } : s))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.teacher_id) return toast.error('Lütfen bir eğitmen seçin')
        if (sessions.length === 0) return toast.error('En az bir gün seçmelisiniz')

        setLoading(true)
        try {
            const result = isEdit
                ? await updateAdminGroup(group.id, formData, sessions)
                : await createAdminGroup(formData, sessions)

            if (result.success) {
                toast.success(result.message || 'Başarılı')
                onSuccess()
                onClose()
            } else {
                toast.error(result.error || 'Hata oluştu')
            }
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
                    <h2 className="text-xl font-black text-brand-primary uppercase tracking-tight">
                        {isEdit ? 'Grubu Düzenle' : 'Yeni Grup Ekle'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <i className="fas fa-times text-lg"></i>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Thumbnail */}
                    <div className="flex items-center gap-6">
                        <div className="w-32 h-32 bg-gray-50 rounded-xl overflow-hidden border-2 border-dashed border-gray-200 flex items-center justify-center relative">
                            {formData.thumbnail_url ? (
                                <Image src={formData.thumbnail_url} alt="Preview" fill className="object-cover" />
                            ) : (
                                <i className="fas fa-users text-3xl text-gray-200"></i>
                            )}
                            {uploading && (
                                <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                                    <i className="fas fa-spinner fa-spin text-brand-primary"></i>
                                </div>
                            )}
                        </div>
                        <div className="flex-1">
                            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" id="group-thumb" />
                            <label htmlFor="group-thumb" className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-700 rounded-lg text-xs font-bold border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors">
                                <i className="fas fa-upload"></i> Görsel Yükle
                            </label>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Grup İsmi</label>
                            <input required value={formData.title} onChange={e => setFormData(p => ({ ...p, title: e.target.value }))} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:border-brand-primary transition-all" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Eğitmen</label>
                            <select required value={formData.teacher_id} onChange={e => setFormData(p => ({ ...p, teacher_id: e.target.value }))} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:border-brand-primary">
                                <option value="">Eğitmen Seçin</option>
                                {teachers.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Fiyat (TL)</label>
                            <input type="number" required value={formData.price} onChange={e => setFormData(p => ({ ...p, price: Number(e.target.value) }))} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:border-brand-primary" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Kontenjan</label>
                            <input type="number" required value={formData.max_students} onChange={e => setFormData(p => ({ ...p, max_students: Number(e.target.value) }))} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:border-brand-primary" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Başlangıç Tarihi</label>
                            <input type="date" required value={formData.start_date} onChange={e => setFormData(p => ({ ...p, start_date: e.target.value }))} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:border-brand-primary" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Bitiş Tarihi</label>
                            <input type="date" required value={formData.end_date} onChange={e => setFormData(p => ({ ...p, end_date: e.target.value }))} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:border-brand-primary" />
                        </div>
                    </div>

                    {/* Schedule Manager */}
                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Haftalık Program</label>
                        <div className="flex flex-wrap gap-2">
                            {DAYS.map(day => {
                                const isSelected = sessions.find(s => s.day_of_week === day.id)
                                return (
                                    <button
                                        key={day.id}
                                        type="button"
                                        onClick={() => toggleDay(day.id)}
                                        className={`px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all ${isSelected ? 'bg-brand-primary text-white border-brand-primary shadow-md' : 'bg-white text-gray-400 border-gray-100 hover:border-gray-300'
                                            }`}
                                    >
                                        {day.name}
                                    </button>
                                )
                            })}
                        </div>

                        <div className="space-y-2">
                            {sessions.map(s => (
                                <div key={s.day_of_week} className="flex items-center gap-4 bg-gray-50 p-3 rounded-xl border border-gray-100 animate-slideUp">
                                    <span className="w-24 text-[11px] font-black text-gray-600 uppercase tracking-widest">{DAYS.find(d => d.id === s.day_of_week)?.name}</span>
                                    <div className="flex items-center gap-2">
                                        <input type="time" value={s.start_time} onChange={e => updateSessionTime(s.day_of_week, 'start_time', e.target.value)} className="bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-xs font-bold outline-none focus:border-brand-primary" />
                                        <span className="text-gray-300 text-xs">-</span>
                                        <input type="time" value={s.end_time} onChange={e => updateSessionTime(s.day_of_week, 'end_time', e.target.value)} className="bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-xs font-bold outline-none focus:border-brand-primary" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Google Meet Linki</label>
                        <input value={formData.google_meet_link} onChange={e => setFormData(p => ({ ...p, google_meet_link: e.target.value }))} placeholder="https://meet.google.com/..." className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:border-brand-primary" />
                    </div>

                    <div className="flex items-center gap-3">
                        <input type="checkbox" id="g-pub" checked={formData.is_published} onChange={e => setFormData(p => ({ ...p, is_published: e.target.checked }))} className="w-5 h-5 rounded border-gray-300 text-brand-primary" />
                        <label htmlFor="g-pub" className="text-xs font-black text-gray-700 uppercase tracking-widest cursor-pointer">Hemen Yayınla</label>
                    </div>

                    <div className="flex justify-end gap-3 pt-6 sticky bottom-0 bg-white">
                        <button type="button" onClick={onClose} className="px-6 py-3 text-xs font-black uppercase tracking-widest text-gray-400 hover:text-gray-600">İptal</button>
                        <button type="submit" disabled={loading} className="px-10 py-3 bg-brand-primary text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-brand-primary/20 hover:bg-brand-primary-dark transition-all disabled:opacity-50 min-w-[140px]">
                            {loading ? <i className="fas fa-spinner fa-spin"></i> : (isEdit ? 'Güncelle' : 'Kaydet')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
