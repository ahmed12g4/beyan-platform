'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function ChangePasswordPage() {
    const router = useRouter()
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setSuccess(false)

        if (!newPassword || !confirmPassword) {
            setError('Lütfen tüm alanları doldurun')
            return
        }

        if (newPassword !== confirmPassword) {
            setError('Yeni şifreler eşleşmiyor')
            return
        }

        if (newPassword.length < 6) {
            setError('Şifre en az 6 karakter olmalıdır')
            return
        }

        setIsLoading(true)
        const supabase = createClient()
        const { error: updateError } = await supabase.auth.updateUser({
            password: newPassword,
        })

        setIsLoading(false)

        if (updateError) {
            setError(updateError.message)
            return
        }

        setSuccess(true)
        setNewPassword('')
        setConfirmPassword('')

        setTimeout(() => {
            router.push('/teacher/settings')
        }, 2000)
    }

    return (
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 animate-fadeIn">
            {/* Page Header */}
            <div className="mb-12">
                <h1 className="text-3xl sm:text-4xl font-semibold text-gray-900 mb-2">
                    Şifre Değiştir
                </h1>
                <p className="text-gray-900 text-base">
                    Hesabınızın güvenliği için güçlü bir şifre seçin.
                </p>
            </div>

            {/* Form */}
            <div className="bg-white rounded-lg border-2 border-brand-accent border-opacity-30 p-8 sm:p-10 hover:shadow-xl transition-all duration-300">
                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* New Password */}
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                            Yeni Şifre
                        </label>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full px-5 py-4 border-2 border-gray-100 rounded-lg focus:border-brand-accent focus:ring-0 focus:outline-none transition-all text-gray-900 bg-gray-50/50 focus:bg-white font-medium"
                            placeholder="Yeni şifrenizi girin"
                        />
                    </div>

                    {/* Confirm Password */}
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                            Yeni Şifre (Tekrar)
                        </label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full px-5 py-4 border-2 border-gray-100 rounded-lg focus:border-brand-accent focus:ring-0 focus:outline-none transition-all text-gray-900 bg-gray-50/50 focus:bg-white font-medium"
                            placeholder="Yeni şifrenizi tekrar girin"
                        />
                    </div>

                    {error && (
                        <div className="p-5 bg-red-50 border-2 border-red-100 rounded-lg animate-fadeIn">
                            <p className="text-sm font-semibold text-red-600 flex items-center gap-2">
                                <i className="fas fa-exclamation-circle text-red-400"></i>
                                {error}
                            </p>
                        </div>
                    )}

                    {success && (
                        <div className="p-5 bg-green-50 border-2 border-green-100 rounded-lg animate-fadeIn">
                            <p className="text-sm font-semibold text-green-700 flex items-center gap-2">
                                <i className="fas fa-check-circle text-green-400"></i>
                                Şifreniz başarıyla değiştirildi! Yönlendiriliyorsunuz...
                            </p>
                        </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-4 pt-2">
                        <button
                            type="submit"
                            disabled={isLoading || success}
                            className="flex-[2] px-8 py-4 bg-brand-primary text-white rounded-lg font-bold hover:bg-brand-primary-dark transition-all shadow-lg hover:translate-y-[-2px] active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider text-sm"
                        >
                            {isLoading ? 'KAYDEDİLİYOR...' : success ? 'KAYDEDİLDİ!' : 'ŞİFREYİ DEĞİŞTİR'}
                        </button>
                        <button
                            type="button"
                            onClick={() => router.push('/teacher/settings')}
                            className="flex-1 px-8 py-4 border-2 border-gray-100 text-gray-400 rounded-lg font-bold hover:bg-gray-50 hover:text-gray-600 transition-all uppercase tracking-wider text-sm"
                        >
                            İPTAL
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
