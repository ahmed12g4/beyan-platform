'use server'

import { createAdminClient } from "@/lib/supabase/server"

export async function getAllPayments() {
    const supabase = await createAdminClient()

    try {
        const { data, error } = await supabase
            .from('payments')
            .select(`
                *,
                user:profiles!user_id(full_name, email)
            `)
            .order('created_at', { ascending: false })

        if (error) {
            console.error("Error fetching payments:", error)
            return { success: false, data: [] }
        }

        // Add dummy data for testing if no real payments exist yet
        if (!data || data.length === 0) {
            return {
                success: true,
                data: [
                    {
                        id: 'dummy-1',
                        user_id: 'user-1',
                        product_type: 'course',
                        product_id: 'course-1',
                        amount: 450.00,
                        currency: 'TRY',
                        status: 'success',
                        iyzico_payment_id: 'iyzi_123456',
                        created_at: new Date().toISOString(),
                        user: { full_name: 'Ahmet Yılmaz', email: 'ahmet@example.com' }
                    },
                    {
                        id: 'dummy-2',
                        user_id: 'user-2',
                        product_type: 'package',
                        product_id: 'pkg-1',
                        amount: 1200.00,
                        currency: 'TRY',
                        status: 'pending',
                        iyzico_payment_id: null,
                        created_at: new Date(Date.now() - 86400000).toISOString(),
                        user: { full_name: 'Ayşe Demir', email: 'ayse@example.com' }
                    },
                    {
                        id: 'dummy-3',
                        user_id: 'user-3',
                        product_type: 'group',
                        product_id: 'grp-1',
                        amount: 850.00,
                        currency: 'TRY',
                        status: 'failed',
                        iyzico_payment_id: 'iyzi_987654',
                        error_message: 'Yetersiz bakiye',
                        created_at: new Date(Date.now() - 172800000).toISOString(),
                        user: { full_name: 'Mehmet Kaya', email: 'mehmet@example.com' }
                    }
                ]
            }
        }

        return { success: true, data }
    } catch (error) {
        console.error("General error fetching payments:", error)
        return { success: false, data: [] }
    }
}
