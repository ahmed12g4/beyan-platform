export default function OfflinePage() {
    return (
        <main className="min-h-screen flex items-center justify-center bg-brand-primary-light px-4">
            <div className="text-center max-w-md mx-auto">
                {/* Animated WiFi icon */}
                <div className="w-24 h-24 bg-brand-primary/10 rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse">
                    <svg className="w-12 h-12 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                            d="M3 15.5c2.761-2.762 6.552-4.5 10.5-4.5s7.739 1.738 10.5 4.5M6.75 19.25c1.521-1.52 3.62-2.5 5.75-2.5s4.229.98 5.75 2.5M12 23h.01" />
                        <line x1="2" y1="2" x2="22" y2="22" strokeLinecap="round" />
                    </svg>
                </div>

                <h1 className="text-2xl font-bold text-brand-primary mb-3">
                    İnternet Bağlantısı Yok
                </h1>
                <p className="text-gray-500 text-sm leading-relaxed mb-8">
                    Şu an çevrimdışısınız. Önceden yüklenen içeriklere erişebilirsiniz,
                    ancak yeni içerikler için internet bağlantısı gereklidir.
                </p>

                <button
                    onClick={() => window.location.reload()}
                    className="bg-brand-primary text-white px-8 py-3 rounded-lg font-semibold hover:bg-brand-primary-dark transition-colors active:scale-95"
                >
                    Tekrar Dene
                </button>
            </div>
        </main>
    );
}
