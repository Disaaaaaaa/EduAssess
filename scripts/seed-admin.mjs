import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const adminEmail = 'azhibaeva_zh@kzl.nis.edu.kz';

async function seedAdmin() {
  let { data: existingUser } = await supabase.from('users').select('*').eq('email', adminEmail).single();

  if (!existingUser) {
    console.log(`Creating admin user: ${adminEmail}`);
    const { data: authUser, error: authErr } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: 'password123',
      email_confirm: true,
      user_metadata: {
        name: 'Ажибаева Ж. Х.',
        role: 'admin'
      }
    });

    if (authErr) {
      console.error("Error creating auth user:", authErr);
      return;
    }

    // Set role to admin explicitly in users table
    const { error: updateErr } = await supabase
      .from('users')
      .update({ role: 'admin' })
      .eq('id', authUser.user.id);

    if (updateErr) {
      console.error("Error updating user role:", updateErr);
    }
  } else {
    console.log(`Admin user already exists: ${adminEmail}`);
    // Ensure role is admin
    await supabase.from('users').update({ role: 'admin' }).eq('id', existingUser.id);
  }

  console.log("Admin seeding complete!");
}

seedAdmin().catch(console.error);
