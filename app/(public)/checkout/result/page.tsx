'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { verifyPaymentAction } from '@/lib/actions/payment'

export default function CheckoutResultPage() {
    const searchParams = useSearchParams()
    const router = useRouter()

    // We expect ?token=transactionId&status=success
    const token = searchParams.get('token')
    const status = searchParams.get('status')

    const [verifying, setVerifying] = useState(true)
    const [result, setResult] = useState<{ success: boolean; message?: string; courseId?: string; type?: string } | null>(null)

    useEffect(() => {
        if (!token) {
            setVerifying(false)
            setResult({ success: false, message: 'Geçersiz işlem parametreleri.' })
            return
        }

        const verify = async () => {
            try {
                // Call server action to verify
                const verification = await verifyPaymentAction(token)
                setResult(verification as any)

                if (verification.success) {
                    const type = (verification as any).type || 'course'

                    // Specific Redirect logic
                    setTimeout(() => {
                        if (type === 'course' && verification.courseId) {
                            router.push(`/student/my-lessons?tab=courses`)
                        } else if (type === 'group') {
                            router.push(`/student/my-lessons?tab=groups`)
                        } else if (type === 'package') {
                            router.push(`/student/my-lessons?tab=private`)
                        } else {
                            router.push(`/student/my-lessons`)
                        }
                    }, 3000)
                }
            } catch (error) {
                setResult({ success: false, message: 'Doğrulama hatası oluştu.' })
            } finally {
                setVerifying(false)
            }
        }

        verify()
    }, [token, router])

    const getDashboardLink = () => {
        const type = result?.type || 'course'
        if (type === 'course') return '/student/my-lessons?tab=courses'
        if (type === 'group') return '/student/my-lessons?tab=groups'
        if (type === 'package') return '/student/my-lessons?tab=private'
        return '/student/my-lessons'
    }

    const getButtonText = () => {
        const type = result?.type || 'course'
        if (type === 'course') return 'Kursa Git'
        if (type === 'group') return 'Grubuma Git'
        if (type === 'package') return 'Özel Derslerime Git'
        return 'Eğitimlerime Git'
    }

    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-4 text-center">
            {verifying ? (
                <div className="animate-fadeIn">
                    <div className="w-16 h-16 border-4 border-gray-200 border-t-[#204544] rounded-full animate-spin mx-auto mb-6"></div>
                    <h2 className="text-xl font-semibold text-gray-900">Ödeme Doğrulanıyor...</h2>
                    <p className="text-gray-500 mt-2">Lütfen bekleyin, işleminiz kontrol ediliyor.</p>
                </div>
            ) : result?.success ? (
                <div className="animate-scaleIn max-w-md w-full bg-white p-8 rounded-lg border-2 border-green-100 shadow-xl">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600 text-3xl">
                        <i className="fas fa-check"></i>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Ödeme Başarılı!</h2>
                    <p className="text-gray-600 mb-8">{result.message}</p>

                    <div className="space-y-3">
                        <Link
                            href={getDashboardLink()}
                            className="block w-full py-3 bg-brand-primary text-white rounded-lg font-bold hover:bg-brand-primary-dark transition-colors"
                        >
                            {getButtonText()}
                        </Link>
                        <p className="text-xs text-gray-400">
                            3 saniye içinde otomatik yönlendirileceksiniz...
                        </p>
                    </div>
                </div>
            ) : (
                <div className="animate-scaleIn max-w-md w-full bg-white p-8 rounded-lg border-2 border-red-100 shadow-xl">
                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6 text-red-600 text-3xl">
                        <i className="fas fa-times"></i>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Ödeme Başarısız/Hatalı</h2>
                    <p className="text-gray-600 mb-8">{result?.message || 'İşlem tamamlanamadı.'}</p>

                    <Link
                        href="/"
                        className="block w-full py-3 bg-gray-100 text-gray-700 rounded-lg font-bold hover:bg-gray-200 transition-colors"
                    >
                        Ana Sayfaya Dön
                    </Link>
                </div>
            )}
        </div>
    )
}
