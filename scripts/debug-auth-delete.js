import { createClient } from '@supabase/supabase-js';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function run() {
    const { data: users, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });

    if (error) {
        console.error("Error fetching auth users:", error);
        return;
    }

    const mockUsers = users.users.filter(u => u.email && u.email.startsWith('student_'));
    console.log(`Found ${mockUsers.length} mock auth users.`);

    for (const u of mockUsers) {
        console.log(`Deleting ${u.email}...`);
        const { error: deleteErr } = await supabase.auth.admin.deleteUser(u.id);
        if (deleteErr) {
            console.error("Error:", deleteErr.message);
        } else {
            console.log("Success.");
        }
    }
    console.log("Finished deleting fake auth users.");
}
run();
