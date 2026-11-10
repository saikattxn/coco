import { requireUser } from "@/server/auth";
import { PageHeader, Panel } from "@/components/admin/ui";
import { MfaSetup, PasswordForm } from "./forms";

export default async function AccountPage() {
  const user = await requireUser();
  return (
    <>
      <PageHeader title="My account" description={`${user.name} · ${user.email} · ${user.roleName}`} />
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Password"><PasswordForm /></Panel>
        <Panel title="Two-step verification"><MfaSetup enabled={user.mfaEnabled} /></Panel>
      </div>
    </>
  );
}
