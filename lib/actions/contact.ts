'use server'

import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { checkRateLimit } from '@/lib/rateLimit'

const contactSchema = z.object({
    fullName: z.string().min(2, 'Ad Soyad en az 2 karakter olmalıdır'),
    email: z.string().email('Geçerli bir e-posta adresi giriniz'),
    subject: z.string().optional().or(z.literal('')),
    message: z.string().min(3, 'Mesajınız en az 3 karakter olmalıdır'),
})

export type ContactFormState = {
    success: boolean
    message: string
    errors?: {
        fullName?: string[]
        email?: string[]
        subject?: string[]
        message?: string[]
    }
}

export async function submitContactForm(prevState: ContactFormState, formData: FormData): Promise<ContactFormState> {
    const rawData = {
        fullName: formData.get('fullName')?.toString() || '',
        email: formData.get('email')?.toString() || '',
        subject: formData.get('subject')?.toString() || '',
        message: formData.get('message')?.toString() || '',
    }


    const validatedFields = contactSchema.safeParse(rawData)

    if (!validatedFields.success) {
        console.error('Validation Errors:', validatedFields.error.flatten().fieldErrors)
        return {
            success: false,
            message: 'Lütfen form alanlarını kontrol ediniz.',
            errors: validatedFields.error.flatten().fieldErrors,
        }
    }

    // Rate limit: 3 contact form submissions per minute per IP
    const rl = await checkRateLimit('contactForm', rawData.email)
    if (rl.limited) {
        const seconds = Math.ceil((rl.retryAfterMs || 60000) / 1000)
        return {
            success: false,
            message: `Çok fazla mesaj gönderdiniz. Lütfen ${seconds} saniye bekleyin.`,
        }
    }

    const { fullName, email, subject, message } = validatedFields.data
    const supabase = await createClient()

    try {
        // 1. Insert into contact_messages
        const { error } = await supabase.from('contact_messages' as any).insert({
            full_name: fullName,
            email,
            subject,
            message,
        })

        if (error) {
            console.error('Contact form DB error details:', {
                code: error.code,
                message: error.message,
                details: error.details,
                hint: error.hint
            })
            return { success: false, message: 'Mesajınız kaydedilemedi. Lütfen tekrar deneyiniz.' }
        }



        revalidatePath('/admin/messages')
        return { success: true, message: 'Mesajınız başarıyla gönderildi. En kısa sürede dönüş yapacağız.' }

    } catch (error) {
        console.error('Contact form error:', error)
        return { success: false, message: 'Beklenmedik bir hata oluştu.' }
    }
}

export async function deleteContactMessage(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Oturum bulunamadı' }

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') {
        return { success: false, error: 'Yetkisiz erişim' }
    }

    const { error } = await supabase.from('contact_messages' as any).delete().eq('id', id)

    if (error) {
        console.error('Delete inquiry error:', error)
        return { success: false, error: 'Mesaj silinemedi.' }
    }

    revalidatePath('/admin/inquiries')
    return { success: true }
}

export async function markAsRead(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Oturum bulunamadı' }

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') {
        return { success: false, error: 'Yetkisiz erişim' }
    }

    const { error } = await supabase.from('contact_messages' as any).update({ is_read: true }).eq('id', id)

    if (error) {
        console.error('Mark as read error:', error)
        return { success: false, error: 'İşlem başarısız.' }
    }

    revalidatePath('/admin/inquiries')
    return { success: true }
}
