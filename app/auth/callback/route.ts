import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * Auth callback handler for Supabase.
 * This route handles:
 * 1. Email confirmation after registration
 * 2. Password reset link clicks
 * 3. OAuth callbacks (if added in future)
 * 
 * Supabase redirects users here with a code in the URL query.
 * We exchange that code for a session, then redirect accordingly.
 */
export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const next = searchParams.get('next') || '/panel'
    const type = searchParams.get('type') // 'recovery' | 'signup' | 'invite' | 'magiclink'

    if (code) {
        const supabase = await createClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error) {
            // For password recovery, redirect to the password reset page
            if (type === 'recovery') {
                return NextResponse.redirect(`${origin}/sifre-sifirla`)
            }

            // For signup confirmation, redirect to beautiful confirmation page
            if (type === 'signup') {
                return NextResponse.redirect(`${origin}/auth/confirmed`)
            }

            // Default: redirect to the next URL or panel
            const forwardedHost = request.headers.get('x-forwarded-host')
            const isLocalEnv = process.env.NODE_ENV === 'development'

            if (isLocalEnv) {
                return NextResponse.redirect(`${origin}${next}`)
            } else if (forwardedHost) {
                return NextResponse.redirect(`https://${forwardedHost}${next}`)
            } else {
                return NextResponse.redirect(`${origin}${next}`)
            }
        }
    }

    // Auth code exchange failed — redirect to an error page
    return NextResponse.redirect(`${origin}/giris?error=auth_callback_error`)
}
