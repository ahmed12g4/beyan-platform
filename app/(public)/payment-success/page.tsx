'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

function SuccessContent() {
    const searchParams = useSearchParams()
    const type = searchParams.get('type')
    const title = searchParams.get('title')

    const getLink = () => {
        if (type === 'course') return '/dashboard/student/courses'
        if (type === 'group') return '/dashboard/student/groups'
        if (type === 'package') return '/dashboard/student/lessons' // Or back to teachers list
        return '/dashboard/student'
    }

    const getButtonText = () => {
        if (type === 'course') return 'Kursa Başla'
        if (type === 'group') return 'Gruba Git'
        if (type === 'package') return 'Ders Rezerve Et'
        return 'Panelime Dön'
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50/50 p-4">
            <div className="max-w-md w-full bg-white rounded-[40px] shadow-2xl shadow-brand-primary/10 border border-gray-50 p-12 text-center animate-fadeIn">
                <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce">
                    <i className="fas fa-check text-4xl text-green-500"></i>
                </div>

                <h1 className="text-3xl font-black text-brand-primary uppercase tracking-tight mb-4">Ödeme Başarılı!</h1>
                <p className="text-gray-500 font-medium mb-8">
                    <span className="font-bold text-gray-900">{title || 'Satın alma'}</span> işleminiz başarıyla tamamlandı. Artık içeriğe hemen erişebilirsin.
                </p>

                <div className="space-y-4">
                    <Link
                        href={getLink()}
                        className="block w-full py-5 bg-brand-primary text-white rounded-2xl text-sm font-black uppercase tracking-widest shadow-xl shadow-brand-primary/20 hover:bg-brand-primary-dark hover:-translate-y-1 transition-all active:scale-95"
                    >
                        {getButtonText()}
                    </Link>
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

export default function PaymentSuccessPage() {
    return (
        <Suspense fallback={null}>
            <SuccessContent />
        </Suspense>
    )
}
