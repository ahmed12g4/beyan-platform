import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/types/database'

// ─── In-Memory Rate Limiter ───
// Simple sliding window rate limiter using a Map (per-process)
// Resets on server restart — sufficient for most abuse prevention
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function isRateLimited(key: string, limit: number, windowMs: number): boolean {
    const now = Date.now()
    const entry = rateLimitMap.get(key)

    if (!entry || now > entry.resetAt) {
        rateLimitMap.set(key, { count: 1, resetAt: now + windowMs })
        return false
    }

    if (entry.count >= limit) {
        return true // Rate limit exceeded
    }

    entry.count++
    return false
}

// ─── Maintenance Mode Cache ───
// Caches the maintenance_mode flag for 30 seconds to avoid a DB hit on every request
let maintenanceCached: { value: boolean; expiresAt: number } | null = null

/**
 * Updates the Supabase session in middleware.
 * This ensures the auth token is refreshed on every request.
 * 
 * Also handles route protection based on user roles:
 * - /student/* → requires 'student' role
 * - /teacher/* → requires 'teacher' role  
 * - /admin/*   → requires 'admin' role
 * - /giris, /kayit → redirects to dashboard if already logged in
 */
export async function updateSession(request: NextRequest, response?: NextResponse) {
    let supabaseResponse = response || NextResponse.next({
        request,
    })

    const supabase = createServerClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        request.cookies.set(name, value)
                    )
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // Refresh the auth token
    const {
        data: { user },
    } = await supabase.auth.getUser()

    const pathname = request.nextUrl.pathname

    // ─── Public routes (no auth required) ───
    const publicRoutes = [
        '/',
        '/kurslar',
        '/hakkimizda',
        '/iletisim',
        '/blog',
        '/reviews',
        '/programlarimiz',
        '/ozel-dersler',
        '/grup-dersleri',
        '/kayitli-kurslar',
    ]

    const isPublicRoute = publicRoutes.some(
        (route) => pathname === route || pathname.startsWith('/kurslar/')
    )

    // ─── Auth routes (login, register, etc.) ───
    const authRoutes = ['/giris', '/kayit', '/sifremi-unuttum', '/sifre-sifirla']
    const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route))

    // ─── Rate Limiting (Login & Register) ───
    // NOTE: This in-memory limiter is a BEST-EFFORT first-line defense.
    // In serverless/multi-instance environments (Vercel) each instance has
    // its own Map, so the effective limit is per-instance, not global.
    // The persistent, cross-instance limit is enforced by checkRateLimit()
    // in lib/rateLimit.ts (Supabase DB-backed) inside the Server Actions.
    if (pathname === '/giris' || pathname === '/kayit') {
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0]
            || request.headers.get('x-real-ip')
            || '127.0.0.1'
        const rlKey = `rl:${pathname}:${ip}`
        const LIMITED = isRateLimited(rlKey, 10, 30_000) // tightened: 10 req / 30s

        if (LIMITED) {
            return new NextResponse(
                JSON.stringify({ error: 'Çok fazla istek. Lütfen bir dakika sonra tekrar deneyin.' }),
                {
                    status: 429,
                    headers: {
                        'Content-Type': 'application/json',
                        'Retry-After': '60',
                    }
                }
            )
        }
    }

    // If user is logged in and tries to access auth pages, redirect to their dashboard
    if (user && isAuthRoute) {
        // Fetch user role from metadata (performance optimized)
        const role = user.user_metadata?.role || 'student'
        const isActive = user.user_metadata?.is_active ?? true

        // Only redirect active users. Inactive users should stay on login page to see error/logout.
        // Exception: Teachers who are inactive (pending) should probably go to pending-approval? 
        // Actually, if they are pending, they ARE redirected to /pending-approval by the protected route logic below if they try to access protected routes.
        // But if they access /giris, we generally want them to go to their dashboard (which might be pending page).

        if (isActive || role === 'teacher') {
            const dashboardMap: Record<string, string> = {
                student: '/student',
                teacher: '/teacher',
                admin: '/admin',
            }

            const redirectUrl = request.nextUrl.clone()
            redirectUrl.pathname = dashboardMap[role] || '/student'
            return NextResponse.redirect(redirectUrl)
        }
    }

    // Allow public routes without auth
    if (isPublicRoute || isAuthRoute) {
        return supabaseResponse
    }

    // ─── Protected routes ───
    const isStudentRoute = pathname.startsWith('/student') && !pathname.startsWith('/students')
    const isTeacherRoute = pathname.startsWith('/teacher') && !pathname.startsWith('/teachers')
    const isAdminRoute = pathname.startsWith('/admin')
    const isPanelRoute = pathname.startsWith('/panel')

    const isProtectedRoute = isStudentRoute || isTeacherRoute || isAdminRoute || isPanelRoute

    // If not authenticated and accessing protected route, redirect to login
    if (!user && isProtectedRoute) {
        const redirectUrl = request.nextUrl.clone()
        redirectUrl.pathname = '/giris'
        redirectUrl.searchParams.set('redirectTo', pathname)
        return NextResponse.redirect(redirectUrl)
    }

    // If authenticated, check role-based access
    if (user && isProtectedRoute) {
        // Use user metadata for performance (synced from profiles via DB trigger)
        const role = user.user_metadata?.role || 'student'
        const isActive = user.user_metadata?.is_active ?? true

        // 1. Email Verification Check (Applies to everyone)
        if (!user.email_confirmed_at && pathname !== '/verify-email') {
            const redirectUrl = request.nextUrl.clone()
            redirectUrl.pathname = '/verify-email'
            return NextResponse.redirect(redirectUrl)
        }

        // 2. Teacher Approval Check
        if (role === 'teacher' && !isActive && pathname !== '/pending-approval') {
            const redirectUrl = request.nextUrl.clone()
            redirectUrl.pathname = '/pending-approval'
            return NextResponse.redirect(redirectUrl)
        }

        // 3. Account Disabled Check (Students & Admins)
        if (role !== 'teacher' && !isActive) {
            const redirectUrl = request.nextUrl.clone()
            redirectUrl.pathname = '/giris'
            redirectUrl.searchParams.set('error', 'account_disabled')
            return NextResponse.redirect(redirectUrl)
        }

        // Allow access to /verify-email and /pending-approval if state matches
        if (pathname === '/verify-email' && user.email_confirmed_at) {
            const redirectUrl = request.nextUrl.clone()
            redirectUrl.pathname = role === 'teacher' ? '/teacher' : (role === 'admin' ? '/admin' : '/student')
            return NextResponse.redirect(redirectUrl)
        }

        if (pathname === '/pending-approval' && isActive) {
            const redirectUrl = request.nextUrl.clone()
            redirectUrl.pathname = '/teacher'
            return NextResponse.redirect(redirectUrl)
        }

        // Skip other checks if on notification pages
        if (pathname === '/verify-email' || pathname === '/pending-approval') {
            return supabaseResponse
        }

        // Role-based route protection
        if (isAdminRoute && role !== 'admin') {
            const redirectUrl = request.nextUrl.clone()
            redirectUrl.pathname = role === 'teacher' ? '/teacher' : '/student'
            return NextResponse.redirect(redirectUrl)
        }

        if (isTeacherRoute && role !== 'teacher' && role !== 'admin') {
            const redirectUrl = request.nextUrl.clone()
            redirectUrl.pathname = '/student'
            return NextResponse.redirect(redirectUrl)
        }

        // Panel route redirects to role-specific dashboard
        if (isPanelRoute) {
            const redirectUrl = request.nextUrl.clone()
            const dashboardMap: Record<string, string> = {
                student: '/student',
                teacher: '/teacher',
                admin: '/admin',
            }
            redirectUrl.pathname = dashboardMap[role] || '/student'
            return NextResponse.redirect(redirectUrl)
        }
    }

    // ─── Maintenance Mode Check (with 30s cache) ───
    const now = Date.now()
    let isMaintenanceMode = false

    if (maintenanceCached && now < maintenanceCached.expiresAt) {
        // Use cached value — avoids DB hit on every request
        isMaintenanceMode = maintenanceCached.value
    } else {
        // Fetch from DB and cache for 30 seconds
        const { data: settings } = await supabase
            .from('platform_settings')
            .select('maintenance_mode')
            .eq('id', 1)
            .single()

        isMaintenanceMode = settings?.maintenance_mode || false
        maintenanceCached = { value: isMaintenanceMode, expiresAt: now + 30_000 }
    }

    const isMaintenancePage = pathname === '/maintenance'

    // If maintenance is ON
    if (isMaintenanceMode) {
        // Allow access to:
        // 1. Admin routes (so they can turn it off)
        // 2. Login pages (so admins can login)
        // 3. Static assets / API (for functionality)
        // 4. Maintenance page itself
        // 5. Verified admin users anywhere
        const isAllowedDuringMaintenance =
            isAdminRoute ||
            isAuthRoute ||
            pathname.startsWith('/_next') ||
            pathname.startsWith('/api') ||
            pathname.startsWith('/static') ||
            isMaintenancePage ||
            (user && user.user_metadata?.role === 'admin')

        if (!isAllowedDuringMaintenance) {
            return NextResponse.redirect(new URL('/maintenance', request.url))
        }
    } else {
        // If maintenance is OFF, and user tries to access maintenance page, redirect home
        if (isMaintenancePage) {
            return NextResponse.redirect(new URL('/', request.url))
        }
    }

    return supabaseResponse
}
