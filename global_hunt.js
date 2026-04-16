const { createClient } = require('@supabase/supabase-js');

const sbUrl = "https://bgrbbvzegcqmvgqiadry.supabase.co";
const sbKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJncmJidnplZ2NxbXZncWlhZHJ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjQ0NTE5OCwiZXhwIjoyMDg4MDIxMTk4fQ.ue61x3QGY3hjxPvjAoIMIJpeywmp1XE46GTaIzd9G-w"; // 🔒 REMEMBER TO CHANGE THIS

const supabase = createClient(sbUrl, sbKey);

async function ultimateHunt() {
    // The comprehensive list from global_hunt
    const tables = [
        "users", "employee_profiles", "exam_shifts", "shift_assignments", "payments",
        "notifications", "audit_logs", "tcs_centers", "activity_log", "admin_logs",
        "employee_bank_details", "payment_history", "broadcast_logs", "center_admins",
        "attendance", "center_sequences"
    ];

    // The comprehensive columns list
    const columns = [
        "id", "user_id", "employee_id", "admin_id", "created_by", "updated_by",
        "approved_by", "cleared_by", "created_by_admin", "created_by_super"
    ];

    // The multi-UID array from huntV2
    const targetUids = [
        "42cfc945-d7ac-44d2-9ba7-6ffa605068c4",
        "62890286-a12e-4f37-9ce3-76074c3b7ac9"
    ];

    for (const uid of targetUids) {
        console.log(`\n======================================`);
        console.log(`🔍 Checking dependencies for: ${uid}`);
        console.log(`======================================`);

        let foundMatches = false;

        for (const table of tables) {
            for (const col of columns) {
                try {
                    const { data: rows, error } = await supabase
                        .from(table)
                        .select('*')
                        .eq(col, uid)
                        .limit(5); // Show up to 5 so we know the scale of the dependencies

                    if (!error && rows && rows.length > 0) {
                        foundMatches = true;
                        console.log(`✅ FOUND [${rows.length} row(s)] in table '${table}' under column '${col}'`);
                    }
                } catch (e) {
                    // Silently ignore errors for columns/tables that don't exist
                }
            }
        }

        if (!foundMatches) {
            console.log(`🟢 No dependencies found. This UID is clean.`);
        }
    }
}

ultimateHunt().catch(console.error);