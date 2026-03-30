'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function EmailConfirmedPage() {
    const router = useRouter()
    const [countdown, setCountdown] = useState(5)
    const [userRole, setUserRole] = useState<string>('student')
    const [shouldRedirect, setShouldRedirect] = useState(false)

    const getDashboardUrl = useCallback(() => {
        const map: Record<string, string> = {
            admin: '/admin',
            teacher: '/teacher',
            student: '/student',
        }
        return map[userRole] || '/student'
    }, [userRole])

    // Fetch the user's role
    useEffect(() => {
        async function getRole() {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', user.id)
                    .single()
                if (profile?.role) {
                    setUserRole(profile.role)
                }
            }
        }
        getRole()
    }, [])

    // Countdown timer
    useEffect(() => {
        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(timer)
                    setShouldRedirect(true)
                    return 0
                }
                return prev - 1
            })
        }, 1000)

        return () => clearInterval(timer)
    }, [])

    // Redirect when countdown reaches 0 (separate from setState)
    useEffect(() => {
        if (shouldRedirect) {
            router.push(getDashboardUrl())
        }
    }, [shouldRedirect, router, getDashboardUrl])

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#f0f9f8] via-white to-[#e8f5f3] flex items-center justify-center p-4">
            <div className="max-w-md w-full text-center">
                {/* Logo */}
                <div className="mb-8">
                    <Link href="/" className="inline-block">
                        <div className="relative w-16 h-16 mx-auto mb-4">
                            <Image
                                src="/assets/logo-new.png"
                                alt="Beyan Dil Akademi"
                                fill
                                className="object-contain"
                                sizes="64px"
                            />
                        </div>
                    </Link>
                </div>

                {/* Success Card */}
                <div className="bg-white rounded-lg shadow-xl border border-gray-100 p-8 relative overflow-hidden">
                    {/* Decorative gradient bar */}
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-brand-primary via-[#2a6b6a] to-[#FEDD59]"></div>

                    {/* Animated checkmark */}
                    <div className="w-20 h-20 mx-auto mb-6 relative">
                        <div className="absolute inset-0 bg-green-100 rounded-full animate-ping opacity-30"></div>
                        <div className="relative w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg shadow-green-200">
                            <svg
                                className="w-10 h-10 text-white"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                style={{
                                    animation: 'checkmark 0.6s ease-in-out forwards',
                                    strokeDasharray: 30,
                                    strokeDashoffset: 30,
                                }}
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={3}
                                    d="M5 13l4 4L19 7"
                                />
                            </svg>
                        </div>
                    </div>

                    {/* Title */}
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        E-posta Doğrulandı! ✨
                    </h1>
                    <p className="text-gray-600 mb-6">
                        Hesabınız başarıyla aktifleştirildi. Artık tüm derslere ve içeriklere erişebilirsiniz.
                    </p>

                    {/* Countdown */}
                    <div className="bg-[#f0f9f8] rounded-lg p-4 mb-6">
                        <p className="text-sm text-brand-primary">
                            <span className="font-semibold">{countdown}</span> saniye içinde panele yönlendirileceksiniz...
                        </p>
                        <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-brand-primary to-[#2a6b6a] rounded-full transition-all duration-1000 ease-linear"
                                style={{ width: `${((5 - countdown) / 5) * 100}%` }}
                            ></div>
                        </div>
                    </div>

                    {/* CTA Button */}
                    <Link
                        href={getDashboardUrl()}
                        className="inline-flex items-center justify-center w-full gap-2 px-6 py-3.5 bg-brand-primary text-white font-semibold rounded-lg hover:bg-brand-primary-dark transition-all duration-200 shadow-lg shadow-[#204544]/25 hover:shadow-xl hover:shadow-[#204544]/30 hover:-translate-y-0.5"
                    >
                        <span>Panele Git</span>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                    </Link>
                </div>

                {/* Footer note */}
                <p className="mt-6 text-xs text-gray-400">
                    Beyan Dil Akademi — Modern Arapça Eğitimi
                </p>
            </div>

            {/* CSS Animation for checkmark */}
            <style jsx>{`
                @keyframes checkmark {
                    to {
                        stroke-dashoffset: 0;
                    }
                }
            `}</style>
        </div>
    )
}
