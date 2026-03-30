'use client'

import { useEffect, useState, Suspense } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { initiateCheckoutAction } from '@/lib/actions/payment'
import toast from 'react-hot-toast'

function CheckoutContent() {
    const params = useParams()
    const searchParams = useSearchParams()
    const router = useRouter()
    const id = (params?.id as string) || searchParams?.get('id') || searchParams?.get('teacher_id')

    const type = (searchParams?.get('type') || 'course') as 'course' | 'package' | 'group'
    const lessons = searchParams?.get('lessons') ? parseInt(searchParams.get('lessons')!) : 0

    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function startCheckout() {
            if (!id) {
                toast.error('Geçersiz ürün.')
                router.push('/')
                return
            }

            try {
                const metadata = type === 'package' ? { lessons } : {}
                const result = await initiateCheckoutAction(id, type, metadata)

                if (result.success && result.url) {
                    router.push(result.url)
                } else {
                    toast.error(result.error || 'Ödeme başlatılamadı.')
                    // Redirect back based on type
                    if (type === 'group') router.push(`/groups/${id}`)
                    else if (type === 'package') router.push(`/teachers/${id}`)
                    else router.push(`/courses/${id}`)
                }
            } catch (error) {
                console.error('Checkout error:', error)
                toast.error('Bir hata oluştu.')
                router.push('/')
            }
        }

        startCheckout()
    }, [id, type, lessons, router])

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 pt-20">
            <div className="w-16 h-16 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin mb-6"></div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Güvenli Ödeme Sayfasına Yönlendiriliyorsunuz</h2>
            <p className="text-gray-500">Lütfen bekleyin, işleminiz hazırlanıyor...</p>
        </div>
    )
}

export default function CheckoutPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 pt-20">
                <div className="w-12 h-12 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin mb-4"></div>
            </div>
        }>
            <CheckoutContent />
        </Suspense>
    )
}
