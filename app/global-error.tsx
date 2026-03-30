'use client'

// Global error boundary - catches errors in the root layout itself
// This overrides the default Next.js error page for the entire application
export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    return (
        <html lang="tr">
            <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', background: '#f9fafa' }}>
                <div style={{
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '1rem',
                }}>
                    <div style={{
                        background: '#fff',
                        borderRadius: '1.5rem',
                        border: '1px solid #f0f0f0',
                        boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
                        padding: '2.5rem',
                        maxWidth: '420px',
                        width: '100%',
                        textAlign: 'center',
                    }}>
                        <div style={{
                            width: 64, height: 64,
                            background: '#fef2f2',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 1.5rem',
                        }}>
                            <svg width="32" height="32" fill="none" stroke="#f87171" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                    d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                            </svg>
                        </div>
                        <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#204544', marginBottom: '0.5rem' }}>
                            Beklenmedik bir hata oluştu
                        </h1>
                        <p style={{ color: '#9ca3af', fontSize: '0.875rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
                            Uygulama yüklenirken bir sorun meydana geldi. Lütfen sayfayı yenileyin.
                        </p>
                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                            <button
                                onClick={reset}
                                style={{
                                    padding: '0.75rem 1.5rem',
                                    background: '#204544',
                                    color: '#fff',
                                    borderRadius: '0.75rem',
                                    fontWeight: 700,
                                    fontSize: '0.875rem',
                                    border: 'none',
                                    cursor: 'pointer',
                                }}
                            >
                                Tekrar Dene
                            </button>
                            <a
                                href="/"
                                style={{
                                    padding: '0.75rem 1.5rem',
                                    background: '#f3f4f6',
                                    color: '#374151',
                                    borderRadius: '0.75rem',
                                    fontWeight: 700,
                                    fontSize: '0.875rem',
                                    textDecoration: 'none',
                                    display: 'inline-block',
                                }}
                            >
                                Ana Sayfa
                            </a>
                        </div>
                    </div>
                </div>
            </body>
        </html>
    )
}
