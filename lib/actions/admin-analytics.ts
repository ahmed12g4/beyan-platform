'use server'

import { createClient } from '@/lib/supabase/server'
import { startOfMonth, subMonths, format, endOfMonth } from 'date-fns'

export async function getAdminAnalyticsAction() {
    const supabase = await createClient()

    try {
        // 1. Total Revenue (Success Payments)
        const { data: payments } = await supabase
            .from('payments')
            .select('amount, created_at')
            .eq('status', 'success')

        const totalRevenue = (payments as any[])?.reduce((sum, p) => sum + Number(p.amount), 0) || 0

        // 2. Monthly Revenue (Last 6 Months)
        const monthlyRevenue = []
        for (let i = 5; i >= 0; i--) {
            const date = subMonths(new Date(), i)
            const start = startOfMonth(date).toISOString()
            const end = endOfMonth(date).toISOString()

            const monthPayments = payments?.filter(p => {
                const pAny = p as any;
                return pAny.created_at >= start && pAny.created_at <= end
            }) || []

            const amount = (monthPayments as any[]).reduce((sum, p) => sum + Number(p.amount), 0)
            monthlyRevenue.push({
                month: format(date, 'MMM'),
                amount
            })
        }

        // 3. Enrollment Counts
        const { count: totalEnrollments } = await supabase
            .from('enrollments')
            .select('*', { count: 'exact', head: true })

        // 4. Student Count
        const { count: totalStudents } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('role', 'student')

        // 5. Course Distribution
        const { data: courseStats } = await supabase
            .from('courses')
            .select('title, enrollments(count)')

        const topCourses = courseStats?.map((c: any) => ({
            name: c.title,
            count: c.enrollments?.[0]?.count || 0
        })).sort((a, b) => b.count - a.count).slice(0, 5) || []

        return {
            success: true,
            data: {
                totalRevenue,
                monthlyRevenue,
                totalEnrollments: totalEnrollments || 0,
                totalStudents: totalStudents || 0,
                topCourses
            }
        }
    } catch (error) {
        console.error('Analytics Fetch Error:', error)
        return { success: false, error: 'Analiz verileri yüklenemedi.' }
    }
}
