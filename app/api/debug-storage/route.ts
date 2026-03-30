
import { createClient } from '@/lib/supabase/server'

export async function GET() {
    const supabase = await createClient()
    const { data: buckets, error } = await supabase.storage.listBuckets()
    return new Response(JSON.stringify({ buckets, error }), { status: 200 })
}
