'use client'

import { useState, useEffect } from 'react'
import { getAllPayments } from '@/lib/actions/admin-payments'

interface Payment {
    id: string
    user_id: string
    product_type: string
    product_id: string
    amount: number
    currency: string
    status: 'success' | 'failed' | 'pending'
    iyzico_payment_id?: string
    error_message?: string
    created_at: string
    user?: {
        full_name: string
        email: string
    }
}

export default function AdminPaymentsPage() {
    const [payments, setPayments] = useState<Payment[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [filterStatus, setFilterStatus] = useState<string>('all')

    useEffect(() => {
        async function fetchPayments() {
            setLoading(true)
            const result = await getAllPayments()
            if (result.success) {
                setPayments(result.data as Payment[])
            }
            setLoading(false)
        }
        fetchPayments()
    }, [])

    const filteredPayments = payments.filter(payment => {
        const matchesSearch = 
            payment.user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            payment.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            payment.iyzico_payment_id?.toLowerCase().includes(searchTerm.toLowerCase())
            
        const matchesStatus = filterStatus === 'all' || payment.status === filterStatus
        
        return matchesSearch && matchesStatus
    })

    const totalRevenue = payments
        .filter(p => p.status === 'success')
        .reduce((sum, p) => sum + Number(p.amount), 0)

    if (loading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center">
                <div className="w-12 h-12 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin mb-4"></div>
                <p className="text-gray-500 font-medium">Ödemeler Yükleniyor...</p>
            </div>
        )
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12" dir="rtl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <h1 className="text-3xl font-bold text-gray-900 border-r-4 border-brand-accent pr-4">Ödemeler ve İşlemler</h1>
                
                <div className="bg-white px-6 py-3 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Toplam Gelir (Başarılı)</p>
                        <p className="text-xl font-black text-green-600">{totalRevenue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                        <i className="fas fa-wallet"></i>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-[32px] p-6 sm:p-8 border border-gray-100 shadow-xl shadow-gray-200/40">
                
                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                    <div className="flex-1 relative">
                        <i className="fas fa-search absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
                        <input
                            type="text"
                            placeholder="Alıcı adı, e-posta veya İşlem ID ile ara..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all text-sm"
                        />
                    </div>
                    
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all text-sm min-w-[160px]"
                    >
                        <option value="all">Tüm Durumlar</option>
                        <option value="success">Başarılı</option>
                        <option value="pending">Bekliyor</option>
                        <option value="failed">Başarısız</option>
                    </select>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-right border-collapse">
                        <thead>
                            <tr className="border-b-2 border-gray-100">
                                <th className="pb-4 pt-2 font-bold text-gray-400 text-sm w-[35%]">Alıcı Bilgileri</th>
                                <th className="pb-4 pt-2 font-bold text-gray-400 text-sm">Ürün/Hizmet</th>
                                <th className="pb-4 pt-2 font-bold text-gray-400 text-sm">Tutar</th>
                                <th className="pb-4 pt-2 font-bold text-gray-400 text-sm">Durum</th>
                                <th className="pb-4 pt-2 font-bold text-gray-400 text-sm">Tarih</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredPayments.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-12 text-center text-gray-500">
                                        <div className="flex flex-col items-center justify-center">
                                            <i className="fas fa-receipt text-4xl text-gray-300 mb-3"></i>
                                            <p>İşlem bulunamadı.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredPayments.map(payment => (
                                    <tr key={payment.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="py-4">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-gray-900">{payment.user?.full_name || 'Bilinmeyen Kullanıcı'}</span>
                                                <span className="text-xs text-gray-500">{payment.user?.email || '-'}</span>
                                                {payment.iyzico_payment_id && (
                                                    <span className="text-[10px] text-gray-400 mt-1 font-mono">ID: {payment.iyzico_payment_id}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-4">
                                            <span className="px-2.5 py-1 text-xs font-bold text-blue-700 bg-blue-50 rounded-md uppercase tracking-wider">
                                                {payment.product_type === 'course' ? 'Kurs' : 
                                                 payment.product_type === 'package' ? 'Paket' : 
                                                 payment.product_type === 'group' ? 'Grup' : payment.product_type}
                                            </span>
                                        </td>
                                        <td className="py-4 font-black tracking-tight text-gray-900">
                                            {Number(payment.amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {payment.currency}
                                        </td>
                                        <td className="py-4">
                                            <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full inline-flex items-center gap-1.5 ${
                                                payment.status === 'success' ? 'bg-green-100 text-green-700' :
                                                payment.status === 'failed' ? 'bg-red-100 text-red-700' :
                                                'bg-amber-100 text-amber-700'
                                            }`}>
                                                {payment.status === 'success' && <i className="fas fa-check-circle"></i>}
                                                {payment.status === 'failed' && <i className="fas fa-times-circle"></i>}
                                                {payment.status === 'pending' && <i className="fas fa-clock"></i>}
                                                
                                                {payment.status === 'success' ? 'Başarılı' : 
                                                 payment.status === 'failed' ? 'Başarısız' : 'Bekliyor'}
                                            </span>
                                            {payment.error_message && (
                                                <p className="text-[10px] text-red-500 mt-1 max-w-[150px] truncate" title={payment.error_message}>
                                                    {payment.error_message}
                                                </p>
                                            )}
                                        </td>
                                        <td className="py-4 text-sm text-gray-500 whitespace-nowrap">
                                            {new Date(payment.created_at).toLocaleDateString('tr-TR', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
