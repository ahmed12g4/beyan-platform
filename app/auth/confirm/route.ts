import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * Auth confirm route handler.
 * Handles token_hash based confirmation (used by some Supabase email templates).
 * 
 * Query params:
 * - token_hash: The one-time token from the email
 * - type: The type of verification (signup, recovery, invite, email)
 * - next: Where to redirect after confirmation
 */
export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const token_hash = searchParams.get('token_hash')
    const type = searchParams.get('type') as 'signup' | 'recovery' | 'invite' | 'email' | null
    const next = searchParams.get('next') || '/panel'

    if (token_hash && type) {
        const supabase = await createClient()
        const { error } = await supabase.auth.verifyOtp({
            type,
            token_hash,
        })

        if (!error) {
            // For password recovery, go to the reset page
            if (type === 'recovery') {
                return NextResponse.redirect(`${origin}/sifre-sifirla`)
            }

            // For email signup confirmation, go to confirmation success page
            if (type === 'signup' || type === 'email') {
                return NextResponse.redirect(`${origin}/auth/confirmed`)
            }

            return NextResponse.redirect(`${origin}${next}`)
        }
    }

    // Invalid or expired token
    return NextResponse.redirect(`${origin}/giris?error=invalid_token`)
}
