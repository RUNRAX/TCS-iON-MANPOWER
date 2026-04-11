const { createClient } = require('@supabase/supabase-js');

const sbUrl = "https://bgrbbvzegcqmvgqiadry.supabase.co";
const sbKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJncmJidnplZ2NxbXZncWlhZHJ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjQ0NTE5OCwiZXhwIjoyMDg4MDIxMTk4fQ.ue61x3QGY3hjxPvjAoIMIJpeywmp1XE46GTaIzd9G-w";

const supabase = createClient(sbUrl, sbKey);

async function checkUsers() {
    const targetUids = [
        "42cfc945-d7ac-44d2-9ba7-6ffa605068c4",
        "62890286-a12e-4f37-9ce3-76074c3b7ac9"
    ];

    for (const uid of targetUids) {
        console.log(`\nChecking user ${uid} in public.users`);
        const { data: user, error } = await supabase.from('users').select('*').eq('id', uid).single();
        if (error) {
            console.log(`User ${uid} NOT FOUND in public.users: ${error.message}`);
        } else {
            console.log(`User ${uid} FOUND in public.users:`, user);
        }

        console.log(`Checking user ${uid} in auth (admin.getUser)`);
        const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(uid);
        if (authError) {
            console.log(`User ${uid} NOT FOUND in auth: ${authError.message}`);
        } else {
            console.log(`User ${uid} FOUND in auth:`, authUser.user.email);
        }
    }
}

checkUsers().catch(console.error);
