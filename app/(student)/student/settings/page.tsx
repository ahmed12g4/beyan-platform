'use client'

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { createClient } from '@/lib/supabase/client'
import Avatar from '@/components/Avatar'
import AvatarUpload from '@/components/AvatarUpload'
import { toast } from 'react-hot-toast'
import Link from 'next/link'
import { deleteMyAccount } from '@/lib/actions/profile'
import { logoutAction } from '@/lib/actions/auth'

export default function StudentSettingsPage() {
    const { user, profile, loading, refreshProfile } = useCurrentUser()
    const [isSaving, setIsSaving] = useState(false)
    const [formData, setFormData] = useState({
        full_name: '',
        phone: '',
        bio: ''
    })

    // New state for deletion
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [deleteConfirmation, setDeleteConfirmation] = useState('')
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    const [isDeleting, setIsDeleting] = useState(false)

    useEffect(() => {
        if (profile) {
            setFormData({
                full_name: profile.full_name || '',
                phone: profile.phone || '',
                bio: profile.bio || '',

            })
        }
    }, [profile])

    const handleSaveProfile = async () => {
        if (!user) return

        setIsSaving(true)
        const supabase = createClient()

        try {
            const { error } = await (supabase as any)
                .from('profiles')
                .update({
                    full_name: formData.full_name,
                    phone: formData.phone,
                    bio: formData.bio
                })
                .eq('id', user.id)

            if (error) throw error

            toast.success('Profil başarıyla güncellendi!')
            refreshProfile()
        } catch (error) {
            console.error('Error updating profile:', error)
            toast.error('Profil güncellenirken bir hata oluştu.')
        } finally {
            setIsSaving(false)
        }
    }

    const handleDeleteAccount = async () => {
        if (deleteConfirmation !== 'SIL') return
        setIsDeleting(true)
        try {
            const result = await deleteMyAccount()
            if (result.success) {
                toast.success('Hesabınız silindi. Hoşçakalın!')
                // Force logout and redirect
                await logoutAction()
            } else {
                toast.error(result.error || 'Silme işlemi başarısız')
            }
        } catch (err) {
            console.error(err)
            toast.error('Bir hata oluştu.')
        } finally {
            setIsDeleting(false)
            setShowDeleteModal(false)
        }
    }

    if (loading) return <div className="p-8 text-center">Yükleniyor...</div>

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 animate-fadeIn">
            {/* Page Header */}
            <div className="mb-12">
                <h1 className="text-3xl sm:text-4xl font-semibold text-gray-900 mb-2">
                    Ayarlar
                </h1>
                <p className="text-gray-900 text-base">
                    Profil bilgilerinizi ve tercihlerinizi yönetin.
                </p>
            </div>

            <div className="space-y-10">
                {/* 1. Profile Settings */}
                <div className="bg-white rounded-lg border-2 border-brand-accent border-opacity-30 p-8 sm:p-12 hover:shadow-xl transition-all duration-300">
                    <h2 className="text-2xl font-semibold text-gray-900 mb-10">Profil Bilgileri</h2>

                    {/* Profile Picture Upload */}
                    <div className="mb-10 pb-10 border-b border-gray-100">
                        <label className="block text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">Profil Fotoğrafı</label>
                        <div className="flex flex-col sm:flex-row items-center gap-10">
                            <AvatarUpload
                                userId={user?.id || ''}
                                currentAvatarUrl={profile?.avatar_url}
                                userName={profile?.full_name || 'Öğrenci'}
                                onUploadSuccess={refreshProfile}
                                userRole="student"
                            />
                            <div className="flex-1 text-center sm:text-left">
                                <p className="text-xs text-gray-500 font-medium italic">
                                    Profil fotoğrafı şu anda sadece yöneticiler tarafından güncellenebilir.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Ad Soyad</label>
                                <input
                                    type="text"
                                    value={formData.full_name}
                                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                    className="w-full px-5 py-4 border-2 border-gray-100 rounded-lg focus:border-brand-accent focus:ring-0 focus:outline-none transition-all text-gray-900 bg-gray-50/50 focus:bg-white font-medium"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Telefon Numarası</label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    placeholder="+90 5XX XXX XX XX"
                                    className="w-full px-5 py-4 border-2 border-gray-100 rounded-lg focus:border-brand-accent focus:ring-0 focus:outline-none transition-all text-gray-900 bg-gray-50/50 focus:bg-white font-medium"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">E-posta Adresi</label>
                            <input
                                type="email"
                                value={profile?.email || ''}
                                disabled
                                className="w-full px-5 py-4 border-2 border-gray-100 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed font-medium"
                            />
                            <p className="text-xs text-gray-400 mt-2 ml-1">E-posta adresi değiştirilemez.</p>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Hakkımda</label>
                            <textarea
                                value={formData.bio}
                                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                rows={3}
                                className="w-full px-5 py-4 border-2 border-gray-100 rounded-lg focus:border-brand-accent focus:ring-0 focus:outline-none transition-all text-gray-900 bg-gray-50/50 focus:bg-white font-medium resize-none"
                                placeholder="Kendinizden bahsedin..."
                            />
                        </div>



                        <div className="pt-4">
                            <button
                                onClick={handleSaveProfile}
                                disabled={isSaving}
                                className="px-10 py-4 bg-brand-primary text-white rounded-lg font-bold hover:bg-brand-primary-dark transition-all shadow-lg hover:translate-y-[-2px] active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSaving ? 'Kaydediliyor...' : 'DEĞİŞİKLİKLERİ KAYDET'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* 2. Security Settings */}
                <div className="bg-white rounded-lg border-2 border-brand-accent border-opacity-30 p-8 sm:p-12 hover:shadow-xl transition-all duration-300">
                    <h2 className="text-2xl font-semibold text-gray-900 mb-8">Gizlilik ve Güvenlik</h2>
                    <Link href="/student/change-password">
                        <div className="bg-white border-2 border-gray-900 rounded-lg overflow-hidden hover:border-brand-accent transition-all duration-300 group cursor-pointer shadow-sm">
                            <div className="p-6 flex items-center justify-between">
                                <div>
                                    <p className="font-semibold text-lg text-gray-900">Şifre Değiştir</p>
                                    <p className="text-sm text-gray-500 font-medium mt-1">Hesap güvenliğinizi sağlamak için şifrenizi güncelleyin</p>
                                </div>
                                <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center group-hover:bg-brand-primary transition-colors">
                                    <svg className="w-5 h-5 text-brand-primary group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </Link>
                </div>

                {/* 3. Notification Settings (Placeholder) */}
                <div className="bg-white rounded-lg border-2 border-brand-accent border-opacity-30 p-8 sm:p-12 opacity-70">
                    <h2 className="text-2xl font-semibold text-gray-900 mb-8">Bildirim Tercihleri</h2>
                    <p className="text-gray-500 italic">Bu özellik yakında aktif olacaktır.</p>
                </div>

                {/* 4. DANGER ZONE */}
                <div className="bg-red-50 rounded-lg border-2 border-red-100 p-8 sm:p-12">
                    <h2 className="text-2xl font-semibold text-red-700 mb-4">Hesabı Sil</h2>
                    <p className="text-red-600 mb-8 max-w-2xl">
                        Hesabınızı silmek geri alınamaz bir işlemdir. Tüm kurs ilerlemeniz, sertifikalarınız ve yorumlarınız kalıcı olarak silinecektir.
                    </p>
                    <button
                        onClick={() => setShowDeleteModal(true)}
                        className="px-6 py-3 bg-white border-2 border-red-200 text-red-600 rounded-lg font-bold hover:bg-red-600 hover:text-white hover:border-red-600 transition-all shadow-sm"
                    >
                        Hesabımı Kalıcı Olarak Sil
                    </button>
                </div>
            </div>

            {/* Delete Modal */}
            {mounted && showDeleteModal && createPortal(
                <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/60 transition-opacity animate-fadeIn" onClick={() => setShowDeleteModal(false)} />
                    <div className="relative bg-white shadow-2xl p-8 w-full max-w-md rounded-lg text-center animate-gentle-rise border-4 border-red-50">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <i className="fas fa-exclamation-triangle text-2xl text-red-600"></i>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-4">Emin misiniz?</h3>
                        <div className="text-gray-600 text-sm mb-6 space-y-2">
                            <p>Bu işlem <b>GERİ ALINAMAZ</b>.</p>
                            <p>Hesabınız ve ilişkili tüm verileriniz (kurslar, ilerleme, yorumlar) sunucularımızdan kalıcı olarak silinecektir.</p>
                        </div>

                        <div className="mb-6">
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 text-left">Onaylamak için "SIL" yazın</label>
                            <input
                                type="text"
                                value={deleteConfirmation}
                                onChange={(e) => setDeleteConfirmation(e.target.value)}
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:outline-none focus:ring-4 focus:ring-red-500/10 transition-all font-bold text-center tracking-widest placeholder:font-normal"
                                placeholder="SIL"
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowDeleteModal(false)
                                    setDeleteConfirmation('')
                                }}
                                className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                Vazgeç
                            </button>
                            <button
                                onClick={handleDeleteAccount}
                                disabled={deleteConfirmation !== 'SIL' || isDeleting}
                                className="flex-1 py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-200"
                            >
                                {isDeleting ? 'Siliniyor...' : 'Hesabımı Sil'}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    )
}
