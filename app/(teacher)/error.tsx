'use client'

// Teacher dashboard error boundary
export default function TeacherError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    return (
        <div className="min-h-[60vh] flex items-center justify-center px-4">
            <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-10 max-w-md w-full text-center">
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-5">
                    <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                    </svg>
                </div>
                <h2 className="text-xl font-bold text-brand-primary mb-2">Bir hata oluştu</h2>
                <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                    Sayfa yüklenirken beklenmedik bir sorun meydana geldi. Lütfen tekrar deneyin.
                </p>
                {process.env.NODE_ENV === 'development' && error.message && (
                    <pre className="text-left text-xs bg-gray-50 rounded-lg p-4 mb-6 overflow-auto text-red-500 border border-red-100 max-h-32">
                        {error.message}
                    </pre>
                )}
                <button
                    onClick={reset}
                    className="px-6 py-3 bg-brand-primary text-white rounded-lg font-bold text-sm hover:bg-brand-primary-dark transition-colors"
                >
                    Tekrar Dene
                </button>
            </div>
        </div>
    )
}
