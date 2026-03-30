'use client'

import { useState, useEffect } from 'react'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { createClient } from '@/lib/supabase/client'
import AvatarUpload from '@/components/AvatarUpload'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function TeacherSettingsPage() {
    const { profile, loading: userLoading, refreshProfile } = useCurrentUser()
    const [isSaving, setIsSaving] = useState(false)
    const [saveSuccess, setSaveSuccess] = useState(false)
    const [formData, setFormData] = useState({
        full_name: '',
        phone: '',
        email: '',
        bio: ''
    })

    useEffect(() => {
        if (!userLoading && profile) {
            setFormData({
                full_name: profile.full_name || '',
                phone: profile.phone || '',
                email: profile.email || '',
                bio: profile.bio || '',

            })
        }
    }, [userLoading, profile])

    const handleSaveProfile = async () => {
        if (!profile?.id) return
        setIsSaving(true)
        setSaveSuccess(false)

        const supabase = createClient()
        await supabase
            .from('profiles')
            .update({
                full_name: formData.full_name,
                phone: formData.phone || null,
                bio: formData.bio || null
            })
            .eq('id', profile.id)

        await refreshProfile()
        setIsSaving(false)
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 3000)
    }

    if (userLoading) {
        return (
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 flex items-center justify-center h-64">
                <svg className="animate-spin h-8 w-8 text-brand-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
            </div>
        )
    }

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

            {/* Settings Sections */}
            <div className="space-y-10">
                {/* Profile Settings */}
                <div className="bg-white rounded-lg border-2 border-brand-accent border-opacity-30 p-8 sm:p-12 hover:shadow-xl transition-all duration-300">
                    <h2 className="text-2xl font-semibold text-gray-900 mb-10">Profil Bilgileri</h2>

                    {/* Profile Picture */}
                    <div className="mb-10 pb-10 border-b border-gray-100">
                        <label className="block text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">Profil Fotoğrafı</label>
                        <div className="flex flex-col sm:flex-row items-center gap-10">
                            <div className="relative group">
                                <AvatarUpload
                                    userId={profile.id}
                                    currentAvatarUrl={profile.avatar_url}
                                    userName={profile.full_name || 'User'}
                                    onUploadSuccess={(url) => {
                                        refreshProfile()
                                        toast.success("Profil fotoğrafı güncellendi!")
                                    }}
                                />
                            </div>
                            <div className="flex-1 text-center sm:text-left">
                                <p className="text-[13px] text-gray-500 font-medium leading-relaxed mb-2">
                                    Resmi yüklemek ve kare olarak kırpmak için fotoğrafa tıklayın. Maksimum 5MB boyutunda görsel yükleyebilirsiniz.
                                </p>
                                <div className="inline-block px-2.5 py-1.5 border-2 border-amber-200 bg-amber-50 text-amber-800 text-[11px] font-bold rounded-md">
                                    📌 İdeal Boyut: 500x500px (Kare Boyut)
                                </div>
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
                                    className="w-full px-5 py-4 border-2 border-gray-100 rounded-lg focus:border-brand-accent focus:ring-0 focus:outline-none transition-all text-gray-900 bg-gray-50/50 focus:bg-white font-medium"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">E-posta Adresi</label>
                            <input
                                type="email"
                                value={formData.email}
                                disabled
                                className="w-full px-5 py-4 border-2 border-gray-100 rounded-lg text-gray-500 bg-gray-50 font-medium cursor-not-allowed"
                            />
                            <p className="text-xs text-gray-400 mt-1">E-posta adresi değiştirilemez</p>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Biyografi</label>
                            <textarea
                                rows={4}
                                value={formData.bio}
                                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                className="w-full px-5 py-4 border-2 border-gray-100 rounded-lg focus:border-brand-accent focus:ring-0 focus:outline-none transition-all text-gray-900 bg-gray-50/50 focus:bg-white font-medium resize-none"
                            />
                        </div>



                        {saveSuccess && (
                            <div className="p-5 bg-green-50 border-2 border-green-100 rounded-lg animate-fadeIn">
                                <p className="text-sm font-semibold text-green-700 flex items-center gap-2">
                                    <i className="fas fa-check-circle"></i>
                                    Değişiklikler başarıyla kaydedildi!
                                </p>
                            </div>
                        )}

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

                {/* Security Section */}
                <div className="bg-white rounded-lg border-2 border-brand-accent border-opacity-30 p-8 sm:p-12 hover:shadow-xl transition-all duration-300">
                    <h2 className="text-2xl font-semibold text-gray-900 mb-8">Güvenlik</h2>
                    <Link href="/teacher/change-password">
                        <div className="bg-white border-2 border-gray-900 rounded-lg overflow-hidden hover:border-brand-accent transition-all duration-300 group cursor-pointer shadow-sm">
                            <div className="p-6 flex items-center justify-between">
                                <div>
                                    <p className="font-semibold text-lg text-gray-900">Şifre Değiştir</p>
                                    <p className="text-sm text-gray-500 font-medium mt-1">Hesap güvenliğiniz için şifrenizi güncelleyin</p>
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
            </div>
        </div>
    )
}
