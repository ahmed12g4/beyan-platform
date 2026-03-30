import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * Smart role-based redirect.
 * After login, redirects users to their role-specific dashboard:
 * - admin  → /admin
 * - teacher → /teacher
 * - student → /panel (student dashboard)
 */
export async function GET(request: Request) {
    const { origin } = new URL(request.url)
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.redirect(`${origin}/giris`)
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single() as any

    const role = profile?.role || 'student'

    const dashboardMap: Record<string, string> = {
        admin: '/admin',
        teacher: '/teacher',
        student: '/panel',
    }

    return NextResponse.redirect(`${origin}${dashboardMap[role] || '/panel'}`)
}
