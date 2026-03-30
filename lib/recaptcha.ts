// Server-side utility — called by Server Actions, no 'use server' needed here


/**
 * Verifies a Google reCAPTCHA v2 token on the server.
 *
 * Required environment variables:
 *   RECAPTCHA_SECRET_KEY  — from https://www.google.com/recaptcha/admin
 *
 * Also add to .env.local:
 *   NEXT_PUBLIC_RECAPTCHA_SITE_KEY — shown to the user in the browser widget
 */
export async function verifyRecaptcha(token: string): Promise<boolean> {
    const secretKey = process.env.RECAPTCHA_SECRET_KEY

    // If secret key is not configured, skip verification (dev/test mode)
    if (!secretKey) {
        console.warn('[reCAPTCHA] RECAPTCHA_SECRET_KEY not set — skipping verification')
        return true
    }

    if (!token) return false

    try {
        const res = await fetch('https://www.google.com/recaptcha/api/siteverify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `secret=${secretKey}&response=${token}`,
            // Don't cache — each token is single-use
            cache: 'no-store',
        })

        const data = await res.json()
        return data.success === true
    } catch (e) {
        console.error('[reCAPTCHA] Verification error:', e)
        // Fail open in case of network error (don't block legitimate users)
        return true
    }
}
