'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { submitGeneralReviewAction } from '@/lib/actions/comments'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'react-hot-toast'
import Link from 'next/link'
import Avatar from '@/components/Avatar'

// ── Star rating descriptors ──
const STAR_META: Record<number, { label: string; color: string; bg: string; emoji: string }> = {
    1: { label: 'Çok Kötü', color: '#ef4444', bg: '#fef2f2', emoji: '😞' },
    2: { label: 'Kötü', color: '#f97316', bg: '#fff7ed', emoji: '😕' },
    3: { label: 'Orta', color: '#eab308', bg: '#fefce8', emoji: '😐' },
    4: { label: 'İyi', color: '#84cc16', bg: '#f7fee7', emoji: '😊' },
    5: { label: 'Mükemmel', color: '#22c55e', bg: '#f0fdf4', emoji: '🤩' },
}

export default function ReviewPage() {
    const router = useRouter()
    const { profile, loading: userLoading } = useCurrentUser()

    const [rating, setRating] = useState(0)
    const [hoveredRating, setHoveredRating] = useState(0)
    const [content, setContent] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [submitted, setSubmitted] = useState(false)

    // Check if student already has a review (lifetime limit)
    const [alreadyReviewed, setAlreadyReviewed] = useState<'pending' | 'approved' | false>(false)
    const [checkingReview, setCheckingReview] = useState(true)

    useEffect(() => {
        if (userLoading) return
        const check = async () => {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) { setCheckingReview(false); return }

            const { data } = await supabase
                .from('comments')
                .select('id, is_approved')
                .eq('user_id', user.id)
                .is('course_id', null)
                .maybeSingle()

            if (data) {
                setAlreadyReviewed((data as any).is_approved ? 'approved' : 'pending')
            }
            setCheckingReview(false)
        }
        check()
    }, [userLoading])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (rating === 0) { toast.error('Lütfen bir puan seçin.'); return }
        if (content.trim().length < 10) { toast.error('Yorum en az 10 karakter olmalıdır.'); return }

        setSubmitting(true)
        try {
            const result = await submitGeneralReviewAction({ content, rating })
            if (result.success) {
                setSubmitted(true)
            } else {
                toast.error(result.error || 'Bir hata oluştu.')
            }
        } catch {
            toast.error('Bir hata oluştu. Lütfen tekrar deneyin.')
        } finally {
            setSubmitting(false)
        }
    }

    const activeMeta = STAR_META[hoveredRating || rating]
    const displayName = profile?.full_name || 'Öğrenci'
    const firstName = displayName.split(' ')[0]

    // ─── Loading ───
    if (userLoading || checkingReview) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="text-center">
                    <svg className="animate-spin h-8 w-8 text-brand-primary mx-auto mb-3" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <p className="text-sm text-gray-400 font-medium">Yükleniyor...</p>
                </div>
            </div>
        )
    }

    // ─── Already Reviewed State ───
    if (alreadyReviewed) {
        return (
            <div className="max-w-xl mx-auto px-4 py-12 animate-fadeIn">
                <div className="bg-white rounded-lg overflow-hidden border border-gray-100 shadow-sm">
                    {/* Top banner */}
                    <div className="h-2 bg-gradient-to-r from-brand-primary to-[#2a7a76]" />
                    <div className="p-10 text-center">
                        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5"
                            style={{ background: alreadyReviewed === 'approved' ? '#f0fdf4' : '#fffbeb' }}>
                            <span className="text-4xl">{alreadyReviewed === 'approved' ? '✅' : '⏳'}</span>
                        </div>
                        <h1 className="text-2xl font-bold text-brand-primary mb-3">
                            {alreadyReviewed === 'approved' ? 'Değerlendirmeniz Yayında!' : 'Değerlendirme Beklemede'}
                        </h1>
                        <p className="text-gray-500 text-sm leading-relaxed mb-8 max-w-sm mx-auto">
                            {alreadyReviewed === 'approved'
                                ? 'Daha önce gönderdiğiniz değerlendirme onaylanmış ve ana sayfamızda yayınlanıyor. Teşekkür ederiz! 🙏'
                                : 'Daha önce bir değerlendirme gönderdiniz. Yönetici onayı bekleniyor. Her öğrenci yalnızca bir kez değerlendirme yapabilir.'
                            }
                        </p>
                        <Link
                            href="/student"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-brand-primary text-white rounded-lg font-bold text-sm hover:bg-brand-primary-dark transition-colors"
                        >
                            <i className="fas fa-arrow-left text-xs" />
                            Panelime Dön
                        </Link>
                    </div>
                </div>
            </div>
        )
    }

    // ─── Submitted Success State ───
    if (submitted) {
        return (
            <div className="max-w-xl mx-auto px-4 py-12 animate-fadeIn">
                <div className="bg-white rounded-lg overflow-hidden border border-gray-100 shadow-sm">
                    <div className="h-2 bg-gradient-to-r from-[#22c55e] to-[#16a34a]" />
                    <div className="p-10 text-center">
                        {/* Confetti-like stars */}
                        <div className="relative w-24 h-24 mx-auto mb-6">
                            <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center">
                                <svg className="w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <span className="absolute -top-1 -right-1 text-2xl animate-bounce">⭐</span>
                        </div>

                        <h1 className="text-2xl font-bold text-brand-primary mb-2">
                            Teşekkürler, {firstName}! 🎉
                        </h1>
                        <p className="text-gray-500 text-sm leading-relaxed mb-3">
                            Değerlendirmeniz başarıyla gönderildi.
                        </p>
                        <p className="text-xs text-gray-400 mb-6">
                            Yönetici onayından sonra ana sayfamızda görünecektir.
                        </p>

                        {/* Preview of submitted rating */}
                        <div className="inline-flex flex-col items-center bg-gray-50 rounded-lg px-6 py-4 mb-8 border border-gray-100">
                            <div className="flex gap-1 text-2xl mb-1">
                                {[1, 2, 3, 4, 5].map(s => (
                                    <span key={s} className={s <= rating ? 'text-brand-accent' : 'text-gray-200'}>★</span>
                                ))}
                            </div>
                            <span className="text-xs text-gray-500 font-medium">{STAR_META[rating]?.label}</span>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <Link href="/student" className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-brand-primary text-white rounded-lg font-bold text-sm hover:bg-brand-primary-dark transition-colors">
                                <i className="fas fa-home text-xs" />
                                Panelime Dön
                            </Link>
                            <Link href="/student/courses" className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-bold text-sm hover:bg-gray-200 transition-colors">
                                <i className="fas fa-book text-xs" />
                                Kurslarım
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // ─── Review Form ───
    return (
        <div className="max-w-2xl mx-auto px-4 py-8 animate-fadeIn">
            {/* Back button */}
            <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-sm text-gray-400 hover:text-brand-primary transition-colors mb-6 group"
            >
                <i className="fas fa-arrow-left text-xs group-hover:-translate-x-0.5 transition-transform" />
                Panelime Dön
            </button>

            <div className="bg-white rounded-lg overflow-hidden border border-gray-100 shadow-sm">
                {/* Top accent bar */}
                <div className="h-1.5 bg-gradient-to-r from-brand-primary via-[#2a7a76] to-[#FEDD59]" />

                <div className="p-8 sm:p-10">
                    {/* ── Header ── */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-14 h-14 bg-brand-accent/15 rounded-lg mb-4">
                            <span className="text-2xl">⭐</span>
                        </div>
                        <h1 className="text-2xl font-bold text-brand-primary mb-1.5">
                            Deneyimini Değerlendir
                        </h1>
                        <p className="text-gray-400 text-sm">
                            Onaylandıktan sonra ana sayfamızda yayınlanacak · Her hesap yalnızca <strong className="text-gray-600">1 değerlendirme</strong> yapabilir
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-7">

                        {/* ── Author Preview Card ── */}
                        <div className="flex items-center gap-4 p-4 bg-[#F8F9FA] rounded-lg border border-gray-100">
                            <Avatar
                                src={profile?.avatar_url || undefined}
                                name={displayName}
                                size={44}
                                className="ring-2 ring-white shadow-sm shrink-0"
                            />
                            <div className="min-w-0">
                                <p className="font-bold text-brand-primary text-sm truncate">{displayName}</p>
                                <p className="text-xs text-gray-400 mt-0.5">Yorumda bu isim görünecek</p>
                            </div>
                            <div className="ml-auto shrink-0">
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-brand-primary/8 text-brand-primary text-[11px] font-bold rounded-full">
                                    <i className="fas fa-lock text-[9px]" />
                                    Profil adı
                                </span>
                            </div>
                        </div>

                        {/* ── Star Rating ── */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-4 text-center">
                                Puanın <span className="text-red-400">*</span>
                            </label>

                            {/* Stars */}
                            <div className="flex justify-center gap-1.5 sm:gap-2 mb-3">
                                {[1, 2, 3, 4, 5].map((star) => {
                                    const isActive = star <= (hoveredRating || rating)
                                    return (
                                        <button
                                            key={star}
                                            type="button"
                                            onClick={() => setRating(star)}
                                            onMouseEnter={() => setHoveredRating(star)}
                                            onMouseLeave={() => setHoveredRating(0)}
                                            className="text-5xl sm:text-6xl transition-all duration-100 hover:scale-110 active:scale-90 focus:outline-none leading-none"
                                            aria-label={`${star} yıldız — ${STAR_META[star].label}`}
                                        >
                                            <span style={{ color: isActive ? '#FEDD59' : '#e5e7eb', filter: isActive ? 'drop-shadow(0 1px 3px rgba(254,221,89,0.5))' : 'none' }}>
                                                ★
                                            </span>
                                        </button>
                                    )
                                })}
                            </div>

                            {/* Rating label badge */}
                            <div className="flex justify-center h-8">
                                {activeMeta && (
                                    <div
                                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold transition-all"
                                        style={{ background: activeMeta.bg, color: activeMeta.color }}
                                    >
                                        <span>{activeMeta.emoji}</span>
                                        <span>{activeMeta.label}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* ── Comment Textarea ── */}
                        <div>
                            <div className="flex items-baseline justify-between mb-2">
                                <label htmlFor="review-content" className="text-sm font-bold text-gray-700">
                                    Yorumun <span className="text-red-400">*</span>
                                </label>
                                <span className={`text-xs font-medium transition-colors ${content.length === 0 ? 'text-gray-300'
                                    : content.length < 10 ? 'text-red-400'
                                        : 'text-green-500'
                                    }`}>
                                    {content.length}/500
                                </span>
                            </div>
                            <textarea
                                id="review-content"
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                rows={5}
                                maxLength={500}
                                className="w-full px-4 py-3.5 text-sm rounded-lg border border-gray-200 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/15 outline-none transition-all resize-none leading-relaxed placeholder:text-gray-300"
                                placeholder="Beyan Dil Akademi'deki deneyimini anlat...&#10;Öğretmenler nasıldı? Dersler faydalı oldu mu? Neler öğrendin?"
                                required
                            />
                            {content.length > 0 && content.length < 10 && (
                                <p className="text-xs text-red-400 mt-1.5 flex items-center gap-1">
                                    <i className="fas fa-exclamation-circle text-[10px]" />
                                    En az 10 karakter gerekli ({10 - content.length} karakter daha)
                                </p>
                            )}
                            {content.length >= 10 && (
                                <p className="text-xs text-green-500 mt-1.5 flex items-center gap-1">
                                    <i className="fas fa-check-circle text-[10px]" />
                                    Harika, devam edebilirsin!
                                </p>
                            )}
                        </div>

                        {/* ── Preview Card ── */}
                        {content.length >= 10 && rating > 0 && (
                            <div className="bg-gradient-to-br from-brand-primary/4 to-[#FEDD59]/5 rounded-lg p-5 border border-brand-primary/10 animate-fadeIn">
                                <p className="text-xs font-bold text-brand-primary uppercase tracking-wide mb-3 flex items-center gap-1.5">
                                    <i className="fas fa-eye text-[10px]" />
                                    Önizleme — Ana sayfada şöyle görünecek
                                </p>
                                <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                                    <div className="flex items-center gap-3 mb-3">
                                        <Avatar src={profile?.avatar_url || undefined} name={displayName} size={36} className="ring-2 ring-white" />
                                        <div>
                                            <p className="font-bold text-gray-900 text-sm">{displayName}</p>
                                            <div className="flex gap-0.5 mt-0.5">
                                                {[1, 2, 3, 4, 5].map(s => (
                                                    <span key={s} className={`text-xs ${s <= rating ? 'text-brand-accent' : 'text-gray-200'}`}>★</span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-600 leading-relaxed line-clamp-3 italic">&ldquo;{content}&rdquo;</p>
                                </div>
                            </div>
                        )}

                        {/* ── Submit ── */}
                        <button
                            type="submit"
                            disabled={submitting || rating === 0 || content.trim().length < 10}
                            className="w-full py-4 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2.5 shadow-sm"
                            style={{
                                background: (rating === 0 || content.trim().length < 10)
                                    ? '#e5e7eb'
                                    : 'linear-gradient(135deg, #204544 0%, #2a7a76 100%)',
                                color: (rating === 0 || content.trim().length < 10) ? '#9ca3af' : '#ffffff',
                                cursor: (rating === 0 || content.trim().length < 10) ? 'not-allowed' : 'pointer',
                                boxShadow: (rating === 0 || content.trim().length < 10) ? 'none' : '0 4px 15px rgba(32,69,68,0.25)',
                            }}
                        >
                            {submitting ? (
                                <>
                                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Gönderiliyor...
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-paper-plane" />
                                    Değerlendirimi Gönder
                                </>
                            )}
                        </button>

                    </form>
                </div>
            </div>
        </div>
    )
}
