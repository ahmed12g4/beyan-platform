import { createClient } from '@supabase/supabase-js';

// Read from environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Safety check
if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error("Missing Supabase environment variables");
}

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function run() {
    console.log("Checking live_sessions...");
    const { data: liveSessions, error: err1 } = await supabase
        .from('live_sessions')
        .select('*');

    if (err1) console.error(err1);
    else console.log(JSON.stringify(liveSessions, null, 2));

    console.log("Checking bookings...");
    const { data: bookings, error: err2 } = await supabase
        .from('bookings')
        .select('*');

    if (err2) console.error(err2);
    else console.log(JSON.stringify(bookings, null, 2));
}

run();
