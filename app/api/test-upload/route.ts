
import { createAdminClient } from '@/lib/supabase/server'

export async function GET() {
    try {
        const supabase = await createAdminClient()
        const { data, error } = await supabase.storage.from('course-content').upload('test.txt', 'hello world', {
            upsert: true
        })
        return new Response(JSON.stringify({ data, error }), { status: 200 })
    } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 })
    }
}
