'use server'

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type CreateSessionInput = {
    course_id?: string | null;
    title: string;
    description?: string;
    session_date: string; // ISO string
    duration_minutes: number;
    meet_url: string;
    teacher_id: string; // Explicitly passed or derived
}

export async function getAdminWeeklySessions(startDate: string, endDate: string) {
    const supabase = await createAdminClient();

    // 1. Fetch Group/Live Sessions
    const { data: liveSessions } = await supabase
        .from('live_sessions')
        .select(`
            *,
            course:courses(title, thumbnail_url),
            teacher:profiles!live_sessions_teacher_id_fkey(full_name, avatar_url)
        `)
        .gte('session_date', startDate)
        .lte('session_date', endDate)
        .order('session_date', { ascending: true });

    // 2. Fetch Private Bookings
    const { data: bookings } = await (supabase
        .from('bookings') as any)
        .select(`
            *,
            student:profiles!student_id(full_name, avatar_url),
            teachers!teacher_id (
                profiles!user_id (full_name, avatar_url)
            )
        `)
        .neq('status', 'cancelled')
        .gte('booking_date', startDate.split('T')[0])
        .lte('booking_date', endDate.split('T')[0]);

    const formattedBookings = (bookings || []).map((b: any) => ({
        id: b.id,
        title: `Özel Ders: ${b.student?.full_name || 'Öğrenci'}`,
        session_date: `${b.booking_date}T${b.start_time}`,
        duration_minutes: b.duration_minutes || 60,
        course: { title: 'Özel Ders', thumbnail_url: null },
        teacher: {
            full_name: b.teachers?.profiles?.full_name || 'Eğitmen',
            avatar_url: b.teachers?.profiles?.avatar_url || null
        },
        student: {
            full_name: b.student?.full_name || 'Öğrenci',
            avatar_url: b.student?.avatar_url || null
        },
        meet_url: b.meet_url,
        status: b.status?.toUpperCase() || 'SCHEDULED',
        type: 'PRIVATE'
    }));

    const formattedLive = (liveSessions || []).map((s: any) => ({
        ...s,
        status: s.status || 'SCHEDULED',
        type: 'GROUP'
    }));

    return [...formattedLive, ...formattedBookings].sort((a, b) =>
        new Date(a.session_date).getTime() - new Date(b.session_date).getTime()
    );
}

export async function getAllAdminSessions() {
    const lookback = new Date();
    lookback.setDate(lookback.getDate() - 7);
    const future = new Date();
    future.setDate(future.getDate() + 30);
    return getAdminWeeklySessions(lookback.toISOString(), future.toISOString());
}

export async function createLiveSession(data: CreateSessionInput) {
    const supabase = await createClient();

    try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) return { success: false, error: "Unauthorized" };

        // Verify role is admin or teacher
        const { data: profile } = await (supabase.from('profiles').select('role').eq('id', user.id) as any).single();
        const role = (profile as any)?.role;
        
        if (role !== 'admin' && role !== 'teacher') {
            return { success: false, error: "Only admins and teachers can create sessions" };
        }

        // If teacher, they can only create sessions for themselves
        const finalTeacherId = role === 'teacher' ? user.id : data.teacher_id;

        const { error } = await (supabase.from('live_sessions') as any).insert({
            course_id: (data.course_id || null) as any,
            title: data.title,
            description: data.description,
            session_date: data.session_date,
            duration_minutes: data.duration_minutes,
            meet_url: data.meet_url,
            teacher_id: finalTeacherId,
            created_by: user.id
        });

        if (error) {
            console.error("Create session error:", error);
            return { success: false, error: "Failed to create session" };
        }

        // Notify Enrolled Students (Only if course is attached)
        if (data.course_id) {
            const { data: enrollments } = await supabase
                .from('enrollments')
                .select('student_id')
                .eq('course_id', data.course_id);
                
            if (enrollments && enrollments.length > 0) {
                const notifications = (enrollments as any[]).map((e: any) => ({
                     user_id: e.student_id,
                     title: "Yeni Canlı Ders Planlandı",
                     message: `${data.title} konulu yeni bir canlı ders planlandı.`,
                     type: 'SYSTEM'
                }));
                await (supabase.from('notifications') as any).insert(notifications);
            }
        }

        revalidatePath('/admin/sessions');
        revalidatePath('/teacher/schedule');
        revalidatePath('/student');
        return { success: true, message: "Session scheduled successfully" };
    } catch (e) {
        return { success: false, error: "Unexpected error" };
    }
}

export async function getAdminSessions() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // Verify role is admin
    const { data: profile } = await (supabase.from('profiles').select('role').eq('id', user.id) as any).single();
    if ((profile as any)?.role !== 'admin') return [];

    // Fetch sessions with course and teacher details
    const { data, error } = await supabase
        .from('live_sessions')
        .select(`
            *,
            course:courses(title),
            teacher:profiles!live_sessions_teacher_id_fkey(full_name, email)
        `)
        .order('session_date', { ascending: true });

    if (error) {
        console.error("Fetch admin sessions error:", error);
        return [];
    }

    return data;
}

// ... inside getTeacherSessions
export async function getTeacherSessions() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const lookback = new Date();
    lookback.setHours(lookback.getHours() - 12);

    // Get teacher id first
    const { data: teacher } = await supabase
        .from('teachers')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

    if (!teacher) return [];
    const tid = (teacher as any).id;

    // 1. Fetch Group Sessions (live_sessions) - Uses user.id
    const { data: liveSessions } = await (supabase
        .from('live_sessions') as any)
        .select(`
            *,
            course:courses(title)
        `)
        .eq('teacher_id', user.id)
        .gte('session_date', lookback.toISOString())
        .order('session_date', { ascending: true });

    // 2. Fetch Private Bookings - Uses tid (teachers.id)
    const { data: bookings } = await (supabase
        .from('bookings') as any)
        .select(`
            *,
            profiles!student_id(full_name)
        `)
        .eq('teacher_id', tid)
        .neq('status', 'cancelled')
        .gte('booking_date', lookback.toISOString().split('T')[0])
        .order('booking_date', { ascending: true });

    const formattedBookings = (bookings || []).map((b: any) => ({
        id: b.id,
        title: `Birebir Ders: ${b.profiles?.full_name || 'Öğrenci'}`,
        session_date: `${b.booking_date}T${b.start_time}`,
        duration_minutes: 60,
        course: { title: 'Özel Ders' },
        status: b.status === 'confirmed' ? 'SCHEDULED' : b.status,
        meet_url: b.meet_url || '',
        type: 'PRIVATE'
    }));

    const formattedLive = (liveSessions || []).map((s: any) => ({
        ...s,
        session_date: s.session_date,
        type: 'GROUP'
    }));

    return [...formattedLive, ...formattedBookings].sort((a, b) =>
        new Date(a.session_date).getTime() - new Date(b.session_date).getTime()
    );
}

export async function confirmSessionAttendance(sessionId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Unauthorized" };

    const { error } = await (supabase
        .from('live_sessions') as any)
        .update({ is_confirmed_by_teacher: true })
        .eq('id', sessionId)
        .eq('teacher_id', user.id); // Security: only assigned teacher can confirm

    if (error) return { success: false, error: "Failed to confirm" };



    revalidatePath('/teacher/dashboard');
    return { success: true };
}

// ... inside getStudentSessions
export async function getStudentSessions(options?: { startDate?: string; endDate?: string }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    let startDate = options?.startDate;
    let endDate = options?.endDate;

    if (!startDate) {
        const lookback = new Date();
        lookback.setHours(lookback.getHours() - 12);
        startDate = lookback.toISOString();
    }

    // 1. Fetch Group/Live Sessions
    let liveQuery = supabase
        .from('live_sessions')
        .select(`
            *,
            course:courses(title, thumbnail_url),
            teacher:profiles!live_sessions_teacher_id_fkey(full_name, avatar_url)
        `)
        .gte('session_date', startDate);

    if (endDate) {
        liveQuery = liveQuery.lte('session_date', endDate);
    }

    const { data: liveSessions } = await liveQuery.order('session_date', { ascending: true });

    // 2. Fetch Private Bookings
    let bookingQuery = (supabase
        .from('bookings') as any)
        .select(`
            *,
            teachers!teacher_id (
                profiles!user_id (full_name, avatar_url)
            )
        `)
        .eq('student_id', user.id)
        .neq('status', 'cancelled')
        .gte('booking_date', startDate.split('T')[0]);

    if (endDate) {
        bookingQuery = bookingQuery.lte('booking_date', endDate.split('T')[0]);
    }

    const { data: bookings } = await bookingQuery.order('booking_date', { ascending: true });

    const formattedBookings = (bookings || []).map((b: any) => ({
        id: b.id,
        title: 'Özel Ders',
        session_date: `${b.booking_date}T${b.start_time}`,
        duration_minutes: b.duration_minutes || 60,
        course: { title: 'Özel Ders', thumbnail_url: null },
        teacher: {
            full_name: b.teachers?.profiles?.full_name || 'Eğitmen',
            avatar_url: b.teachers?.profiles?.avatar_url || null
        },
        meet_url: b.meet_url,
        status: b.status?.toUpperCase() || 'SCHEDULED',
        type: 'PRIVATE'
    }));

    const formattedLive = (liveSessions || []).map((s: any) => ({
        ...s,
        status: s.status || 'SCHEDULED',
        type: 'GROUP'
    }));

    return [...formattedLive, ...formattedBookings].sort((a, b) =>
        new Date(a.session_date).getTime() - new Date(b.session_date).getTime()
    );
}

export async function deleteSession(sessionId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Unauthorized" };

    // Verify role is admin
    const { data: profile } = await (supabase.from('profiles').select('role').eq('id', user.id) as any).single();
    if ((profile as any)?.role !== 'admin') return { success: false, error: "Unauthorized" };

    const { error } = await supabase.from('live_sessions').delete().eq('id', sessionId);

    if (error) return { success: false, error: "Failed to delete" };
    revalidatePath('/admin/sessions');
    return { success: true };
}

export async function updateSessionRecording(sessionId: string, recordingUrl: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Unauthorized" };

    const { error } = await (supabase
        .from('live_sessions') as any)
        .update({ recording_url: recordingUrl } as any)
        .eq('id', sessionId)
        .eq('teacher_id', user.id); // Security: only assigned teacher can update

    if (error) return { success: false, error: "Failed to update recording" };

    revalidatePath('/teacher/schedule');
    revalidatePath('/student');
    return { success: true };
}

export async function startSession(sessionId: string, type: 'PRIVATE' | 'GROUP' = 'GROUP') {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Unauthorized" };

    if (type === 'GROUP') {
        const { error } = await (supabase
            .from('live_sessions') as any)
            .update({ status: 'LIVE' } as any)
            .eq('id', sessionId)
            .eq('teacher_id', user.id);
        if (error) return { success: false, error: "Failed to start session" };
    } else {
        // For private bookings
        const { error } = await (supabase
            .from('bookings') as any)
            .update({ status: 'live' } as any)
            .eq('id', sessionId);
        if (error) return { success: false, error: "Failed to start private session" };
    }

    revalidatePath('/student');
    revalidatePath('/teacher');
    revalidatePath('/student/live');
    return { success: true };
}

export async function endSession(sessionId: string, type: 'PRIVATE' | 'GROUP' = 'GROUP') {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Unauthorized" };

    if (type === 'GROUP') {
        const { error } = await (supabase
            .from('live_sessions') as any)
            .update({ status: 'ENDED' } as any)
            .eq('id', sessionId)
            .eq('teacher_id', user.id);
        if (error) return { success: false, error: "Failed to end session" };
    } else {
        // For private bookings
        const { error } = await (supabase
            .from('bookings') as any)
            .update({ status: 'completed' } as any)
            .eq('id', sessionId);
        if (error) return { success: false, error: "Failed to end private session" };
    }

    revalidatePath('/student');
    revalidatePath('/teacher');
    revalidatePath('/student/live');
    return { success: true };
}

export async function cancelBookingAction(bookingId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Unauthorized" };

    try {
        // 1. Get booking details
        const { data: booking, error: fetchError } = await supabase
            .from('bookings')
            .select('*, teachers(user_id)')
            .eq('id', bookingId)
            .single();

        if (fetchError || !booking) return { success: false, error: "Booking not found" };

        // Security: only teacher or student can cancel
        const isTeacher = (booking as any).teachers?.user_id === user.id;
        const isStudent = (booking as any).student_id === user.id;

        if (!isTeacher && !isStudent) return { success: false, error: "Unauthorized" };

        // 2. Update booking status
        const { error: updateError } = await (supabase
            .from('bookings') as any)
            .update({ status: 'cancelled' })
            .eq('id', bookingId);

        if (updateError) return { success: false, error: "Failed to cancel booking" };

        // 3. Refund balance to student (increment)
        const { error: balanceError } = await (supabase.from('student_lesson_balance') as any)
            .select('lessons_remaining')
            .eq('student_id', (booking as any).student_id)
            .eq('teacher_id', (booking as any).teacher_id)
            .single();

        if (!balanceError) {
            const { data: currentBalance } = await (supabase
                .from('student_lesson_balance') as any)
                .select('lessons_remaining')
                .eq('student_id', (booking as any).student_id)
                .eq('teacher_id', (booking as any).teacher_id)
                .single();

            await (supabase.from('student_lesson_balance') as any)
                .update({ lessons_remaining: ((currentBalance as any).lessons_remaining || 0) + 1 })
                .eq('student_id', (booking as any).student_id)
                .eq('teacher_id', (booking as any).teacher_id);
        }

        // 4. Send Notification if cancelled by teacher
        if (isTeacher) {
            await (supabase.from('notifications') as any).insert({
                user_id: (booking as any).student_id,
                title: "Rezervasyon İptal Edildi",
                message: `Hocanız ${(booking as any).booking_date} tarihindeki dersinizi iptal etti. Ders krediniz iade edildi.`,
                type: 'SYSTEM'
            });
        }

        revalidatePath('/student/my-lessons');
        revalidatePath('/teacher/dashboard');
        revalidatePath('/teacher/sessions');

        return { success: true };
    } catch (e) {
        console.error(e);
        return { success: false, error: "Unexpected error" };
    }
}

export async function addAvailabilityAction(dayOfWeek: number, startTime: string, endTime: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Unauthorized" };

    // Get or Create teacher record
    let { data: teacher } = await supabase
        .from('teachers')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

    if (!teacher) {
        // Fallback: Check if they are a teacher in profiles and create the record
        const { data: profile } = await (supabase.from('profiles').select('role, full_name').eq('id', user.id) as any).single();
        if ((profile as any)?.role === 'teacher') {
            const { data: newTeacher, error: createError } = await (supabase.from('teachers') as any)
                .insert({
                    user_id: user.id,
                    full_name: (profile as any).full_name || 'Eğitmen',
                    price_per_lesson: 0,
                    is_available: true
                })
                .select('id')
                .single();

            if (createError) return { success: false, error: "Teacher profile could not be initialized. Please contact support." };
            teacher = newTeacher;
        } else {
            return { success: false, error: "Teacher profile not found and user role is not 'teacher'." };
        }
    }

    const { error } = await (supabase.from('teacher_availability') as any).insert({
        teacher_id: (teacher as any).id,
        day_of_week: dayOfWeek,
        start_time: startTime,
        end_time: endTime,
        is_booked: false
    });

    if (error) return { success: false, error: "Failed to add availability" };

    revalidatePath('/teacher/schedule');
    if (teacher) {
        revalidatePath(`/teachers/${(teacher as any).id}`);
    }
    return { success: true };
}

export async function deleteAvailabilityAction(availabilityId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Unauthorized" };

    const { error } = await supabase
        .from('teacher_availability')
        .delete()
        .eq('id', availabilityId);

    if (error) return { success: false, error: "Failed to delete availability" };

    revalidatePath('/teacher/schedule');
    return { success: true };
}

export async function resetSessionStatus(sessionId: string) {
    const supabase = await createClient();

    // Check if admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Unauthorized" };

    const { data: profile } = await (supabase.from('profiles').select('role').eq('id', user.id) as any).single();
    if ((profile as any)?.role !== 'admin') return { success: false, error: "Unauthorized" };

    const { error } = await (supabase
        .from('live_sessions') as any)
        .update({ status: 'SCHEDULED' })
        .eq('id', sessionId);

    if (error) return { success: false, error: "Failed to reset session" };

    revalidatePath('/admin/sessions');
    revalidatePath('/teacher');
    revalidatePath('/student');
    return { success: true };
}

export async function getDetailedTeacherSessions(options: { startDate: string; endDate: string }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { availability: [], sessions: [] };

    // 1. Get teacher record
    const { data: teacher } = await supabase
        .from('teachers')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

    if (!teacher) return { availability: [], sessions: [] };
    const tid = (teacher as any).id;

    // 2. Fetch Recurring Availability
    const { data: avail } = await (supabase
        .from('teacher_availability') as any)
        .select('*')
        .eq('teacher_id', tid)
        .eq('is_booked', false);

    // 3. Fetch Private Bookings
    const { data: bookings } = await (supabase
        .from('bookings') as any)
        .select('*, student:profiles!student_id(full_name, avatar_url)')
        .eq('teacher_id', tid)
        .neq('status', 'cancelled')
        .gte('booking_date', options.startDate.split('T')[0])
        .lte('booking_date', options.endDate.split('T')[0]);

    // 4. Fetch Group Sessions
    const { data: liveSessions } = await supabase
        .from('live_sessions')
        .select(`
            *,
            course:courses(title, thumbnail_url),
            group:groups(title)
        `)
        .eq('teacher_id', user.id)
        .gte('session_date', options.startDate)
        .lte('session_date', options.endDate);

    const formattedAvail = (avail || []).map((a: any) => ({
        id: a.id,
        type: 'AVAILABILITY',
        day_of_week: a.day_of_week,
        start_time: a.start_time,
        end_time: a.end_time,
        title: 'Müsait',
        status: 'OPEN'
    }));

    const formattedBookings = (bookings || []).map((b: any) => ({
        id: b.id,
        type: 'PRIVATE',
        session_date: `${b.booking_date}T${b.start_time}`,
        start_time: b.start_time.substring(0, 5),
        end_time: b.end_time.substring(0, 5),
        title: 'Birebir Özel Ders',
        student_name: b.student?.full_name,
        student_avatar: b.student?.avatar_url,
        status: b.status?.toUpperCase() || 'CONFIRMED',
        meet_url: b.meet_url
    }));

    const formattedLive = (liveSessions || []).map((s: any) => ({
        id: s.id,
        type: 'GROUP',
        session_date: s.session_date,
        start_time: s.session_date.split('T')[1].substring(0, 5),
        title: s.group?.title || s.course?.title || 'Grup Dersi',
        status: s.status || 'SCHEDULED',
        meet_url: s.meet_url,
        recording_url: s.recording_url
    }));

    return {
        availability: formattedAvail,
        sessions: [...formattedBookings, ...formattedLive].sort((a, b) =>
            new Date(a.session_date).getTime() - new Date(b.session_date).getTime()
        )
    };
}

export async function getLiveSessionBannerAction() {
    const supabase = await createClient();
    const now = new Date().toISOString();
    const soon = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour from now

    // Fetch sessions that are either LIVE or starting in the next hour
    // Group sessions usually have a session_date and duration
    const { data, error } = await supabase
        .from('live_sessions')
        .select(`
            *,
            course:courses(title, thumbnail_url),
            teacher:profiles!live_sessions_teacher_id_fkey(full_name, avatar_url)
        `)
        .or(`status.eq.LIVE,and(session_date.gte.${now},session_date.lte.${soon})`)
        .order('session_date', { ascending: true })
        .limit(1)
        .maybeSingle();

    if (error || !data) return null;
    return data;
}

export async function getUpcomingSessionsAction() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const now = new Date().toISOString();
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    // 1. Fetch Group Sessions
    const { data: liveSessions } = await supabase
        .from('live_sessions')
        .select(`
            *,
            course:courses(title)
        `)
        .gte('session_date', now)
        .lte('session_date', tomorrow)
        .order('session_date', { ascending: true });

    // 2. Fetch Private Bookings
    const { data: bookings } = await (supabase
        .from('bookings') as any)
        .select(`
            *,
            student:profiles!student_id(full_name),
            teachers!teacher_id (profiles!user_id (full_name))
        `)
        .eq('status', 'confirmed')
        .gte('booking_date', now.split('T')[0])
        .order('booking_date', { ascending: true });

    const formattedBookings = (bookings || []).map((b: any) => ({
        id: b.id,
        title: `Özel Ders: ${b.student?.full_name || 'Öğrenci'}`,
        session_date: `${b.booking_date}T${b.start_time}`,
        type: 'PRIVATE',
        meet_url: b.meet_url
    }));

    const formattedLive = (liveSessions || []).map((s: any) => ({
        ...s,
        type: 'GROUP'
    }));

    return [...formattedLive, ...formattedBookings].sort((a, b) =>
        new Date(a.session_date).getTime() - new Date(b.session_date).getTime()
    );
}

export async function recordAttendanceAction(sessionId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Unauthorized" };

    try {
        // Check if attendance already recorded
        const { data: existing } = await (supabase
            .from('session_attendance' as any) as any)
            .select('*')
            .eq('session_id', sessionId)
            .eq('student_id', user.id)
            .maybeSingle();

        if (existing) return { success: true, alreadyRecorded: true };

        const { error } = await (supabase.from('session_attendance' as any) as any).insert({
            session_id: sessionId,
            student_id: user.id,
            status: 'PRESENT'
        });

        if (error) throw error;
        return { success: true };
    } catch (err) {
        console.error("Attendance record error:", err);
        return { success: false, error: "Failed to record attendance" };
    }
}

export async function getSessionAttendanceAction(sessionId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await (supabase
        .from('session_attendance' as any) as any)
        .select('*, profiles!student_id(full_name, avatar_url)')
        .eq('session_id', sessionId);

    if (error) {
        console.error("Fetch attendance error:", error);
        return [];
    }

    return data;
}

export async function markNoShowAction(sessionId: string, studentId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Unauthorized" };

    const { error } = await (supabase
        .from('session_attendance' as any) as any)
        .upsert({
            session_id: sessionId,
            student_id: studentId,
            status: 'ABSENT'
        }, { onConflict: 'session_id,student_id' } as any);

    if (error) {
        console.error("Mark no-show error:", error);
        return { success: false, error: "Failed to mark no-show" };
    }

    return { success: true };
}

export async function getGroupStudentsAction(groupId: string) {
    const supabase = await createClient();
    const { data, error } = await (supabase
        .from('group_enrollments') as any)
        .select('student_id, profiles!student_id(full_name, avatar_url)')
        .eq('group_id', groupId)
        .eq('status', 'ACTIVE');
    
    if (error) {
        console.error("Fetch group students error:", error);
        return [];
    }

    return (data || []).map((d: any) => ({
        id: d.student_id,
        full_name: d.profiles?.full_name,
        avatar_url: d.profiles?.avatar_url
    }));
}




