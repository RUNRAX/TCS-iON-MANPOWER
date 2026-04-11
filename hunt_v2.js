const { createClient } = require('@supabase/supabase-js');

const sbUrl = "https://bgrbbvzegcqmvgqiadry.supabase.co";
const sbKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJncmJidnplZ2NxbXZncWlhZHJ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjQ0NTE5OCwiZXhwIjoyMDg4MDIxMTk4fQ.ue61x3QGY3hjxPvjAoIMIJpeywmp1XE46GTaIzd9G-w";

const supabase = createClient(sbUrl, sbKey);

async function findFKs() {
    // This query finds all foreign keys pointing to public.users
    const { data, error } = await supabase.rpc('get_foreign_keys', { table_name: 'users', schema_name: 'public' });
    
    // Wait, I might not have a RPC named 'get_foreign_keys'.
    // Let's try a direct query if possible, but JS client doesn't support raw SQL.
    // I will try to use information_schema via standard .from().select() if it's exposed.
    // Usually it's NOT exposed.

    // Let's fallback to checking known tables manually based on migration files.
    const tables = [
        "users",
        "employee_profiles",
        "exam_shifts",
        "shift_assignments",
        "payments",
        "notifications",
        "audit_logs",
        "tcs_centers",
        "center_sequences",
        "activity_log"
    ];

    const columns = [
        "user_id",
        "employee_id",
        "created_by",
        "updated_by",
        "approved_by",
        "cleared_by",
        "created_by_admin",
        "created_by_super"
    ];

    const targetUids = [
        "42cfc945-d7ac-44d2-9ba7-6ffa605068c4",
        "62890286-a12e-4f37-9ce3-76074c3b7ac9"
    ];

    for (const uid of targetUids) {
        console.log(`\nChecking dependencies for ${uid}`);
        for (const table of tables) {
            for (const col of columns) {
                try {
                    const { data: rows, error: colError } = await supabase
                        .from(table)
                        .select('*')
                        .eq(col, uid)
                        .limit(5);
                    
                    if (colError) continue;
                    if (rows && rows.length > 0) {
                        console.log(`Found ${rows.length} rows in ${table}.${col}`);
                    }
                } catch (e) {}
            }
        }
    }
}

findFKs().catch(console.error);
