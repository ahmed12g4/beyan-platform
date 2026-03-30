
import { createClient } from '@/lib/supabase/server'

export async function GET() {
    const supabase = await createClient()
    
    // Check Courses columns
    const { data: courses } = await supabase.from('courses').select('*').limit(1)
    const columns = courses && courses.length > 0 ? Object.keys(courses[0]) : []

    // Check ALL lessons in DB to see what course_ids they have
    const { data: allLessons } = await supabase.from('lessons').select('id, title, course_id').limit(10)

    return new Response(JSON.stringify({ 
        coursesColumns: columns,
        allLessonsCount: allLessons?.length,
        allLessons,
    }), { status: 200 })
}
