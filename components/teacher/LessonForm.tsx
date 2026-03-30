'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

// Quick schema for lesson (simplified)
const lessonSchema = z.object({
    title: z.string().min(2, 'Başlık en az 2 karakter olmalı'),
    description: z.string().optional(),
    duration_minutes: z.number().min(1, 'Süre en az 1 dakika olmalı'),
    video_url: z.string().url('Geçerli bir URL girin').optional().or(z.literal('')),
    is_published: z.boolean().default(false).optional(),
})

type LessonInput = z.infer<typeof lessonSchema>

// ─── YouTube URL Helper ───
function getYouTubeEmbedUrl(url: string): string | null {
    if (!url) return null
    try {
        let videoId: string | null = null
        const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/)
        if (shortMatch) videoId = shortMatch[1]
        const longMatch = url.match(/(?:youtube\.com\/watch\?v=|youtube\.com\/embed\/|youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/)
        if (longMatch) videoId = longMatch[1]
        if (videoId) return `https://www.youtube-nocookie.com/embed/${videoId}`
        return null
    } catch { return null }
}

interface LessonFormProps {
    courseId: string
    initialData?: {
        id?: string
        title?: string
        description?: string
        duration_minutes?: number
        video_url?: string
        is_published?: boolean
    }
    onClose: () => void
    onSuccess: () => void
}

export default function LessonForm({ courseId, initialData, onClose, onSuccess }: LessonFormProps) {
    const [isLoading, setIsLoading] = useState(false)

    const form = useForm<LessonInput>({
        resolver: zodResolver(lessonSchema),
        defaultValues: {
            title: initialData?.title || '',
            description: initialData?.description || '',
            duration_minutes: initialData?.duration_minutes || 45,
            video_url: initialData?.video_url || '',
            is_published: !!initialData?.is_published
        }
    })

    const { register, handleSubmit, watch, formState: { errors } } = form
    const videoUrl = watch('video_url')
    const embedUrl = videoUrl ? getYouTubeEmbedUrl(videoUrl) : null

    const onSubmit = async (data: LessonInput) => {
        setIsLoading(true)
        const supabase = createClient()

        try {
            if (initialData?.id) {
                // Update
                const { error } = await supabase
                    .from('lessons')
                    .update({ ...data, updated_at: new Date().toISOString() })
                    .eq('id', initialData.id)

                if (error) throw error
                toast.success('Ders güncellendi')
            } else {
                // Create
                const { error } = await supabase
                    .from('lessons')
                    .insert({
                        ...data,
                        course_id: courseId,
                        order_index: 999, // todo: fix order
                        status: 'DRAFT'
                    })

                if (error) throw error
                toast.success('Ders eklendi')
            }
            onSuccess()
        } catch (error: any) {
            toast.error('Hata: ' + error.message)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-lg w-full max-w-lg shadow-2xl overflow-hidden animate-scaleIn flex flex-col max-h-[90vh]">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50 flex-shrink-0">
                    <h3 className="font-bold text-lg text-gray-900">
                        {initialData ? 'Dersi Düzenle' : 'Yeni Ders Ekle'}
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                <div className="overflow-y-auto p-6 space-y-4 flex-1 custom-scrollbar">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Ders Başlığı</label>
                        <input
                            {...register('title')}
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none transition-all"
                            placeholder="Örn: Harflerin Okunuşu"
                        />
                        {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama (İsteğe bağlı)</label>
                        <textarea
                            {...register('description')}
                            rows={3}
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none resize-none transition-all"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Süre (Dakika)</label>
                            <input
                                type="number"
                                {...register('duration_minutes', { valueAsNumber: true })}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none transition-all"
                            />
                            {errors.duration_minutes && <p className="text-red-500 text-xs mt-1">{errors.duration_minutes.message}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Video URL (YouTube)
                            </label>
                            <input
                                {...register('video_url')}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none transition-all"
                                placeholder="https://youtube.com/watch?v=..."
                            />
                            {errors.video_url && <p className="text-red-500 text-xs mt-1">{errors.video_url.message}</p>}
                        </div>
                    </div>

                    {/* YouTube Preview */}
                    {embedUrl && (
                        <div className="mt-4 animate-fadeIn bg-gray-50 p-3 rounded-lg border border-gray-100">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                                <i className="fab fa-youtube text-red-600"></i>
                                Video Önizleme
                            </p>
                            <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-gray-200 shadow-sm bg-black">
                                <iframe
                                    src={embedUrl}
                                    className="absolute inset-0 w-full h-full"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                />
                            </div>
                            <p className="text-[10px] text-gray-400 mt-2 text-center italic">
                                * Not: YouTube&apos;da videoyu &quot;Unlisted&quot; (Liste dışı) olarak ayarlamanız önerilir.
                            </p>
                        </div>
                    )}

                    <div className="pt-2">
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <input
                                type="checkbox"
                                {...register('is_published')}
                                className="w-4 h-4 rounded border-gray-300 text-brand-primary focus:ring-brand-primary transition-all"
                            />
                            <span className="text-sm text-gray-700 group-hover:text-brand-primary transition-colors">Bu dersi yayınla</span>
                        </label>
                    </div>
                </div>

                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3 flex-shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        İptal
                    </button>
                    <button
                        onClick={handleSubmit(onSubmit)}
                        disabled={isLoading}
                        className="px-6 py-2 bg-brand-primary text-white rounded-lg font-bold hover:bg-brand-primary-dark transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span>Kaydediliyor...</span>
                            </>
                        ) : (
                            <span>Kaydet</span>
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}
