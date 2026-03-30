import Link from 'next/link'

export default function BlogPostNotFound() {
    return (
        <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-lg shadow-sm p-10 text-center border border-gray-100">
                <div className="w-16 h-16 bg-brand-primary/8 rounded-full flex items-center justify-center mx-auto mb-5">
                    <svg className="w-8 h-8 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                </div>
                <h1 className="text-2xl font-bold text-brand-primary mb-2">Yazı Bulunamadı</h1>
                <p className="text-gray-500 mb-8 text-sm leading-relaxed">
                    Aradığınız blog yazısı mevcut değil veya yayından kaldırılmış olabilir.
                </p>
                <Link
                    href="/blog"
                    className="inline-flex items-center gap-2 bg-brand-primary text-white px-6 py-3 rounded-lg font-bold text-sm hover:bg-brand-primary-dark transition-all shadow-sm hover:shadow-md"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Tüm Yazılara Dön
                </Link>
            </div>
        </div>
    )
}
