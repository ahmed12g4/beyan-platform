'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { createIyzicoPaymentAction } from '@/lib/actions/payment-iyzico'
import { toast } from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'

function CheckoutContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const type = searchParams.get('type') as 'course' | 'package' | 'group'
    const productId = searchParams.get('productId')
    const lessonsCount = Number(searchParams.get('lessons')) || 4

    const [loading, setLoading] = useState(true)
    const [processing, setProcessing] = useState(false)
    const [product, setProduct] = useState<any>(null)
    const [formData, setFormData] = useState({
        cardHolderName: '',
        cardNumber: '',
        expiry: '',
        cvc: ''
    })

    useEffect(() => {
        async function fetchProduct() {
            if (!productId || !type) return router.push('/')

            const supabase = createClient()
            let data: any = null

            if (type === 'course') {
                const { data: c } = await (supabase.from('courses') as any).select('title, price, thumbnail_url, duration_weeks').eq('id', productId).maybeSingle()
                data = c
            } else if (type === 'group') {
                const { data: g } = await (supabase.from('groups') as any).select('title, price, thumbnail_url, lessons_count').eq('id', productId).maybeSingle()
                data = g
            } else if (type === 'package') {
                const { data: t } = await (supabase.from('profiles') as any)
                    .select('full_name, avatar_url, teachers(price_per_lesson)')
                    .eq('id', productId)
                    .maybeSingle()

                if (t) {
                    const pricePerLesson = t.teachers?.[0]?.price_per_lesson || 150;
                    data = {
                        title: `${t.full_name} - ${lessonsCount} Özel Ders`,
                        price: pricePerLesson * lessonsCount,
                        thumbnail_url: t.avatar_url,
                        is_teacher: true
                    }
                }
            }

            if (!data) {
                toast.error('Ürün bulunamadى')
                return router.push('/')
            }

            setProduct(data)
            setLoading(false)
        }

        fetchProduct()
    }, [productId, type, lessonsCount])

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target

        // Basic formatting for card number & expiry
        let formattedValue = value
        if (name === 'cardNumber') {
            formattedValue = value.replace(/\s?/g, '').replace(/(\d{4})/g, '$1 ').trim().substring(0, 19)
        } else if (name === 'expiry') {
            formattedValue = value.replace(/\//g, '').replace(/(\d{2})/, '$1/').substring(0, 5)
        } else if (name === 'cvc') {
            formattedValue = value.substring(0, 3)
        }

        setFormData(prev => ({ ...prev, [name]: formattedValue }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!product || processing) return

        const [month, year] = formData.expiry.split('/')
        if (!month || !year || year.length !== 2) {
            toast.error('Lütfen geçerli bir son kullanma tarihi girin (MM/YY)')
            return
        }

        setProcessing(true)
        try {
            const result = await createIyzicoPaymentAction(
                productId!,
                type,
                {
                    cardHolderName: formData.cardHolderName,
                    cardNumber: formData.cardNumber.replace(/\s/g, ''),
                    expireMonth: month,
                    expireYear: `20${year}`,
                    cvc: formData.cvc
                },
                lessonsCount
            )

            if (result.success) {
                toast.success(result.message || 'Ödeme başarılı!')
                router.push(`/payment-success?type=${type}&title=${encodeURIComponent(product.title)}`)
            } else {
                toast.error(result.error || 'Ödeme başarısız.')
                // Optionally redirect to failed page if we want more detail there
                // router.push(`/payment-failed?error=${encodeURIComponent(result.error || '')}`)
            }
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setProcessing(false)
        }
    }

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="w-10 h-10 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin"></div>
        </div>
    )

    return (
        <div className="min-h-screen bg-gray-50/50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 animate-fadeIn">

                {/* Product Summary */}
                <div className="space-y-8">
                    <div>
                        <h1 className="text-3xl font-black text-brand-primary uppercase tracking-tight mb-2">Sipariş Özeti</h1>
                        <p className="text-gray-500 font-medium">Satın alma işlemini tamamlamak üzeresiniz.</p>
                    </div>

                    <div className="bg-white rounded-3xl p-6 shadow-xl shadow-brand-primary/5 border border-gray-100 flex gap-6 items-center">
                        <div className="w-24 h-24 bg-gray-100 rounded-2xl overflow-hidden relative flex-shrink-0 border border-gray-100">
                            {product.thumbnail_url ? (
                                <Image src={product.thumbnail_url} alt={product.title} fill className="object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-300">
                                    <i className={`fas ${type === 'package' ? 'fa-user' : 'fa-graduation-cap'} text-2xl`}></i>
                                </div>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <span className="inline-block px-3 py-1 bg-brand-primary/10 text-brand-primary text-[10px] font-black uppercase tracking-widest rounded-full mb-2">
                                {type === 'course' ? 'ONLINE KURS' : type === 'group' ? 'STUDY GROUP' : 'ÖZEL DERS PAKETİ'}
                            </span>
                            <h2 className="text-xl font-bold text-gray-900 truncate mb-1">{product.title}</h2>
                            <div className="text-2xl font-black text-brand-primary tracking-tight">{product.price} TL</div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center text-sm font-medium py-4 border-b border-gray-100">
                            <span className="text-gray-400 uppercase tracking-widest text-[11px] font-black">Ara Toplam</span>
                            <span className="text-gray-900 font-bold">{product.price} TL</span>
                        </div>
                        <div className="flex justify-between items-center text-sm font-medium py-4 border-b border-gray-100">
                            <span className="text-gray-400 uppercase tracking-widest text-[11px] font-black">Vergiler</span>
                            <span className="text-gray-900 font-bold">Dahil</span>
                        </div>
                        <div className="flex justify-between items-center py-4">
                            <span className="text-gray-900 uppercase tracking-widest text-sm font-black">Toplam</span>
                            <span className="text-3xl font-black text-brand-primary">{product.price} TL</span>
                        </div>
                    </div>

                    <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 flex gap-4 text-blue-600">
                        <i className="fas fa-shield-alt text-xl mt-1"></i>
                        <p className="text-xs font-medium leading-relaxed">
                            Ödemeniz Iyzico güvencesiyle 256-bit SSL sertifikası ile korunmaktadır. Kart bilgileriniz asla sunucularımızda saklanmaz.
                        </p>
                    </div>
                </div>

                {/* Payment Form */}
                <div className="bg-white rounded-[40px] p-8 lg:p-12 shadow-2xl shadow-brand-primary/10 border border-gray-50">
                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Kart Üzerindeki İsim</label>
                                <input
                                    required
                                    name="cardHolderName"
                                    value={formData.cardHolderName}
                                    onChange={handleFormChange}
                                    placeholder="AD SOYAD"
                                    className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold placeholder:text-gray-300 outline-none focus:border-brand-primary focus:ring-8 focus:ring-brand-primary/5 transition-all uppercase"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Kart Numarası</label>
                                <div className="relative">
                                    <input
                                        required
                                        name="cardNumber"
                                        value={formData.cardNumber}
                                        onChange={handleFormChange}
                                        placeholder="0000 0000 0000 0000"
                                        className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold placeholder:text-gray-300 outline-none focus:border-brand-primary focus:ring-8 focus:ring-brand-primary/5 transition-all"
                                    />
                                    <div className="absolute right-6 top-1/2 -translate-y-1/2 flex gap-2">
                                        <i className="fab fa-cc-visa text-gray-300 text-xl"></i>
                                        <i className="fab fa-cc-mastercard text-gray-300 text-xl"></i>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Son Kullanma</label>
                                    <input
                                        required
                                        name="expiry"
                                        value={formData.expiry}
                                        onChange={handleFormChange}
                                        placeholder="AA/YY"
                                        className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold placeholder:text-gray-300 outline-none focus:border-brand-primary focus:ring-8 focus:ring-brand-primary/5 transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">CVC / CVV</label>
                                    <input
                                        required
                                        name="cvc"
                                        value={formData.cvc}
                                        onChange={handleFormChange}
                                        placeholder="000"
                                        className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold placeholder:text-gray-300 outline-none focus:border-brand-primary focus:ring-8 focus:ring-brand-primary/5 transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={processing}
                            className={`w-full py-5 bg-brand-primary text-white rounded-[20px] text-sm font-black uppercase tracking-widest shadow-xl shadow-brand-primary/20 hover:bg-brand-primary-dark hover:-translate-y-1 active:scale-95 transition-all flex items-center justify-center gap-3 ${processing ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {processing ? (
                                <i className="fas fa-spinner fa-spin"></i>
                            ) : (
                                <i className="fas fa-lock"></i>
                            )}
                            Ödemeyi Onayla - {product.price} TL
                        </button>

                        <div className="flex items-center justify-center gap-6 opacity-40">
                            <Image src="/iyzico-logo.png" alt="Iyzico" width={80} height={30} className="grayscale" />
                            <div className="w-px h-6 bg-gray-200"></div>
                            <div className="flex gap-2 text-gray-400 text-xl">
                                <i className="fab fa-cc-visa"></i>
                                <i className="fab fa-cc-mastercard"></i>
                                <i className="fab fa-cc-amex"></i>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default function CheckoutPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="w-10 h-10 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin"></div>
            </div>
        }>
            <CheckoutContent />
        </Suspense>
    )
}
