'use client'

import { useState } from 'react'
import { deleteContactMessage, markAsRead } from '@/lib/actions/contact'
import toast from 'react-hot-toast'
import ConfirmModal from '@/components/ConfirmModal'

export default function InquiryActions({ id, isRead }: { id: string, isRead: boolean }) {
    const [loading, setLoading] = useState(false)

    const [isConfirmOpen, setIsConfirmOpen] = useState(false)

    const handleDeleteClick = () => {
        setIsConfirmOpen(true)
    }

    const confirmDelete = async () => {
        setIsConfirmOpen(false)
        setLoading(true)
        try {
            const res = await deleteContactMessage(id)
            if (res.success) {
                toast.success('Mesaj silindi')
            } else {
                toast.error(res.error || 'Hata oluştu')
            }
        } catch (error) {
            toast.error('Bağlantı hatası')
        } finally {
            setLoading(false)
        }
    }

    const handleMarkAsRead = async () => {
        setLoading(true)
        try {
            const res = await markAsRead(id)
            if (res.success) {
                toast.success('Okundu olarak işaretlendi')
            } else {
                toast.error(res.error || 'Hata oluştu')
            }
        } catch (error) {
            toast.error('Bağlantı hatası')
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <div className="flex items-center justify-end gap-2">
                {!isRead && (
                    <button
                        onClick={handleMarkAsRead}
                        disabled={loading}
                        className="w-11 h-11 rounded-lg flex items-center justify-center transition-all bg-white text-gray-400 border border-gray-100 hover:bg-green-50 hover:text-green-600 hover:border-green-200 shadow-sm disabled:opacity-50 active:scale-95"
                        title="Okundu olarak işaretle"
                    >
                        {loading ? <i className="fas fa-spinner fa-spin text-xs"></i> : <i className="fas fa-check text-xs"></i>}
                    </button>
                )}
                <button
                    onClick={handleDeleteClick}
                    disabled={loading}
                    className="w-11 h-11 rounded-lg flex items-center justify-center transition-all bg-white text-gray-400 border border-gray-100 hover:bg-red-50 hover:text-red-500 hover:border-red-200 shadow-sm disabled:opacity-50 active:scale-95"
                    title="Kalıcı Olarak Sil"
                >
                    {loading ? <i className="fas fa-spinner fa-spin text-xs"></i> : <i className="fas fa-trash-alt text-xs"></i>}
                </button>
            </div>
            <ConfirmModal
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={confirmDelete}
                title="İletişim Talebini Sil"
                message="Bu mesajı kalıcı olarak silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
                confirmText="Evet, Sil"
            />
        </>
    )
}
