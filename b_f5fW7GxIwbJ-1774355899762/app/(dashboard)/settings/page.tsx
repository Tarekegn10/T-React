import { Header } from "@/components/header"
import { OrganizationSettings } from "@/components/settings/organization-settings"
import { NotificationSettings } from "@/components/settings/notification-settings"
import { SecuritySettings } from "@/components/settings/security-settings"

export default function SettingsPage() {
  return (
    <>
      <Header title="Settings" description="Manage system preferences" />
      <main className="flex-1 overflow-auto p-6 space-y-6">
        <OrganizationSettings />
        <NotificationSettings />
        <SecuritySettings />
      </main>
    </>
  )
}
