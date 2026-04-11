const { createClient } = require('@supabase/supabase-js');

const sbUrl = "https://bgrbbvzegcqmvgqiadry.supabase.co";
const sbKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJncmJidnplZ2NxbXZncWlhZHJ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjQ0NTE5OCwiZXhwIjoyMDg4MDIxMTk4fQ.ue61x3QGY3hjxPvjAoIMIJpeywmp1XE46GTaIzd9G-w";

const supabase = createClient(sbUrl, sbKey);

const SUPER_ADMIN_EMAIL = "rakshitawati11@gmail.com";

async function ultimatePurge() {
    console.log("🚀 Starting Ultimate Purge...");

    // 1. Fetch all users
    const { data: allUsers, error: listError } = await supabase.from('users').select('id, email, role');
    if (listError) {
        console.error("Error listing users:", listError);
        return;
    }

    const victims = allUsers.filter(u => u.email !== SUPER_ADMIN_EMAIL);
    const victimIds = victims.map(v => v.id);

    console.log(`Found ${victims.length} users to purge:`, victims.map(v => v.email));

    if (victimIds.length === 0) {
        console.log("No victims found.");
        return;
    }

    // 2. Break Self-References in main user table
    console.log("Breaking user self-references...");
    await supabase.from('users').update({ created_by_admin: null }).not('id', 'is', null);

    // 3. Nullify references in other tables
    console.log("Nullifying approver/admin references...");
    await supabase.from('employee_profiles').update({ approved_by: null }).in('approved_by', victimIds);
    await supabase.from('employee_profiles').update({ reviewed_by: null }).in('reviewed_by', victimIds);
    await supabase.from('exam_shifts').update({ updated_by: null }).in('updated_by', victimIds);
    await supabase.from('exam_shifts').update({ published_by: null }).in('published_by', victimIds);
    await supabase.from('shift_assignments').update({ updated_by: null }).in('updated_by', victimIds);
    await supabase.from('payments').update({ cleared_by: null }).in('cleared_by', victimIds);

    // 4. Delete dependent data
    console.log("Deleting dependent records...");
    
    // Broadcast Logs (Must delete these as admin_id is NOT NULL)
    await supabase.from('broadcast_logs').delete().in('admin_id', victimIds);
    
    // Notifications
    await supabase.from('notifications').delete().in('employee_id', victimIds);
    
    // Audit Logs
    await supabase.from('audit_logs').delete().in('user_id', victimIds);
    
    // Payments
    await supabase.from('payments').delete().in('employee_id', victimIds);
    
    // Shift Assignments
    await supabase.from('shift_assignments').delete().in('employee_id', victimIds);
    
    // Shifts created by them (must delete assignments first)
    const { data: shifts } = await supabase.from('exam_shifts').select('id').in('created_by', victimIds);
    if (shifts && shifts.length > 0) {
        const shiftIds = shifts.map(s => s.id);
        await supabase.from('shift_assignments').delete().in('shift_id', shiftIds);
        await supabase.from('payments').delete().in('shift_id', shiftIds);
        await supabase.from('exam_shifts').delete().in('id', shiftIds);
    }

    // Profiles
    await supabase.from('employee_profiles').delete().in('user_id', victimIds);

    // 5. Auth Purge
    console.log("Purging Auth users...");
    for (const victim of victims) {
        const { error: authError } = await supabase.auth.admin.deleteUser(victim.id);
        if (authError) {
            console.error(`❌ Failed to purge ${victim.email} from Auth:`, authError.message);
        } else {
            console.log(`✅ Successfully purged ${victim.email}`);
        }
    }

    console.log("\n✨ Purge complete.");
}

ultimatePurge().catch(console.error);
