const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manually parse .env.local
const envPath = path.join(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, ...value] = line.split('=');
    if (key && value.length) {
        env[key.trim()] = value.join('=').trim();
    }
});

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseKey = env['SUPABASE_SERVICE_ROLE_KEY'];

const supabase = createClient(supabaseUrl, supabaseKey);

async function listCourses() {
    const { data, error } = await supabase
        .from('courses')
        .select('title, slug, created_at')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching courses:', error);
        return;
    }

    console.log('--- Existing Courses ---');
    if (data.length === 0) {
        console.log('No courses found.');
    } else {
        data.forEach(c => {
            console.log(`Title: ${c.title} | Slug: ${c.slug} | Created: ${c.created_at}`);
        });
    }
}

listCourses();
