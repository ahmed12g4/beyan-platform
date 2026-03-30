'use server'

import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function incrementVisitorCount() {
    try {
        const cookieStore = await cookies()

        if (cookieStore.get('beyan_unique_visitor_id')) {
            return { success: true, message: 'Existing visitor' }
        }

        const supabase = await createClient()

        const visitorId = crypto.randomUUID()

        const { error } = await (supabase
            .from('site_visits' as any) as any)
            .insert([{ visitor_id: visitorId }])

        if (error) {
            console.error('Visitor insert error (maybe table does not exist):', error)
            return { success: false, error: 'Silently failed tracking' }
        }

        cookieStore.set('beyan_unique_visitor_id', visitorId, {
            maxAge: 60 * 60 * 24 * 365,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
        })

        return { success: true, message: 'Tracked new visitor' }
    } catch (e: any) {
        return { success: false, error: e.message }
    }
}

export async function getUniqueVisitorCount(): Promise<number> {
    try {
        const supabase = await createClient()

        const { count, error } = await (supabase
            .from('site_visits' as any) as any)
            .select('*', { count: 'exact', head: true })

        if (error) {
            return 0
        }

        return count || 0
    } catch {
        return 0
    }
}
