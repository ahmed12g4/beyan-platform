'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

/**
 * Handles Supabase auth hash fragments in the URL.
 * 
 * Supabase redirects users with tokens/errors in the hash:
 * - Success: /#access_token=...&type=magiclink
 * - Error: /#error=access_denied&error_code=otp_expired&error_description=...
 * 
 * This component detects these and handles them appropriately.
 */
export function AuthHashHandler() {
    const router = useRouter()
    const [authError, setAuthError] = useState<string | null>(null)

    useEffect(() => {
        const hash = window.location.hash
        if (!hash || hash.length <= 1) return

        const params = new URLSearchParams(hash.substring(1))

        // Handle error hashes
        const error = params.get('error')
        const errorDescription = params.get('error_description')
        const errorCode = params.get('error_code')

        if (error) {
            // Clear the hash
            window.history.replaceState(null, '', window.location.pathname)

            if (errorCode === 'otp_expired') {
                // Token expired — redirect to login with message
                router.push('/giris?error=link_expired')
            } else {
                router.push(`/giris?error=${errorCode || 'auth_error'}`)
            }
            return
        }

        // Handle success hashes (access_token)
        const accessToken = params.get('access_token')
        if (!accessToken) return

        const type = params.get('type')
        const supabase = createClient()

        const handleSession = async () => {
            // Wait for Supabase client to process the hash
            const { data: { session } } = await supabase.auth.getSession()

            if (session) {
                // Clear the hash from URL
                window.history.replaceState(null, '', window.location.pathname)

                if (type === 'recovery') {
                    router.push('/sifre-sifirla')
                } else {
                    router.push('/auth/confirmed')
                }
            }
        }

        // Small delay to let Supabase process the hash fragment
        const timer = setTimeout(handleSession, 500)
        return () => clearTimeout(timer)
    }, [router])

    return null
}
