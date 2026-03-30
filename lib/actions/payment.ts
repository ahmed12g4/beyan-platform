'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { enrollStudentAction, fulfillPurchaseAction } from './enrollments'

// Placeholder for the actual payment gateway URL
// TODO: Replace with actual Iyzico/Stripe endpoint
const PAYMENT_GATEWAY_URL = 'http://localhost:3000/checkout/result'

export interface CheckoutResult {
    success: boolean
    url?: string
    error?: string
}

export async function initiateCheckoutAction(
    targetId: string,
    type: 'course' | 'package' | 'group' = 'course',
    metadata: any = {}
): Promise<CheckoutResult> {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return { success: false, error: 'Lütfen önce giriş yapın.' }
        }

        let amount = 0;
        let title = '';

        // 1. Get Product Details based on Type
        if (type === 'course') {
            const { data: course } = await (supabase.from('courses') as any).select('title, price, is_published').eq('id', targetId).single();
            if (!course || !(course as any).is_published) return { success: false, error: 'Kurs bulunamadı.' };
            amount = (course as any).price;
            title = (course as any).title;
        } else if (type === 'package') {
            const { data: teacher } = await (supabase.from('profiles') as any).select('full_name, price_per_lesson').eq('id', targetId).single();
            if (!teacher) return { success: false, error: 'Eğitmen bulunamadı.' };
            const lessons = metadata.lessons || 4;
            amount = ((teacher as any).price_per_lesson || 150) * lessons;
            title = `${(teacher as any).full_name} - ${lessons} Ders Paketi`;
        } else if (type === 'group') {
            const { data: group } = await (supabase.from('groups') as any).select('title, price, is_published').eq('id', targetId).single();
            if (!group || !group.is_published) return { success: false, error: 'Grup bulunamadı.' };
            amount = group.price;
            title = group.title;
        }

        // 2. Check if Free (only for courses)
        if (type === 'course' && amount === 0) {
            const result = await enrollStudentAction(targetId)
            if (result.success) return { success: true, url: `/student/courses/${targetId}` }
            return { success: false, error: result.error }
        }

        // 3. Create Pending Transaction
        const { data: transaction, error: transactionError } = await (supabase
            .from('transactions') as any)
            .insert({
                user_id: user.id,
                course_id: type === 'course' ? targetId : null,
                amount: amount,
                currency: 'TRY',
                status: 'PENDING',
                provider: 'placeholder',
                metadata: {
                    ...metadata,
                    type,
                    targetId,
                    course_title: title,
                    customer_email: user.email
                }
            })
            .select('id')
            .single()

        if (transactionError || !transaction) {
            console.error('Transaction creation failed:', transactionError)
            return { success: false, error: 'Ödeme işlemi başlatılamadı.' }
        }

        // 4. Construct Payment URL
        const checkoutUrl = `${PAYMENT_GATEWAY_URL}?token=${(transaction as any).id}&status=success`
        return { success: true, url: checkoutUrl }

    } catch (error) {
        console.error('Checkout error:', error)
        return { success: false, error: 'Bir hata oluştu.' }
    }
}

export interface VerificationResult {
    success: boolean
    message?: string
    courseId?: string
    type?: string
}

export async function verifyPaymentAction(transactionId: string): Promise<VerificationResult> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, message: 'Oturum açmalısınız.' };

        // 1. Get Transaction
        const { data: transaction, error: fetchError } = await (supabase
            .from('transactions') as any)
            .select('id, user_id, course_id, amount, status, metadata')
            .eq('id', transactionId)
            .single();

        if (fetchError || !transaction) return { success: false, message: 'İşlem bulunamadı.' };
        if ((transaction as any).user_id !== user.id) return { success: false, message: 'İşlem bulunamadı.' };

        if ((transaction as any).status === 'COMPLETED') {
            return { success: true, message: 'Ödeme zaten onaylanmış.', courseId: (transaction as any).course_id, type: ((transaction as any).metadata as any)?.type }
        }

        // 2. Update Transaction to COMPLETED
        const { error: updateError } = await (supabase
            .from('transactions') as any)
            .update({
                status: 'COMPLETED',
                updated_at: new Date().toISOString()
            })
            .eq('id', transactionId)

        if (updateError) return { success: false, message: 'İşlem güncellenemedi.' }

        // 3. Fulfill Purchase
        const result = await fulfillPurchaseAction(transactionId)
        if (!result.success) {
            return { success: false, message: result.error || 'Ödeme alındı ancak işlem tamamlanamadı. Lütfen destekle iletişime geçin.' }
        }

        return {
            success: true,
            message: 'Ödeme başarılı! İşleminiz tamamlandı.',
            courseId: (transaction as any).course_id,
            type: ((transaction as any).metadata as any)?.type
        }

    } catch (error) {
        console.error('Verification error:', error)
        return { success: false, message: 'Doğrulama hatası.' }
    }
}
