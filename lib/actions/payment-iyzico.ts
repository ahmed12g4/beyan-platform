'use server'

import { createClient } from '@/lib/supabase/server'
import iyzico from '@/lib/iyzico'
import { revalidatePath } from 'next/cache'
import { nanoid } from 'nanoid'
import { enrollStudentAction, fulfillPurchaseAction } from './enrollments'

export type PaymentState = {
    success: boolean
    message?: string
    error?: string
    url?: string
}

/**
 * Initiates a payment request with Iyzico.
 * 
 * @param productId The ID of the course, group, or teacher (for packages)
 * @param productType 'course' | 'package' | 'group'
 * @param cardData Card details (not stored, passed directly to Iyzico)
 * @param lessonsCount Optional for packages
 */
export async function createIyzicoPaymentAction(
    productId: string,
    productType: 'course' | 'package' | 'group',
    cardData: {
        cardHolderName: string
        cardNumber: string
        expireMonth: string
        expireYear: string
        cvc: string
    },
    lessonsCount?: number
): Promise<PaymentState> {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) return { success: false, error: 'Lütfen önce giriş yapın.' }

        // 1. Fetch Product Details
        let amount = 0
        let productName = ''
        const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single()

        if (productType === 'course') {
            const { data: course } = await (supabase.from('courses') as any).select('title, price').eq('id', productId).single()
            if (!course) return { success: false, error: 'Kurs bulunamadı.' }
            amount = course.price
            productName = course.title
        } else if (productType === 'group') {
            const { data: group } = await (supabase.from('groups') as any).select('title, price').eq('id', productId).single()
            if (!group) return { success: false, error: 'Grup bulunamadı.' }
            amount = group.price
            productName = group.title
        } else if (productType === 'package') {
            const { data: packageProfile } = await supabase.from('profiles').select('full_name').eq('id', productId).single() as any
            const { data: teacher } = await (supabase.from('teachers') as any).select('price_per_lesson').eq('user_id', productId).single()
            if (!teacher) return { success: false, error: 'Eğitmen bulunamadı veya özel ders vermiyor.' }
            const count = lessonsCount || 4
            amount = (teacher.price_per_lesson || 150) * count
            productName = `${(packageProfile as any)?.full_name || 'Eğitmen'} - ${count} Ders Paketi`
        }

        if (amount <= 0) return { success: false, error: 'Geçersiz tutar.' }

        // 2. Prepare Iyzico Request
        const basketId = `B${nanoid(10)}`
        const paymentId = nanoid(12)

        const request = {
            locale: 'tr',
            conversationId: paymentId,
            price: amount.toString(),
            paidPrice: amount.toString(),
            currency: 'TRY',
            installments: '1',
            basketId: basketId,
            paymentChannel: 'WEB',
            paymentGroup: 'PRODUCT',
            paymentCard: {
                cardHolderName: cardData.cardHolderName,
                cardNumber: cardData.cardNumber,
                expireMonth: cardData.expireMonth,
                expireYear: cardData.expireYear,
                cvc: cardData.cvc,
                registerCard: '0'
            },
            buyer: {
                id: user.id,
                name: (profile as any)?.full_name?.split(' ')[0] || 'User',
                surname: (profile as any)?.full_name?.split(' ').slice(1).join(' ') || 'User',
                gsmNumber: '+905350000000',
                email: user.email,
                identityNumber: '74455555555',
                lastLoginDate: new Date().toISOString().slice(0, 19).replace('T', ' '),
                registrationDate: user.created_at.slice(0, 19).replace('T', ' '),
                registrationAddress: 'N/A',
                ip: '85.34.78.112',
                city: 'Istanbul',
                country: 'Turkey',
                zipCode: '34732'
            },
            shippingAddress: {
                contactName: (profile as any)?.full_name || 'User',
                city: 'Istanbul',
                country: 'Turkey',
                address: 'N/A',
                zipCode: '34732'
            },
            billingAddress: {
                contactName: (profile as any)?.full_name || 'User',
                city: 'Istanbul',
                country: 'Turkey',
                address: 'N/A',
                zipCode: '34732'
            },
            basketItems: [
                {
                    id: productId,
                    name: productName,
                    category1: productType,
                    itemType: 'VIRTUAL',
                    price: amount.toString()
                }
            ]
        }

        // 3. Execute Iyzico Payment
        return new Promise((resolve) => {
            (iyzico.payment as any).create(request, async function (err: any, result: any) {
                if (err) {
                    console.error('Iyzico Payment Error:', err)
                    resolve({ success: false, error: 'Ödeme servisinde hata oluştu.' })
                    return
                }

                if (result.status === 'success') {
                    // Record successful payment
                    await (supabase.from('payments') as any).insert({
                        user_id: user.id,
                        product_type: productType,
                        product_id: productId,
                        amount: amount,
                        currency: 'TRY',
                        status: 'success',
                        iyzico_payment_id: result.paymentId
                    })

                    // Fulfill the purchase (Enrollments, Balance, etc.)
                    await handleFulfillment(user.id, productType, productId, lessonsCount)

                    resolve({ success: true, message: 'Ödeme başarıyla alındı.' })
                } else {
                    // Record failed payment
                    await (supabase.from('payments') as any).insert({
                        user_id: user.id,
                        product_type: productType,
                        product_id: productId,
                        amount: amount,
                        currency: 'TRY',
                        status: 'failed',
                        error_message: result.errorMessage
                    })
                    resolve({ success: false, error: result.errorMessage || 'Ödeme başarısız.' })
                }
            })
        })

    } catch (error: any) {
        console.error('Unified Payment Action Error:', error)
        return { success: false, error: error.message || 'Bir hata oluştu.' }
    }
}

async function handleFulfillment(userId: string, type: string, productId: string, lessonsCount?: number) {
    const supabase = await createClient()

    if (type === 'course') {
        await (supabase.from('enrollments') as any).insert({
            student_id: userId,
            product_id: productId,
            product_type: 'COURSE',
            status: 'active'
        })
        revalidatePath('/student')
        revalidatePath('/student/my-lessons')
    } else if (type === 'group') {
        await (supabase.from('group_enrollments') as any).insert({
            student_id: userId,
            group_id: productId,
            status: 'active'
        })
        revalidatePath('/student')
        revalidatePath('/student/my-lessons')
        revalidatePath('/student/schedule')
    } else if (type === 'package') {
        const count = lessonsCount || 4

        // Use existing balancing logic if available
        const { data: existing } = await supabase
            .from('student_lesson_balance')
            .select('*')
            .eq('student_id', userId)
            .eq('teacher_id', productId)
            .maybeSingle()

        if (existing) {
            await (supabase
                .from('student_lesson_balance') as any)
                .update({
                    lessons_remaining: ((existing as any).lessons_remaining || 0) + count,
                    lessons_total: ((existing as any).lessons_total || 0) + count
                })
                .eq('id', (existing as any).id)
        } else {
            await (supabase
                .from('student_lesson_balance') as any)
                .insert({
                    student_id: userId,
                    teacher_id: productId,
                    lessons_remaining: count,
                    lessons_total: count
                })
        }
        revalidatePath('/student')
        revalidatePath('/student/my-lessons')
    }

    // Send notifications
    try {
        // To Student
        await (supabase.from('notifications' as any) as any).insert({
            user_id: userId,
            title: 'Ödeme Başarılı',
            message: 'Satın alma işleminiz başarıyla tamamlandı. Teşekkür ederiz.',
            type: 'payment_success'
        })

        // To Teacher (if package)
        if (type === 'package') {
            const { data: teacherRecord } = await supabase.from('teachers' as any).select('user_id').eq('id', productId).single() as any;
            const { data: studentRecord } = await supabase.from('profiles' as any).select('full_name').eq('id', userId).single() as any;

            if (teacherRecord) {
                await (supabase.from('notifications' as any) as any).insert({
                    user_id: (teacherRecord as any).user_id,
                    title: 'Yeni Ders Paketi Satışı',
                    message: `${(studentRecord as any)?.full_name || 'Bir öğrenci'} sizden ${lessonsCount || 4} derslik bir paket satın aldı.`,
                    type: 'package_sale'
                });
            }

            // To Admin
            const { data: admins } = await supabase.from('profiles' as any).select('id').eq('role', 'admin') as any;
            if (admins) {
                const adminNotifs = (admins as any[]).map(admin => ({
                    user_id: admin.id,
                    title: 'Özel Ders Paketi Satıldı',
                    message: `Bir öğrenci bir eğitmenden ${lessonsCount || 4} derslik paket satın aldı.`,
                    type: 'package_sale_admin'
                }));
                await (supabase.from('notifications' as any) as any).insert(adminNotifs);
            }
        }
    } catch (err) {
        console.error('Failed to send purchase notifications:', err);
    }
}
