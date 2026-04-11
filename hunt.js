const { createClient } = require('@supabase/supabase-js');

const sbUrl = "https://bgrbbvzegcqmvgqiadry.supabase.co";
const sbKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJncmJidnplZ2NxbXZncWlhZHJ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjQ0NTE5OCwiZXhwIjoyMDg4MDIxMTk4fQ.ue61x3QGY3hjxPvjAoIMIJpeywmp1XE46GTaIzd9G-w";

const supabase = createClient(sbUrl, sbKey);

const uid = "62890286-a12e-4f37-9ce3-76074c3b7ac9";

async function hunt() {
  console.log(`Hunting dependencies for ${uid}`);
  
  // A generic way to identify standard columns
  const cols = ["user_id", "employee_id", "created_by", "updated_by", "approved_by", "cleared_by", "created_by_admin"];
  
  // You would need to check existing tables or known tables from schema
  const knownTables = [
    "users", "employee_profiles", "tcs_centers", "exam_shifts",
    "shift_assignments", "audit_logs", "employee_bank_details", "payments",
    "notifications"
  ];

  for (const table of knownTables) {
    for (const col of cols) {
      const { data, error } = await supabase.from(table).select('id').eq(col, uid).limit(1);
      if (error) {
        // Maybe table/col doesn't exist, ignore
      } else if (data && data.length > 0) {
        console.log(`💥 FOUND dependencies in table: ${table}, column: ${col}`);
      }
    }
  }

  // Also check if they are the actual user
  const { data } = await supabase.from('users').select('*').eq('id', uid);
  console.log("public.users record:", data);

  console.log("Done.");
}

hunt().catch(console.error);
