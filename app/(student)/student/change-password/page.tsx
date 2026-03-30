'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'react-hot-toast'

export default function ChangePasswordPage() {
    const router = useRouter()
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!newPassword || !confirmPassword) {
            toast.error('Lütfen tüm alanları doldurun')
            return
        }

        if (newPassword !== confirmPassword) {
            toast.error('Yeni şifreler eşleşmiyor')
            return
        }

        if (newPassword.length < 6) {
            toast.error('Şifre en az 6 karakter olmalıdır')
            return
        }

        setIsLoading(true)
        const supabase = createClient()

        try {
            const { error } = await supabase.auth.updateUser({
                password: newPassword
            })

            if (error) throw error

            toast.success('Şifreniz başarıyla değiştirildi!')
            setTimeout(() => {
                router.push('/student/settings')
            }, 1000)
        } catch (error: any) {
            console.error('Error changing password:', error)
            toast.error(error.message || 'Şifre değiştirilirken bir hata oluştu')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 animate-fadeIn">
            {/* Page Header */}
            <div className="mb-8">
                <h1 className="text-3xl sm:text-4xl font-semibold text-gray-900 mb-2">
                    Şifre Değiştir
                </h1>
                <p className="text-gray-600">
                    Hesabınızın güvenliği için güçlü bir şifre seçin.
                </p>
            </div>

            {/* Form */}
            <div className="bg-white rounded-lg border-2 border-brand-accent border-opacity-30 p-6 sm:p-8">
                <form onSubmit={handleSubmit} className="space-y-6">

                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-6">
                        <p className="text-sm text-blue-800 flex items-start gap-2">
                            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Oturum açıkken mevcut şifrenizi girmenize gerek yoktur. Sadece yeni şifrenizi belirleyin.
                        </p>
                    </div>

                    {/* New Password */}
                    <div>
                        <label className="block text-sm font-bold text-gray-900 mb-2">
                            Yeni Şifre
                        </label>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-brand-accent focus:ring-0 focus:outline-none transition-all text-gray-900 bg-gray-50 focus:bg-white"
                            placeholder="Yeni şifrenizi girin"
                        />
                    </div>

                    {/* Confirm Password */}
                    <div>
                        <label className="block text-sm font-bold text-gray-900 mb-2">
                            Yeni Şifre (Tekrar)
                        </label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-brand-accent focus:ring-0 focus:outline-none transition-all text-gray-900 bg-gray-50 focus:bg-white"
                            placeholder="Yeni şifrenizi tekrar girin"
                        />
                    </div>

                    {/* Submit Button */}
                    <div className="flex gap-4 pt-4">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex-1 px-6 py-3 bg-brand-primary text-white rounded-lg font-bold hover:bg-brand-primary-dark transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Kaydediliyor...' : 'Şifreyi Değiştir'}
                        </button>
                        <button
                            type="button"
                            onClick={() => router.push('/student/settings')}
                            className="px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                        >
                            İptal
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
