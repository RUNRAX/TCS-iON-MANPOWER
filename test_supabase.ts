import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function run() {
  const q1 = supabase
    .from("users")
    .select("id")
    .or("role.is.null,role.neq.super_admin")
    .order("created_at", { ascending: false })
    .range(0, 10);
  
  const { data, error } = await q1;
  console.log("Q1 Error:", error || "None");
}

run();
