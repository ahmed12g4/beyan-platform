
import { createClient } from '../lib/supabase/server';

async function checkSchema() {
    const supabase = await createClient();
    
    console.log("Checking session_attendance table...");
    const { data: attendance, error: attendanceError } = await supabase.from('session_attendance' as any).select('*').limit(1);
    if (attendanceError) {
        console.log("session_attendance table probably missing:", attendanceError.message);
    } else {
        console.log("session_attendance table exists!");
    }

    console.log("Checking live_sessions columns...");
    const { data: live, error: liveError } = await supabase.from('live_sessions').select('*').limit(1);
    if (live) {
        const columns = Object.keys(live[0] || {});
        console.log("live_sessions columns:", columns);
    }

    console.log("Checking bookings columns...");
    const { data: booking, error: bookingError } = await supabase.from('bookings').select('*').limit(1);
    if (booking) {
        const columns = Object.keys(booking[0] || {});
        console.log("bookings columns:", columns);
    }
}

// Since I cannot run this easily, I'll just use the errors in my upcoming server actions to detect missing tables.
// But I'll create the migration file anyway for the user.
