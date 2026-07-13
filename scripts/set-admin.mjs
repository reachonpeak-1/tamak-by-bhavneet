// Grant admin access (profiles.is_admin) to a Supabase Auth user so they can
// use /admin. Creates the user if they don't exist yet (password required).
//
// Usage:  node scripts/set-admin.mjs you@email.com [password]
//
// Env (.env.local): NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import ws from "ws";

config({ path: ".env.local" });

const email = process.argv[2]?.toLowerCase().trim();
const password = process.argv[3];
if (!email || !email.includes("@")) {
  console.error("Usage: node scripts/set-admin.mjs <email> [password]");
  process.exit(1);
}

const { NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY } = process.env;
if (!NEXT_PUBLIC_SUPABASE_URL || !SUPABASE_SECRET_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SECRET_KEY env vars.");
  process.exit(1);
}

const supabase = createClient(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
  realtime: { transport: ws },
});

// Find the user by email (paginate; projects are small).
let user = null;
for (let page = 1; page <= 20 && !user; page++) {
  const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
  if (error) { console.error(error.message); process.exit(1); }
  user = data.users.find((u) => (u.email || "").toLowerCase() === email) || null;
  if (data.users.length < 200) break;
}

if (!user) {
  if (!password) {
    console.error(`No user with email ${email}. Pass a password to create one:`);
    console.error(`  node scripts/set-admin.mjs ${email} <password>`);
    process.exit(1);
  }
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) { console.error(error.message); process.exit(1); }
  user = data.user;
  console.log(`Created user ${email}`);
}

const { error: upsertErr } = await supabase
  .from("profiles")
  .upsert({ id: user.id, email: user.email, is_admin: true });
if (upsertErr) { console.error(upsertErr.message); process.exit(1); }

console.log(`✓ ${email} is now an admin. Sign out & back in for it to take effect.`);
