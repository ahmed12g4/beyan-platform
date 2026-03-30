'use client'

import Link from 'next/link'
import PageHeader from '@/components/admin/PageHeader'

export default function TeacherAssignmentsPage() {
    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fadeIn text-center">
            <PageHeader 
                title="Ödev Yönetimi"
                subtitle="Bu özellik şu an için devre dışı bırakıldı"
            />
            
            <div className="mt-20 py-24 bg-white rounded-lg border-2 border-dashed border-gray-100 shadow-sm max-w-2xl mx-auto">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i className="fas fa-info-circle text-2xl text-gray-200"></i>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Ödev Yönetimi Kaldırıldı</h3>
                <p className="text-gray-400 text-xs max-w-xs mx-auto mb-8">Bu bölüm öğretmen isteği üzerine devre dışı bırakılmıştır.</p>
                <Link href="/teacher" className="h-10 px-8 bg-brand-primary text-white rounded-lg font-bold hover:bg-brand-primary-dark transition-all text-sm inline-flex items-center">
                    Panel'e Dön
                </Link>
            </div>
        </div>
    )
}
