import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    // Avoid caching
    const url = new URL(request.url);
    console.log("Checking DB with query:", url.search);
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    
    if (!supabaseUrl || !supabaseKey) return NextResponse.json({ error: 'No env vars' });

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: group_sessions, error: err1 } = await supabase.from('group_sessions').select('*').limit(1);
    const { data: bookings, error: err2 } = await supabase.from('bookings').select('*').limit(2);
    const { data: group_courses, error: err3 } = await supabase.from('group_courses').select('*').limit(2);
    const { data: first_lesson, error: err4 } = await supabase.from('lessons').select('*').limit(1);
    const { count: lessons_count, error: err5 } = await supabase.from('lessons').select('id', { count: 'exact', head: true });

    return NextResponse.json({
        group_sessions,
        bookings,
        group_courses,
        first_lesson,
        courses_count: 1,
        lessons_count: lessons_count ?? 0,
        errors: { err1, err2, err3, err4, err5 }
    });
}
