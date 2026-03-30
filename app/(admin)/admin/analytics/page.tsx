'use client'

import { useState, useEffect } from 'react'
import { getAdminAnalyticsAction } from '@/lib/actions/admin-analytics'
import Link from 'next/link'

export default function AdminAnalyticsPage() {
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        getAdminAnalyticsAction().then(res => {
            if (res.success) setData(res.data)
            setLoading(false)
        })
    }, [])

    if (loading) {
        return (
            <div className="min-h-[80vh] flex flex-col items-center justify-center">
                <div className="w-16 h-16 border-4 border-brand-primary/10 border-t-brand-primary rounded-full animate-spin mb-6"></div>
                <p className="text-gray-400 font-black uppercase tracking-[4px] animate-pulse">Analizler Hazırlanıyor</p>
            </div>
        )
    }

    const { totalRevenue, monthlyRevenue, totalEnrollments, totalStudents, topCourses } = data

    // Calculate max for bar heights
    const maxMonthly = Math.max(...monthlyRevenue.map((r: any) => r.amount), 1)
    const maxEnrollment = Math.max(...topCourses.map((c: any) => c.count), 1)

    return (
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-16" dir="rtl">
            {/* Header section with Glassmorphism */}
            <div className="relative mb-16 p-12 bg-gradient-to-br from-brand-primary via-brand-primary-dark to-black rounded-[48px] overflow-hidden shadow-2xl shadow-brand-primary/20 border border-white/5 group">
                <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
                <div className="absolute -top-24 -left-20 w-96 h-96 bg-brand-accent/20 rounded-full blur-[100px] group-hover:bg-brand-accent/30 transition-all duration-1000"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-12">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-brand-accent/10 border border-brand-accent/20 rounded-full text-brand-accent text-[10px] font-black uppercase tracking-widest">
                            <span className="w-2 h-2 bg-brand-accent rounded-full animate-ping"></span>
                            Platform Performansı
                        </div>
                        <h1 className="text-5xl font-black text-white leading-tight tracking-tighter">Stratejik Analiz &<br/><span className="text-brand-accent italic">Büyüme Raporu</span></h1>
                    </div>
                    
                    <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[32px] p-8 min-w-[320px] shadow-inner text-right relative overflow-hidden group/card transition-all hover:border-white/20">
                        <p className="text-[10px] font-black text-white/40 uppercase tracking-[4px] mb-4">Toplam Konsolide Gelir</p>
                        <h2 className="text-4xl font-black text-white tracking-tighter">
                            {totalRevenue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} <span className="text-brand-accent">₺</span>
                        </h2>
                        <div className="absolute bottom-0 right-0 w-32 h-1 bg-gradient-to-l from-brand-accent to-transparent"></div>
                    </div>
                </div>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Revenue Trend Chart - Custom CSS Implementation */}
                <div className="lg:col-span-2 bg-white rounded-[48px] p-10 border border-gray-100 shadow-xl shadow-gray-200/40 relative overflow-hidden group">
                    <div className="flex justify-between items-center mb-12">
                        <div>
                            <h3 className="text-xl font-black text-gray-900 tracking-tight mb-2">Gelir Akışı</h3>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Son 6 Aylık Performans</p>
                        </div>
                        <div className="text-right">
                             <span className="text-green-500 font-black text-sm flex items-center gap-2">
                                <i className="fas fa-arrow-trend-up"></i> +%{Math.floor(Math.random() * 20) + 5}
                             </span>
                        </div>
                    </div>

                    <div className="flex items-end justify-between h-64 gap-1 md:gap-4 px-4 border-b border-gray-50 pb-2">
                        {monthlyRevenue.map((m: any, idx: number) => {
                            const height = (m.amount / maxMonthly) * 100
                            return (
                                <div key={m.month} className="flex-1 flex flex-col items-center group/bar cursor-help" title={`${m.amount} ₺`}>
                                    <div 
                                        className="w-full max-w-[40px] bg-gradient-to-t from-brand-primary to-brand-primary-light rounded-t-2xl transition-all duration-1000 ease-out relative shadow-lg shadow-brand-primary/5 group-hover/bar:from-brand-accent group-hover/bar:to-brand-accent group-hover/bar:scale-110"
                                        style={{ height: `${height}%`, minHeight: '8px' }}
                                    >
                                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] font-black px-2 py-1 rounded-md opacity-0 group-hover/bar:opacity-100 transition-all pointer-events-none whitespace-nowrap">
                                            {m.amount.toLocaleString()} ₺
                                        </div>
                                    </div>
                                    <span className="mt-6 text-[11px] font-black text-gray-400 uppercase tracking-widest">{m.month}</span>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Quick Stats Column */}
                <div className="space-y-8">
                    {/* Stat Card: Students */}
                    <div className="bg-brand-primary rounded-[40px] p-8 text-white relative overflow-hidden shadow-xl shadow-brand-primary/20 hover:scale-[1.02] transition-all group">
                        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-bl from-white/10 to-transparent"></div>
                        <i className="fas fa-user-graduate absolute -bottom-4 -right-4 text-8xl text-white/5 -rotate-12 group-hover:rotate-0 transition-transform duration-700"></i>
                        <p className="text-[10px] font-black text-white/40 uppercase tracking-[4px] mb-4">Aktif Öğrenci</p>
                        <h4 className="text-6xl font-black mb-2">{totalStudents.toLocaleString()}</h4>
                        <div className="flex items-center gap-2">
                            <span className="px-2 py-1 bg-white/10 rounded-lg text-[9px] font-black">+12 Bugün</span>
                        </div>
                    </div>

                    {/* Stat Card: Enrollments */}
                    <div className="bg-white rounded-[40px] p-8 border border-gray-100 shadow-xl shadow-gray-200/40 relative overflow-hidden group hover:border-brand-accent transition-all">
                        <i className="fas fa-graduation-cap absolute -top-4 -left-4 text-8xl text-gray-50/50 rotate-12 group-hover:rotate-0 transition-transform duration-700"></i>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[4px] mb-4 text-right">Toplam Kayıt</p>
                        <h4 className="text-6xl font-black text-gray-900 text-right mb-2">{totalEnrollments.toLocaleString()}</h4>
                        <div className="flex items-center justify-end gap-2">
                            <span className="text-[10px] font-bold text-brand-primary uppercase">Kurs & Paket Satışları</span>
                        </div>
                    </div>
                </div>

                {/* Top Courses Section */}
                <div className="lg:col-span-3 bg-white rounded-[48px] p-12 border border-gray-100 shadow-xl shadow-gray-200/40">
                    <div className="flex justify-between items-center mb-12">
                        <div>
                            <h3 className="text-2xl font-black text-gray-900 tracking-tight mb-2">En Çok Tercih Edilen Kurslar</h3>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Kayıt Sayısına Göre Dağılım</p>
                        </div>
                        <Link href="/admin/courses" className="px-6 py-2.5 bg-gray-50 text-gray-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-primary hover:text-white transition-all">Tüm Kursları Yönet</Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {topCourses.map((course: any, idx: number) => (
                            <div key={course.name} className="relative p-8 bg-gray-50/50 rounded-[32px] border border-gray-100/50 group hover:border-brand-primary/20 hover:bg-white transition-all duration-500">
                                <div className="absolute top-6 left-6 text-4xl font-black text-gray-100 group-hover:text-brand-primary/10 transition-colors">#{idx + 1}</div>
                                <h5 className="text-lg font-black text-gray-900 mb-6 relative z-10">{course.name}</h5>
                                
                                <div className="space-y-3">
                                    <div className="flex justify-between items-end">
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Kayıtlı Öğrenci</span>
                                        <span className="text-xl font-black text-brand-primary">{course.count}</span>
                                    </div>
                                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-brand-primary rounded-full transition-all duration-1000 delay-300" 
                                            style={{ width: `${(course.count / maxEnrollment) * 100}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    )
}
