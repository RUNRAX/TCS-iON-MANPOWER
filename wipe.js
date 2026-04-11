const { createClient } = require('@supabase/supabase-js');

const sbUrl = "https://bgrbbvzegcqmvgqiadry.supabase.co";
const sbKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJncmJidnplZ2NxbXZncWlhZHJ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjQ0NTE5OCwiZXhwIjoyMDg4MDIxMTk4fQ.ue61x3QGY3hjxPvjAoIMIJpeywmp1XE46GTaIzd9G-w";

const supabase = createClient(sbUrl, sbKey);

const userIdsToNuke = [
  "42cfc945-d7ac-44d2-9ba7-6ffa605068c4",
  "62890286-a12e-4f37-9ce3-76074c3b7ac9"
];

async function purge() {
  console.log("Commencing MAXIMUM purge...");

  for (const uid of userIdsToNuke) {
    console.log(`\n\n--- Purging UUID: ${uid} ---`);
    
    // 1. Unlink profiles approved by them
    await supabase.from('employee_profiles').update({ approved_by: null }).eq('approved_by', uid);
    
    // 2. Unlink tcs_centers created by them
    await supabase.from('tcs_centers').update({ created_by_admin: null }).eq('created_by_admin', uid);

    // 3. Unlink payment history cleared by them
    await supabase.from('payment_history').update({ cleared_by: null }).eq('cleared_by', uid);

    // 4. Drop audit_logs
    await supabase.from('audit_logs').delete().eq('user_id', uid);

    // 5. Drop employee_bank_details
    await supabase.from('employee_bank_details').delete().eq('employee_id', uid);

    // 6. Drop payment_history for them
    await supabase.from('payment_history').delete().eq('employee_id', uid);

    // 7. Drop shift assignments
    await supabase.from('shift_assignments').delete().eq('employee_id', uid);

    // 8. Handle exam shifts created by them (these are NOT NULL, so we must delete the shifts)
    const { data: shifts } = await supabase.from('exam_shifts').select('id').eq('created_by', uid);
    if (shifts && shifts.length > 0) {
      const shiftIds = shifts.map(s => s.id);
      await supabase.from('shift_assignments').delete().in('shift_id', shiftIds);
      await supabase.from('exam_shifts').delete().in('id', shiftIds);
    }
    
    // 9. Drop employee_profiles where user_id = uid
    await supabase.from('employee_profiles').delete().eq('user_id', uid);

    // 10. Direct deletion from auth
    const { error: authErr } = await supabase.auth.admin.deleteUser(uid);
    if (authErr) {
      console.error(`Failed to delete fully from auth: ${authErr.message}`);
    } else {
      console.log(`✅ Fully purged ${uid}`);
    }
  }

  console.log("\nDone purging.");
}

purge().catch(console.error);
