// Server-side utility — called by Server Actions, no 'use server' needed here
// (Next.js requires 'use server' files to only export async functions)

import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'

/**
 * Supabase-backed Rate Limiter for Server Actions
 *
 * Uses the `rate_limits` table in Supabase to enforce per-IP-per-action limits.
 * Persisted in DB so it works correctly in serverless (Vercel) environments
 * where in-memory state is lost between invocations.
 *
 * Table structure (apply this migration in Supabase SQL editor):
 * ---------------------------------------------------------------
 * create table if not exists rate_limits (
 *   key        text primary key,
 *   count      int not null default 1,
 *   reset_at   timestamptz not null
 * );
 * alter table rate_limits enable row level security;
 * -- No RLS policies needed — only accessed via service role in middleware / server actions
 * ---------------------------------------------------------------
 */

// Default limits
export const RATE_LIMITS = {
    login: { maxRequests: 5, windowMs: 180_000 },          // 5 tries/3 min
    register: { maxRequests: 5, windowMs: 60_000 },         // 5 tries/min
    resetPassword: { maxRequests: 5, windowMs: 60_000 },    // 5 tries/min
    contactForm: { maxRequests: 3, windowMs: 60_000 },      // 3 sends/min
    changePassword: { maxRequests: 5, windowMs: 60_000 },   // 5 tries/min
} as const

export type RateLimitAction = keyof typeof RATE_LIMITS

/**
 * Get the caller's IP from the request headers.
 * Falls back to '127.0.0.1' in development / when running server-side.
 */
async function getCallerIp(): Promise<string> {
    try {
        const headersList = await headers()
        return (
            headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
            headersList.get('x-real-ip') ||
            '127.0.0.1'
        )
    } catch {
        return '127.0.0.1'
    }
}

/**
 * Check rate limit for a specific action and IP.
 * Returns `{ limited: true, retryAfterMs }` if the limit is exceeded.
 * Returns `{ limited: false }` if the request is allowed.
 *
 * @param action - One of the predefined rate limit actions
 * @param identifier - Optional custom identifier (e.g. email) suffix to make per-user limits
 */
export async function checkRateLimit(
    action: RateLimitAction,
    identifier?: string
): Promise<{ limited: boolean; retryAfterMs?: number; error?: string }> {
    try {
        const ip = await getCallerIp()
        const { maxRequests, windowMs } = RATE_LIMITS[action]
        const suffix = identifier ? `:${identifier}` : ''
        const key = `rl:${action}:${ip}${suffix}`
        const now = new Date()
        const resetAt = new Date(now.getTime() + windowMs)

        const supabase = await createClient()

        // Try to fetch existing entry
        const { data: rawExisting } = await (supabase as any)
            .from('rate_limits')
            .select('count, reset_at')
            .eq('key', key)
            .maybeSingle()

        const existing = rawExisting as { count: number; reset_at: string } | null

        if (!existing || new Date(existing.reset_at) < now) {
            // No entry or window expired — create/reset
            await (supabase as any)
                .from('rate_limits')
                .upsert({ key, count: 1, reset_at: resetAt.toISOString() })
            return { limited: false }
        }

        if (existing.count >= maxRequests) {
            // Over limit
            const retryAfterMs = new Date(existing.reset_at).getTime() - now.getTime()
            return { limited: true, retryAfterMs: Math.max(0, retryAfterMs) }
        }

        // Increment count
        await (supabase as any)
            .from('rate_limits')
            .update({ count: existing.count + 1 })
            .eq('key', key)

        return { limited: false }

    } catch (e) {
        // If rate limit check fails (e.g., table doesn't exist yet), allow the request
        console.error('[RateLimit] Error checking rate limit:', e)
        return { limited: false, error: 'rate_limit_check_failed' }
    }
}
