import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/firebase/requireAdminSession";
import AdminShell from "@/components/admin/AdminShell";

// Gated admin shell. The login page lives outside this (dash) group, so it is
// not caught by this redirect. The proxy already bounced cookieless requests;
// here we verify the cookie is valid AND carries the admin claim.
export const dynamic = "force-dynamic";

export default async function AdminDashLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdminSession();
  if (!admin) redirect("/admin/login");

  return (
    <AdminShell email={admin.email ?? ""}>
      {children}
    </AdminShell>
  );
}
