
import { createAdminClient } from '@/lib/supabase/server'

export async function GET() {
    try {
        const supabase = await createAdminClient()
        const buckets = ['course-content', 'avatars', 'course-thumbnails']
        const results = []

        for (const bucketName of buckets) {
            const { data, error } = await supabase.storage.createBucket(bucketName, {
                public: true
            })
            results.push({ bucket: bucketName, status: error ? (error as any).message : 'Created/Exists' })
        }

        return new Response(JSON.stringify({ results }), { status: 200 })
    } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 })
    }
}
