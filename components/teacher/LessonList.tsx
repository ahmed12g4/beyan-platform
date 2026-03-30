'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import ConfirmModal from '@/components/ConfirmModal'

interface Lesson {
    id: string
    title: string
    description: string | null
    duration_minutes: number
    order_index: number
    is_published: boolean
    status: string
}

interface LessonListProps {
    courseId: string
    lessons: Lesson[]
    onEdit: (lesson: Lesson) => void
    onRefresh: () => void
}

export default function LessonList({ courseId, lessons, onEdit, onRefresh }: LessonListProps) {
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

    const handleDelete = async () => {
        if (!confirmDeleteId) return

        setDeletingId(confirmDeleteId)
        const supabase = createClient()
        const { error } = await supabase.from('lessons').delete().eq('id', confirmDeleteId)

        if (error) {
            toast.error('Ders silinirken hata oluştu')
        } else {
            toast.success('Ders silindi')
            onRefresh()
        }
        setDeletingId(null)
        setConfirmDeleteId(null)
    }

    if (lessons.length === 0) {
        return (
            <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                    <i className="fas fa-layer-group text-2xl text-gray-400"></i>
                </div>
                <h3 className="text-lg font-medium text-gray-900">Henüz ders eklenmemiş</h3>
                <p className="text-gray-500 mt-1">Öğrencileriniz için ilk dersi oluşturarak başlayın.</p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {lessons.map((lesson, index) => (
                <div
                    key={lesson.id}
                    className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm flex items-center gap-4 hover:border-brand-accent transition-all group"
                >
                    <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 font-bold text-sm">
                        {index + 1}
                    </div>

                    <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 truncate">{lesson.title}</h4>
                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                            <span className="flex items-center gap-1">
                                <i className="far fa-clock"></i>
                                {lesson.duration_minutes} dk
                            </span>
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${lesson.is_published ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'
                                }`}>
                                {lesson.is_published ? 'YAYINDA' : 'TASLAK'}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            onClick={() => onEdit(lesson)}
                            className="p-2 text-gray-400 hover:text-brand-primary hover:bg-brand-primary/5 rounded-lg transition-colors"
                            title="Düzenle"
                        >
                            <i className="fas fa-edit"></i>
                        </button>
                        <button
                            onClick={() => setConfirmDeleteId(lesson.id)}
                            disabled={deletingId === lesson.id}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Sil"
                        >
                            {deletingId === lesson.id ? (
                                <i className="fas fa-spinner fa-spin"></i>
                            ) : (
                                <i className="fas fa-trash-alt"></i>
                            )}
                        </button>
                    </div>
                </div>
            ))}
            <ConfirmModal
                isOpen={!!confirmDeleteId}
                isLoading={!!deletingId}
                onClose={() => setConfirmDeleteId(null)}
                onConfirm={handleDelete}
                title="Dersi Sil"
                message="Bu dersi kalıcı olarak silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
                confirmText="Evet, Sil"
            />
        </div>
    )
}
