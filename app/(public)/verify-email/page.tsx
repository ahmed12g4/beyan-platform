'use client'

import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import { toast } from 'react-hot-toast'

export default function VerifyEmailPage() {
    const [loading, setLoading] = useState(false)
    const supabase = createClient()

    const resendEmail = async () => {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (user?.email) {
            const { error } = await supabase.auth.resend({
                type: 'signup',
                email: user.email,
            })
            if (error) {
                toast.error(error.message)
            } else {
                toast.success('Aktivasyon e-postası yeniden gönderildi!')
            }
        }
        setLoading(false)
    }

    return (
        <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-lg shadow-sm p-10 text-center border border-gray-100">

                {/* Icon */}
                <div className="w-20 h-20 bg-brand-accent/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                </div>

                {/* Title */}
                <h1 className="text-2xl font-bold text-brand-primary mb-3">
                    E-postanızı Doğrulayın
                </h1>

                {/* Description */}
                <p className="text-gray-500 leading-relaxed mb-2">
                    Kayıt işleminizi tamamlamak için e-posta adresinize bir aktivasyon bağlantısı gönderdik.
                </p>
                <p className="text-gray-500 leading-relaxed mb-8">
                    Lütfen gelen kutunuzu (veya spam klasörünüzü) kontrol edin.
                </p>

                {/* Info box */}
                <div className="bg-brand-accent/15 border border-brand-accent/40 rounded-lg p-4 mb-8 text-left">
                    <p className="text-sm text-brand-primary font-medium flex items-start gap-2">
                        <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        E-postanız birkaç dakika içinde ulaşmazsa spam klasörünüzü kontrol etmeyi unutmayın.
                    </p>
                </div>

                {/* Actions */}
                <div className="space-y-3">
                    <button
                        onClick={resendEmail}
                        disabled={loading}
                        className="w-full py-3.5 bg-brand-primary text-white rounded-lg font-bold hover:bg-brand-primary-dark transition-all disabled:opacity-50 text-sm shadow-sm hover:shadow-md flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Gönderiliyor...
                            </>
                        ) : (
                            <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                Aktivasyon Bağlantısını Yeniden Gönder
                            </>
                        )}
                    </button>
                    <Link
                        href="/giris"
                        className="block text-sm text-gray-400 hover:text-gray-600 transition-colors py-1"
                    >
                        Giriş sayfasına dön
                    </Link>
                </div>
            </div>
        </div>
    )
}
