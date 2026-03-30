'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import {
    loginSchema,
    registerSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
    changePasswordSchema,
    type LoginInput,
    type RegisterInput,
    type ForgotPasswordInput,
    type ResetPasswordInput,
    type ChangePasswordInput,
} from '@/lib/validations/schemas'
import { checkRateLimit } from '@/lib/rateLimit'
import { verifyRecaptcha } from '@/lib/recaptcha'

// ─── Response Type ───

export type ActionResult = {
    success: boolean
    error?: string
    message?: string
}

// ─── Check Email Exists ───

export async function checkEmailExists(email: string): Promise<boolean> {
    // Rate limit to prevent email enumeration attacks
    const rl = await checkRateLimit('contactForm', email)
    if (rl.limited) return false // silent fail — don't reveal why

    const supabase = await createAdminClient()
    const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .maybeSingle()

    if (error) {
        console.error('Check email error:', error)
        return false
    }

    return !!data
}

export async function loginAction(
    input: LoginInput,
    recaptchaToken?: string
): Promise<ActionResult> {
    try {
        const validated = loginSchema.safeParse(input)
        if (!validated.success) {
            return { success: false, error: validated.error.issues[0].message }
        }

        // Rate limit: 10 attempts per minute per IP
        const rl = await checkRateLimit('login', validated.data.email)
        if (rl.limited) {
            const seconds = Math.ceil((rl.retryAfterMs || 60000) / 1000)
            return { success: false, error: `Çok fazla giriş denemesi. Lütfen ${seconds} saniye sonra tekrar deneyin.` }
        }

        // reCAPTCHA verification (when token is provided by client after failed attempts)
        if (recaptchaToken) {
            const captchaValid = await verifyRecaptcha(recaptchaToken)
            if (!captchaValid) {
                return { success: false, error: 'Robot doğrulaması başarısız. Lütfen tekrar deneyin.' }
            }
        }

        const supabase = await createClient()
        const { data: authData, error } = await supabase.auth.signInWithPassword({
            email: validated.data.email,
            password: validated.data.password,
        })

        if (error) {
            if (error.message.includes('Invalid login credentials')) {
                return { success: false, error: 'E-posta veya şifre yanlış' }
            }
            if (error.message.includes('Email not confirmed')) {
                return { success: false, error: 'E-posta adresiniz henüz doğrulanmamış. Lütfen e-postanızı kontrol edin.' }
            }
            return { success: false, error: error.message }
        }

        if (authData.user) {
            // Check if user is active (approved)
            const { data: profile } = await supabase
                .from('profiles')
                .select('is_active, role')
                .eq('id', authData.user.id)
                .single()

            if (profile && profile.is_active === false) {
                await supabase.auth.signOut()
                return {
                    success: false,
                    error: 'Hesabınız henüz onaylanmamış. Yönetici onayı bekleniyor.'
                }
            }
        }

        return { success: true, message: 'Giriş başarılı' }
    } catch {
        return { success: false, error: 'Bir hata oluştu. Lütfen tekrar deneyin.' }
    }
}

// ─── Register ───

export async function registerAction(input: RegisterInput): Promise<ActionResult> {
    try {
        const validated = registerSchema.safeParse(input)
        if (!validated.success) {
            return { success: false, error: validated.error.issues[0].message }
        }

        // Rate limit: 5 registrations per minute per IP
        const rl = await checkRateLimit('register')
        if (rl.limited) {
            const seconds = Math.ceil((rl.retryAfterMs || 60000) / 1000)
            return { success: false, error: `Çok fazla kayıt denemesi. Lütfen ${seconds} saniye sonra tekrar deneyin.` }
        }

        const supabase = await createClient()
        const { data, error } = await supabase.auth.signUp({
            email: validated.data.email,
            password: validated.data.password,
            options: {
                data: {
                    full_name: validated.data.full_name,
                    role: validated.data.role,
                    phone: validated.data.phone,
                    expertise: validated.data.expertise,
                    bio: validated.data.bio,
                },
                emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?type=signup`,
            },
        })

        if (error) {
            if (error.message.includes('User already registered')) {
                return { success: false, error: 'Bu e-posta adresi zaten kayıtlı' }
            }
            if (error.message.includes('Database error') || error.message.includes('rate limit')) {
                // Trigger might have failed or rate limit hit — try admin path as fallback
                return await registerWithAdmin(validated.data)
            }
            return { success: false, error: error.message }
        }

        return {
            success: true,
            message: 'Kayıt başarılı! Lütfen e-posta adresinizi doğrulayın.',
        }
    } catch {
        return { success: false, error: 'Bir hata oluştu. Lütfen tekrar deneyin.' }
    }
}

// Fallback: admin client registration (bypasses trigger)
async function registerWithAdmin(data: { email: string; password: string; full_name: string; role: string; phone: string; expertise?: string; bio?: string }): Promise<ActionResult> {
    try {
        const adminClient = await createAdminClient()

        const { data: authData, error: signUpError } = await adminClient.auth.admin.createUser({
            email: data.email,
            password: data.password,
            email_confirm: false, // Require email verification same as normal flow
            user_metadata: {
                full_name: data.full_name,
                role: data.role,
                phone: data.phone,
                expertise: data.expertise,
                bio: data.bio,
            },
        })

        if (signUpError) {
            if (signUpError.message.includes('already') || signUpError.message.includes('exists')) {
                return { success: false, error: 'Bu e-posta adresi zaten kayıtlı' }
            }
            return { success: false, error: signUpError.message }
        }

        if (!authData.user) {
            return { success: false, error: 'Kullanıcı oluşturulamadı' }
        }

        // Upsert profile
        const { error: profileError } = await adminClient
            .from('profiles')
            .upsert({
                id: authData.user.id,
                full_name: data.full_name,
                email: data.email,
                phone: data.phone,
                role: (data.role as 'student' | 'teacher' | 'admin') || 'student',
                bio: data.bio || null,
                is_active: data.role === 'teacher' ? false : true // Enforce approval workflow
            } as any, { onConflict: 'id' })

        if (profileError) {
            await adminClient.auth.admin.deleteUser(authData.user.id)
            return { success: false, error: 'Profil oluşturulamadı. Lütfen tekrar deneyin.' }
        }



        return {
            success: true,
            message: 'Kayıt başarılı! Lütfen e-posta adresinizi doğrulayın.',
        }
    } catch {
        return { success: false, error: 'Bir hata oluştu. Lütfen tekrar deneyin.' }
    }
}

// ─── Logout ───

export async function logoutAction(): Promise<void> {
    const supabase = await createClient()
    await supabase.auth.signOut()
    revalidatePath('/', 'layout')
    redirect('/giris')
}

// ─── Forgot Password ───

export async function forgotPasswordAction(input: ForgotPasswordInput): Promise<ActionResult> {
    try {
        const validated = forgotPasswordSchema.safeParse(input)
        if (!validated.success) {
            return { success: false, error: validated.error.issues[0].message }
        }

        // Rate limit: 5 reset emails per minute per IP+email
        const rl = await checkRateLimit('resetPassword', validated.data.email)
        if (rl.limited) {
            const seconds = Math.ceil((rl.retryAfterMs || 60000) / 1000)
            return { success: false, error: `Çok fazla deneme. Lütfen ${seconds} saniye sonra tekrar deneyin.` }
        }

        const supabase = await createClient()
        // Always send the reset email if email exists (Supabase handles it silently if not found)
        await supabase.auth.resetPasswordForEmail(validated.data.email, {
            redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?type=recovery`,
        })

        // Always return the same message regardless of whether email exists
        // This prevents email enumeration attacks
        return {
            success: true,
            message: 'Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.',
        }
    } catch {
        return { success: false, error: 'Bir hata oluştu. Lütfen tekrar deneyin.' }
    }
}

// ─── Reset Password ───

export async function resetPasswordAction(input: ResetPasswordInput): Promise<ActionResult> {
    try {
        const validated = resetPasswordSchema.safeParse(input)
        if (!validated.success) {
            return { success: false, error: validated.error.issues[0].message }
        }

        const supabase = await createClient()
        const { error } = await supabase.auth.updateUser({
            password: validated.data.password,
        })

        if (error) {
            return { success: false, error: error.message }
        }

        return { success: true, message: 'Şifreniz başarıyla güncellendi.' }
    } catch {
        return { success: false, error: 'Bir hata oluştu. Lütfen tekrar deneyin.' }
    }
}

// ─── Change Password (while logged in) ───

export async function changePasswordAction(input: ChangePasswordInput): Promise<ActionResult> {
    try {
        const validated = changePasswordSchema.safeParse(input)
        if (!validated.success) {
            return { success: false, error: validated.error.issues[0].message }
        }

        // Rate limit: 5 change-password attempts per minute per IP
        const rl = await checkRateLimit('changePassword')
        if (rl.limited) {
            const seconds = Math.ceil((rl.retryAfterMs || 60000) / 1000)
            return { success: false, error: `Çok fazla deneme. Lütfen ${seconds} saniye sonra tekrar deneyin.` }
        }

        const supabase = await createClient()

        // Verify current password by attempting sign-in
        const { data: { user } } = await supabase.auth.getUser()
        if (!user?.email) {
            return { success: false, error: 'Oturum bulunamadı' }
        }

        const { error: verifyError } = await supabase.auth.signInWithPassword({
            email: user.email,
            password: validated.data.currentPassword,
        })

        if (verifyError) {
            return { success: false, error: 'Mevcut şifre yanlış' }
        }

        // Update to new password
        const { error } = await supabase.auth.updateUser({
            password: validated.data.newPassword,
        })

        if (error) {
            return { success: false, error: error.message }
        }

        revalidatePath('/', 'layout')
        return { success: true, message: 'Şifreniz başarıyla güncellendi.' }
    } catch {
        return { success: false, error: 'Bir hata oluştu. Lütfen tekrar deneyin.' }
    }
}

// ─── Get Current User (server-side helper) ───

export async function getCurrentUser() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    return profile
}

// ─── Get Current User Role ───

export async function getCurrentUserRole() {
    const profile = await getCurrentUser()
    return profile?.role || null
}
