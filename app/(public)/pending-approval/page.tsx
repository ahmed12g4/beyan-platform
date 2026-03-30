'use client'

import Link from 'next/link'

export default function PendingApprovalPage() {
    return (
        <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-lg shadow-sm p-10 text-center border border-gray-100">

                {/* Icon */}
                <div className="w-20 h-20 bg-brand-primary/8 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>

                {/* Title */}
                <h1 className="text-2xl font-bold text-brand-primary mb-3">
                    Başvurunuz İnceleniyor
                </h1>

                {/* Description */}
                <p className="text-gray-500 leading-relaxed mb-2">
                    Beyan Dil Akademi&apos;ye eğitmen olarak başvurduğunuz için teşekkür ederiz.
                </p>
                <p className="text-gray-500 leading-relaxed mb-8">
                    Hesabınız yönetim ekibimiz tarafından incelenmektedir.
                    Onaylandığında e-posta ile bilgilendirileceksiniz.
                </p>

                {/* Info box */}
                <div className="bg-brand-accent/15 border border-brand-accent/40 rounded-lg p-4 mb-8 text-left">
                    <p className="text-sm text-brand-primary font-medium flex items-start gap-2">
                        <svg className="w-4 h-4 mt-0.5 shrink-0 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Onay süreci genellikle <strong>1-3 iş günü</strong> içinde tamamlanmaktadır.
                        Spam klasörünüzü de kontrol etmeyi unutmayın.
                    </p>
                </div>

                {/* Actions */}
                <div className="space-y-3">
                    <Link
                        href="/"
                        className="flex items-center justify-center gap-2 w-full py-3.5 bg-brand-primary text-white rounded-lg font-bold hover:bg-brand-primary-dark transition-all text-sm shadow-sm hover:shadow-md"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        Ana Sayfaya Dön
                    </Link>
                    <Link
                        href="/giris"
                        className="block text-sm text-gray-400 hover:text-gray-600 transition-colors py-1"
                    >
                        Giriş sayfasına git
                    </Link>
                </div>
            </div>
        </div>
    )
}
