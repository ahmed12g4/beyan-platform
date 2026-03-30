import { createClient } from '@/lib/supabase/server'
import type { Profile } from '@/types/database'

export type CurrentUser = {
    id: string
    email: string
    profile: Profile
} | null

/**
 * Get the current authenticated user with their profile data.
 * Use this in Server Components and layouts.
 * 
 * Returns null if the user is not authenticated.
 * 
 * Usage:
 * ```tsx
 * import { getCurrentUser } from '@/lib/auth/getCurrentUser'
 * 
 * export default async function Layout({ children }) {
 *   const user = await getCurrentUser()
 *   if (!user) redirect('/giris')
 *   return <SomeLayout user={user.profile}>{children}</SomeLayout>
 * }
 * ```
 */
export async function getCurrentUser(): Promise<CurrentUser> {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) return null

        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()

        if (profileError || !profile) return null

        return {
            id: user.id,
            email: user.email || '',
            profile,
        }
    } catch {
        return null
    }
}

/**
 * Get the current authenticated user or throw.
 * Use this when you know the user must be authenticated (in protected routes).
 * 
 * Throws an error if the user is not authenticated — the error should be
 * caught by Next.js error boundaries.
 */
export async function requireCurrentUser(): Promise<NonNullable<CurrentUser>> {
    const user = await getCurrentUser()
    if (!user) {
        throw new Error('Unauthorized')
    }
    return user
}
