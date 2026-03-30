import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('Supabase URL and Service Key are required to run this script.')
    process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

const seedReviews = [
    {
        name: "Fuat",
        date: "2025-07-31",
        rating: 5,
        text: "Beklentilerin çok ötesinde bir öğretmen! Son derece sabırlı, anlayışlı ve öğrenciyle gerçekten güzel bir iletişim kuruyor. Anlatımı sade, akıcı ve motive edici. Gönül rahatlığıyla herkese tavsiye ederim."
    },
    {
        name: "Faruk",
        date: "2025-12-29",
        rating: 5,
        text: "Ziad Hocam mükemmel bir öğretmen ve çok cana yakın. Özel ders müfredatı sayesinde Arapça öğrenmek benim için çok keyifli bir hale geldi, dile resmen aşık oldum."
    },
    {
        name: "Sait",
        date: "2025-07-03",
        rating: 5,
        text: "Aktarımları etkili ve anlaşılır bir hoca. Fasih ve lehçe için hazırladığı metinler günlük kullanıma uygun, faydalı diyaloglar içermekte."
    },
    {
        name: "Mehmet",
        date: "2025-10-17",
        rating: 5,
        text: "Çok iyi öğretmen kısa sürede dil alanında kendini ileri taşımak isteyenlere Ziad öğretmeni tavsiye ederim. Akıcı güzel anlatış biçimiyle arapça öğrenmek isteyenler kendine bir şeyler katar."
    },
    {
        name: "Ali",
        date: "2025-06-19",
        rating: 5,
        text: "Ziad'ı şiddetle tavsiye ediyorum! Son derece sabırlı ve her şeyi tam olarak anlayana kadar sizinle tekrar tekrar gözden geçirecek. Her zaman nazik ve destekleyici."
    },
    {
        name: "tm.",
        date: "2025-12-09",
        rating: 5,
        text: "Kendisi dersler ile cok ilgili, henuz sadece iki ders almama ragmen cok iyi bir ilerleme kaydedecegimizi dusunuyorum. Arapcayi dogru bir sekilde konusmaniz icin caba sarf ediyor. Ben memnun kaldim."
    },
    {
        name: "Mahmoud",
        date: "2025-12-05",
        rating: 5,
        text: "Sadece bir ders aldım, ama öğretmenin çok profesyonel olması ve her şeyi net bir şekilde açıklaması nedeniyle devam etmek istiyorum. Onunla öğrenmeye devam etmek için heyecanlıyım."
    },
    {
        name: "Abdullah",
        date: "2025-08-11",
        rating: 5,
        text: "Çocuklarla iletişimi iyi elhamdulillah. Çalışkan, gayretli, sabırlı, düzenli, güler yüzlü bir öğretmen… Allah razı olacağı ameller nasip etsin"
    },
    {
        name: "Muhammed",
        date: "2025-08-08",
        rating: 5,
        text: "MaşaAllah La kuvvete illa billah; çok zeki, yardımsever, mütebessim bir öğretmen. Ayrıca düzenli ve şefkatli. Çocuklarım onu seviyor ve ondan memnun kalıyor.. güzel kaynak eserlerle güzel dersler işliyor, çocukları konuşmak için cesaretlendiriyor…"
    }
]

async function migrateReviews() {
    console.log('Starting review migration...')

    try {
        // 1. Get a random active course ID to attach reviews to
        const { data: courses, error: coursesError } = await supabase
            .from('courses')
            .select('id')
            .limit(1)

        if (coursesError || !courses || courses.length === 0) {
            console.error('Error fetching courses. Please ensure you have at least one course created.', coursesError)
            return
        }

        const courseId = courses[0].id

        // Create mock users and attach comments
        for (const review of seedReviews) {
            console.log(`Processing review for ${review.name}...`)

            // Create a fake student profile specifically for this review
            const mockUserId = crypto.randomUUID()

            const { error: profileError } = await supabase.auth.admin.createUser({
                email: `student_${Date.now()}_${Math.random().toString(36).substring(7)}@example.com`,
                password: 'password123',
                email_confirm: true,
                user_metadata: {
                    full_name: review.name,
                    role: 'student'
                }
            })

            // Note: Since auth.admin.createUser automatically creates a row in 'profiles'
            // due to our database triggers, we just need to get the user ID.
            // But doing this 9 times via admin API is slow and might hit rate limits.

            // Alternative: Insert directly into profiles table (bypassing auth for dummy data)
            // This is safer and faster for mock data migration.
            const fakeUserId = crypto.randomUUID()
            const fakeEmail = `student_${Date.now()}_${Math.random().toString(36).substring(7)}@example.com`

            // Insert into Auth first so FK constraint passes
            const { data: authUser, error: authErr } = await supabase.auth.admin.createUser({
                email: fakeEmail,
                password: 'password123',
                email_confirm: true,
                user_metadata: { full_name: review.name, role: 'student' }
            })

            if (authErr) {
                console.error(`Failed to create fake auth user for ${review.name}:`, authErr)
                continue
            }

            const actualUserId = authUser.user.id

            // Insert the comment
            const { error: commentErr } = await supabase
                .from('comments')
                .insert({
                    user_id: actualUserId,
                    course_id: courseId,
                    content: review.text,
                    rating: review.rating,
                    is_approved: true, // We approve them by default
                    created_at: new Date(review.date).toISOString()
                })

            if (commentErr) {
                console.error(`Failed to insert comment for ${review.name}:`, commentErr)
            } else {
                console.log(`Successfully migrated review for ${review.name}`)
            }
        }

        console.log('Migration completed successfully!')

    } catch (err) {
        console.error('Migration failed:', err)
    }
}

migrateReviews()
