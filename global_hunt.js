const { createClient } = require('@supabase/supabase-js');

const sbUrl = "https://bgrbbvzegcqmvgqiadry.supabase.co";
const sbKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJncmJidnplZ2NxbXZncWlhZHJ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjQ0NTE5OCwiZXhwIjoyMDg4MDIxMTk4fQ.ue61x3QGY3hjxPvjAoIMIJpeywmp1XE46GTaIzd9G-w";

const supabase = createClient(sbUrl, sbKey);

const uid = "62890286-a12e-4f37-9ce3-76074c3b7ac9";

async function globalHunt() {
    // We can't query information_schema directly via JS client usually.
    // However, we can try to find all tables by checking them one by one from common TCS project names.
    const potentialTables = [
        "users", "employee_profiles", "exam_shifts", "shift_assignments", "payments", 
        "notifications", "audit_logs", "tcs_centers", "activity_log", "admin_logs", 
        "employee_bank_details", "payment_history", "broadcast_logs", "center_admins",
        "attendance", "center_sequences"
    ];

    const potentialCols = [
        "id", "user_id", "employee_id", "admin_id", "created_by", "updated_by", 
        "approved_by", "cleared_by", "created_by_admin", "created_by_super"
    ];

    console.log(`Global hunt for dependencies of ${uid}...`);

    for (const table of potentialTables) {
        for (const col of potentialCols) {
            try {
                const { data, error } = await supabase
                    .from(table)
                    .select('*')
                    .eq(col, uid)
                    .limit(1);
                
                if (!error && data && data.length > 0) {
                    console.log(`!!! FOUND matching row in [${table}] column [${col}]`);
                }
            } catch (e) {
                // table/col doesn't exist
            }
        }
    }
    console.log("Global hunt complete.");
}

globalHunt().catch(console.error);
