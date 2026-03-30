import { createClient } from '@supabase/supabase-js';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function run() {
    console.log("Fetching mock users from profiles...");
    const { data: users, error } = await supabase.from('profiles').select('id, email').like('email', 'student_%@example.com');

    if (error) {
        console.error("Error fetching users:", error.message);
        return;
    }

    if (!users || users.length === 0) {
        console.log("No mock users found.");
        return;
    }

    console.log(`Found ${users.length} mock users. Deleting now...`);

    for (const u of users) {
        console.log(`Deleting ${u.email}...`);

        // 1. Delete from Auth (Triggers will delete from profiles naturally... or we delete both just in case)
        const { error: deleteErr } = await supabase.auth.admin.deleteUser(u.id);

        if (deleteErr) {
            console.error(`Error deleting Auth user ${u.id}:`, deleteErr.message);
            // fallback: delete profile manually if auth fails
            await supabase.from('profiles').delete().eq('id', u.id);
        } else {
            console.log(`Deleted successfully.`);
        }
    }
    console.log("All done!");
}
run();
