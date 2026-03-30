import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

/**
 * Creates a Supabase client for use in Server Components, Server Actions, and Route Handlers.
 * This client reads/writes cookies for session management on the server side.
 * 
 * IMPORTANT: This function is async because `cookies()` is async in Next.js 15+.
 * 
 * Usage:
 *   const supabase = await createClient()
 *   const { data } = await supabase.from('courses').select('*')
 */
export async function createClient() {
    const cookieStore = await cookies()

    return createServerClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch {
                        // The `setAll` method is called from a Server Component where
                        // cookies cannot be set. This can be safely ignored if the
                        // middleware is refreshing user sessions.
                    }
                },
            },
        }
    )
}

/**
 * Creates a Supabase admin client using the service role key.
 * This bypasses RLS — use ONLY in trusted server-side operations.
 * 
 * WARNING: Never expose this client to the browser.
 */
export async function createAdminClient() {
    const { createClient: createSupabaseClient } = await import('@supabase/supabase-js')

    return createSupabaseClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        }
    )
}
