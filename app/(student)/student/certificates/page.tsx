'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useCurrentUser } from '@/hooks/useCurrentUser'

export default function StudentCertificatesPage() {
    const { user, loading: authLoading } = useCurrentUser()
    const [certificates, setCertificates] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (authLoading || !user) return;

        async function fetchCertificates() {
            setLoading(true)
            const supabase = createClient()
            try {
                const { data } = await supabase
                    .from('certificates')
                    .select('*')
                    .eq('student_id', user!.id)
                    .order('issue_date', { ascending: false });

                setCertificates(data || [])
            } catch (err) {
                console.error("Error fetching certificates:", err)
            } finally {
                setLoading(false)
            }
        }

        fetchCertificates()
    }, [user, authLoading])

    if (authLoading || loading) {
        return (
            <div className="max-w-6xl mx-auto px-4 py-12 flex flex-col items-center justify-center min-h-[60vh]">
                <div className="w-12 h-12 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin mb-4"></div>
                <p className="text-gray-500 font-medium tracking-tight">Certificates loading...</p>
            </div>
        )
    }

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12" dir="rtl">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold text-gray-900 text-right">Sertifikalarım</h1>
                <Link href="/student" className="text-sm font-medium text-brand-primary hover:underline flex flex-row-reverse items-center gap-1">
                    <i className="fas fa-arrow-right"></i> Panele Dön
                </Link>
            </div>

            {/* Certificates List */}
            {certificates.length === 0 ? (
                <div className="py-20 bg-white rounded-xl border-2 border-dashed border-gray-100 flex flex-col items-center justify-center">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-200 mb-6 shadow-sm border border-gray-100">
                        <i className="fas fa-award text-4xl"></i>
                    </div>
                    <p className="text-gray-500 font-bold text-lg">Henüz bir sertifikanız bulunmuyor</p>
                    <p className="text-gray-400 text-sm mt-2 max-w-xs text-center">Sertifika almak için kayıtlı bir kursu tamamlayın ve son dersi bitirin.</p>
                    <Link href="/student/my-lessons" className="mt-8 px-8 py-3 bg-brand-primary text-white rounded-xl font-bold text-sm hover:translate-y-[-2px] hover:shadow-lg transition-all active:scale-95">
                        Kurslarıma Göz At
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {certificates.map((cert) => (
                        <div key={cert.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:translate-y-[-4px] transition-all group overflow-hidden relative">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-brand-accent/5 rounded-bl-[80px] -z-0"></div>

                            <div className="w-14 h-14 bg-brand-primary/10 text-brand-primary rounded-xl flex items-center justify-center text-2xl mb-6 relative z-10 group-hover:scale-110 transition-transform duration-500">
                                <i className="fas fa-certificate"></i>
                            </div>

                            <h3 className="text-xl font-bold text-gray-900 mb-2 text-right relative z-10">{cert.course_name}</h3>
                            <div className="flex flex-row-reverse items-center justify-between text-xs text-gray-400 font-medium mb-6">
                                <span className="flex flex-row-reverse items-center gap-1">
                                    <i className="far fa-calendar-alt text-brand-accent"></i>
                                    {new Date(cert.issue_date).toLocaleDateString('tr-TR')}
                                </span>
                                <span className="flex flex-row-reverse items-center gap-1">
                                    <i className="fas fa-hashtag text-brand-accent text-[10px]"></i>
                                    {cert.unique_number}
                                </span>
                            </div>

                            <a
                                href={cert.certificate_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full flex items-center justify-center gap-2 py-3.5 bg-brand-primary text-white rounded-xl font-bold text-sm tracking-wide shadow-md group-hover:bg-brand-primary-dark transition-colors"
                            >
                                <i className="fas fa-download text-xs"></i>
                                Sertifikayı İndir (PDF)
                            </a>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
