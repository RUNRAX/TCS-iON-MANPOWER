const { createClient } = require('@supabase/supabase-js');

const sbUrl = "https://bgrbbvzegcqmvgqiadry.supabase.co";
const sbKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJncmJidnplZ2NxbXZncWlhZHJ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjQ0NTE5OCwiZXhwIjoyMDg4MDIxMTk4fQ.ue61x3QGY3hjxPvjAoIMIJpeywmp1XE46GTaIzd9G-w";

const supabase = createClient(sbUrl, sbKey);

async function finalAuthCheck() {
    const { data: { users }, error } = await supabase.auth.admin.listUsers();
    if (error) {
        console.error(error);
    } else {
        console.log("Current Auth Users:");
        users.forEach(u => console.log(`- ${u.email} (${u.id})`));
    }
}

finalAuthCheck().catch(console.error);
