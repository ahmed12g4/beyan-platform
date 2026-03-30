'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import AvatarUpload from '@/components/AvatarUpload'
import toast from 'react-hot-toast'

export default function AdminProfileForm() {
    const { profile, loading: userLoading, refreshProfile } = useCurrentUser()
    const [isSaving, setIsSaving] = useState(false)
    const [formData, setFormData] = useState({
        full_name: '',
        phone: '',
        bio: ''
    })

    useEffect(() => {
        if (!userLoading && profile) {
            setFormData({
                full_name: profile.full_name || '',
                phone: profile.phone || '',
                bio: profile.bio || ''
            })
        }
    }, [userLoading, profile])

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!profile?.id) return
        setIsSaving(true)

        try {
            const supabase = createClient()
            const { error } = await supabase
                .from('profiles')
                .update({
                    full_name: formData.full_name,
                    phone: formData.phone || null,
                    bio: formData.bio || null
                })
                .eq('id', profile.id)

            if (error) throw error

            await refreshProfile()
            toast.success('Profil bilgileri başarıyla güncellendi!')
        } catch (error: any) {
            toast.error(error.message || 'Profil güncellenirken bir hata oluştu.')
        } finally {
            setIsSaving(false)
        }
    }

    if (userLoading) {
        return (
            <div className="flex items-center justify-center p-12">
                <i className="fas fa-spinner fa-spin text-3xl text-brand-primary"></i>
            </div>
        )
    }

    if (!profile) return null

    return (
        <div className="space-y-8 animate-fadeIn">
            {/* Avatar Section */}
            <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100/80 hover:shadow-md transition-shadow">
                <h3 className="text-xl font-extrabold text-gray-900 mb-6 flex items-center gap-3 pb-4 border-b border-gray-100">
                    <span className="flex items-center justify-center w-12 h-12 rounded-lg bg-[#edf1f1] text-[#204544]">
                        <i className="fas fa-user-circle text-xl"></i>
                    </span>
                    Profil Fotoğrafı
                </h3>
                <div className="flex flex-col sm:flex-row items-center gap-10 mt-4">
                    <div className="relative group">
                        <AvatarUpload
                            userId={profile.id}
                            currentAvatarUrl={profile.avatar_url}
                            userName={profile.full_name || 'Admin'}
                            onUploadSuccess={(url) => {
                                refreshProfile()
                            }}
                        />
                    </div>
                    <div className="flex-1 text-center sm:text-left">
                        <p className="text-gray-500 font-medium text-sm leading-relaxed mb-2">
                            Resminizi yüklemek ve kare formatında kırpmak için fotoğrafa tıklayın.<br />
                            <span className="text-xs mt-1 block opacity-70">Maksimum yükleme boyutu: 5MB</span>
                        </p>
                        <div className="inline-block px-2.5 py-1.5 border-2 border-amber-200 bg-amber-50 text-amber-800 text-[11px] font-bold rounded-md mb-2 mr-2">
                            📌 İdeal Boyut: 500x500px (Kare Boyut)
                        </div>
                        <span className="text-[11px] text-blue-600 bg-blue-50/80 px-2 py-1.5 rounded font-bold inline-block border shadow-sm">
                            <i className="fas fa-sync-alt mr-1"></i> Sildiğinizde veya güncellediğinizde anında yansır
                        </span>
                    </div>
                </div>
            </div>

            {/* Profile Info Form */}
            <form onSubmit={handleSaveProfile} className="bg-white p-8 rounded-lg shadow-sm border border-gray-100/80 hover:shadow-md transition-shadow">
                <h3 className="text-xl font-extrabold text-gray-900 mb-6 flex items-center gap-3 pb-4 border-b border-gray-100">
                    <span className="flex items-center justify-center w-12 h-12 rounded-lg bg-[#edf1f1] text-[#204544]">
                        <i className="fas fa-id-badge text-xl"></i>
                    </span>
                    Kişisel Bilgiler
                </h3>

                <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-2.5">
                        <label className="text-sm font-bold text-gray-700">Ad Soyad</label>
                        <input
                            type="text"
                            value={formData.full_name}
                            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                            required
                            className="w-full px-5 py-3.5 text-sm bg-gray-50 border border-gray-200/80 rounded-md focus:outline-none focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary transition-all hover:border-gray-300 focus:bg-white"
                            placeholder="Ziyad Dalil"
                        />
                    </div>

                    <div className="space-y-2.5">
                        <label className="text-sm font-bold text-gray-700">E-posta (Salt Okunur)</label>
                        <input
                            type="email"
                            value={profile.email || ''}
                            disabled
                            className="w-full px-5 py-3.5 text-sm bg-gray-100 text-gray-500 border border-gray-200/80 rounded-md cursor-not-allowed"
                        />
                    </div>

                    <div className="space-y-2.5">
                        <label className="text-sm font-bold text-gray-700">Telefon</label>
                        <div className="relative group">
                            <span className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-brand-primary transition-colors"><i className="fas fa-phone"></i></span>
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                className="w-full pl-11 pr-5 py-3.5 text-sm bg-gray-50 border border-gray-200/80 rounded-md focus:outline-none focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary transition-all hover:border-gray-300 focus:bg-white"
                                placeholder="+90 555..."
                            />
                        </div>
                    </div>

                    <div className="space-y-2.5 md:col-span-2">
                        <label className="text-sm font-bold text-gray-700">Hakkımda</label>
                        <textarea
                            value={formData.bio}
                            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                            rows={3}
                            className="w-full px-5 py-3.5 text-sm bg-gray-50 border border-gray-200/80 rounded-md focus:outline-none focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary transition-all hover:border-gray-300 focus:bg-white resize-none"
                            placeholder="Kendinizden kısaca bahsedin..."
                        />
                    </div>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end">
                    <button
                        type="submit"
                        disabled={isSaving}
                        className="px-8 py-3.5 text-sm font-bold text-white bg-brand-primary hover:bg-[#15302f] rounded-lg transition-all disabled:opacity-50 flex items-center gap-2 shadow-md shadow-[#204544]/20 hover:shadow-lg hover:-translate-y-0.5"
                    >
                        {isSaving ? (
                            <>
                                <i className="fas fa-spinner fa-spin"></i>
                                Kaydediliyor...
                            </>
                        ) : (
                            <>
                                <i className="fas fa-save"></i>
                                Bilgileri Güncelle
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    )
}
