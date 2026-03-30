'use client'

import { Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'

function FailedContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const error = searchParams.get('error')

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50/50 p-4">
            <div className="max-w-md w-full bg-white rounded-[40px] shadow-2xl shadow-brand-primary/10 border border-gray-50 p-12 text-center animate-fadeIn">
                <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-8">
                    <i className="fas fa-times text-4xl text-red-500"></i>
                </div>

                <h1 className="text-3xl font-black text-brand-primary uppercase tracking-tight mb-4">Ödeme Başarısız</h1>
                <p className="text-gray-500 font-medium mb-8">
                    {error || 'Bir hata oluştu ve ödeme işleminiz tamamlanamadı. Lütfen bilgilerinizi kontrol edip tekrar deneyin.'}
                </p>

                <div className="space-y-4">
                    <button
                        onClick={() => router.back()}
                        className="block w-full py-5 bg-brand-primary text-white rounded-2xl text-sm font-black uppercase tracking-widest shadow-xl shadow-brand-primary/20 hover:bg-brand-primary-dark hover:-translate-y-1 transition-all active:scale-95"
                    >
                        Tekrar Dene
                    </button>
                    <Link
                        href="/"
                        className="block w-full py-4 text-gray-400 text-xs font-black uppercase tracking-widest hover:text-gray-600 transition-all font-bold"
                    >
                        Ana Sayfaya Dön
                    </Link>
                </div>
            </div>
        </div>
    )
}

export default function PaymentFailedPage() {
    return (
        <Suspense fallback={null}>
            <FailedContent />
        </Suspense>
    )
}
