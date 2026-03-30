'use server'

import { createAdminClient, createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { calculateLevel, getXpForLevel } from '@/lib/xp-utils'

// Utility functions removed from here and moved to @/lib/xp-utils

/**
 * Add XP to a student and update their streak/level.
 * This function should only be called from other server actions.
 */
export async function addXpAction(
    studentId: string,
    amount: number,
    reason: string,
    referenceId?: string
) {
    try {
        const supabase = await createAdminClient() // Use admin client to bypass RLS for updates

        // 1. Record the transaction
        await (supabase.from('xp_transactions') as any).insert({
            student_id: studentId,
            xp_amount: amount,
            reason: reason,
            reference_id: referenceId
        })

        // 2. Get current XP record
        const { data: currentXp } = await (supabase
            .from('student_xp') as any)
            .select('*')
            .eq('student_id', studentId)
            .maybeSingle()

        const oldXp = currentXp?.total_xp || 0
        const newXp = oldXp + amount
        const oldLevel = currentXp?.current_level || 1
        const newLevel = calculateLevel(newXp)

        // 3. Update student_xp record
        const today = new Date().toISOString().split('T')[0]
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

        let newStreak = currentXp?.streak_days || 0
        const lastActivity = currentXp?.last_activity_date

        if (!lastActivity || lastActivity < yesterday) {
            newStreak = 1 // Reset streak if missed a day
        } else if (lastActivity === yesterday) {
            newStreak += 1 // Increment streak
        }
        // If lastActivity === today, streak stays the same

        await (supabase.from('student_xp') as any).upsert({
            student_id: studentId,
            total_xp: newXp,
            current_level: newLevel,
            streak_days: newStreak,
            last_activity_date: today,
            updated_at: new Date().toISOString()
        })

        // 4. Update daily_activity
        const { data: daily } = await supabase
            .from('daily_activity')
            .select('*')
            .eq('student_id', studentId)
            .eq('activity_date', today)
            .maybeSingle()

        if (daily) {
            await (supabase.from('daily_activity') as any).update({
                xp_earned: (daily as any).xp_earned + amount,
                lessons_watched: reason === 'LESSON_COMPLETED' ? (daily as any).lessons_watched + 1 : (daily as any).lessons_watched
            }).eq('id', (daily as any).id)
        } else {
            await (supabase.from('daily_activity') as any).insert({
                student_id: studentId,
                activity_date: today,
                xp_earned: amount,
                lessons_watched: reason === 'LESSON_COMPLETED' ? 1 : 0
            })
        }

        // 5. Check for milestones / notifications
        if (newLevel > oldLevel) {
            await (supabase.from('notifications') as any).insert({
                user_id: studentId,
                title: 'Seviye Atladın! 🎉',
                message: `${newLevel}. seviyeye ulaştın! Tebrikler!`,
                type: 'SYSTEM',
                link: '/student'
            })
        }

        // Streak milestones
        if (newStreak === 7 && lastActivity === yesterday) {
            await addXpAction(studentId, 50, 'STREAK_7_DAYS')
            await (supabase.from('notifications') as any).insert({
                user_id: studentId,
                title: '7 Günlük Seri! 🔥',
                message: 'Harikasın! 7 gündür aktifsin ve +50 XP kazandın!',
                type: 'SYSTEM',
                link: '/student'
            })
        } else if (newStreak === 30 && lastActivity === yesterday) {
            await addXpAction(studentId, 200, 'STREAK_30_DAYS')
            await (supabase.from('notifications') as any).insert({
                user_id: studentId,
                title: '30 Günlük Seri! 🏆',
                message: 'Muhteşemsin! 30 günlük seri ile +200 XP kazandın!',
                type: 'SYSTEM',
                link: '/student'
            })
        }

        revalidatePath('/student')
        return { success: true }
    } catch (error) {
        console.error('Error adding XP:', error)
        return { success: false, error: 'XP güncellenirken hata oluştu' }
    }
}

/**
 * Award XP for daily login (first time today).
 */
export async function handleDailyLoginXp() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const adminSupabase = await createAdminClient()
        const today = new Date().toISOString().split('T')[0]

        // Check if already awarded today
        const { data: xpRecord } = await adminSupabase
            .from('student_xp')
            .select('last_activity_date, streak_days')
            .eq('student_id', user.id)
            .maybeSingle()

        // Check if already awarded today (normalize timestamp to date)
        const lastActivity = (xpRecord as any)?.last_activity_date
            ? new Date((xpRecord as any).last_activity_date).toISOString().split('T')[0]
            : null

        if (lastActivity === today) {
            return // Already logged in today
        }

        // Check for broken streak notification (if missed yesterday)
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
        if (lastActivity && lastActivity < yesterday && (xpRecord as any).streak_days > 0) {
            // Safeguard: Check if we haven't already notified about a broken streak today
            const { data: existingNotif } = await adminSupabase
                .from('notifications')
                .select('id')
                .eq('user_id', user.id)
                .eq('title', 'Serin Bozuldu 😢')
                .gte('created_at', today + ' 00:00:00')
                .maybeSingle()

            if (!existingNotif) {
                await (adminSupabase.from('notifications') as any).insert({
                    user_id: user.id,
                    title: 'Serin Bozuldu 😢',
                    message: 'Bugün ders yaparak yeni bir seri başlat!',
                    type: 'SYSTEM',
                    link: '/student'
                })
            }
        }

        // Award login XP
        await addXpAction(user.id, 5, 'DAILY_LOGIN')

    } catch (error) {
        console.error('Daily login XP error:', error)
    }
}

export async function getStudentXpData(studentId?: string) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return null

        const targetId = studentId || user.id

        const { data } = await (supabase
            .from('student_xp') as any)
            .select('*')
            .eq('student_id', targetId)
            .maybeSingle()

        return data
    } catch (error) {
        console.error('getStudentXpData error:', error)
        return null
    }
}

export async function getDailyActivityHistory(studentId?: string) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return []

        const targetId = studentId || user.id

        // Fetch last 7 days including today
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
        const dateStr = sevenDaysAgo.toISOString().split('T')[0]

        const { data } = await (supabase
            .from('daily_activity') as any)
            .select('*')
            .eq('student_id', targetId)
            .gte('activity_date', dateStr)
            .order('activity_date', { ascending: true })

        return data || []
    } catch (error) {
        console.error('getDailyActivityHistory error:', error)
        return []
    }
}
