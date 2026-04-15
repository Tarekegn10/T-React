import { redirect } from "next/navigation"
import { Header } from "@/components/header"
import { UsersTable } from "@/components/users/users-table"
import { getCurrentUser } from "@/lib/auth"

export default async function UsersPage() {
  const user = await getCurrentUser()

  if (!user || (user.role !== "admin" && user.role !== "manager")) {
    redirect("/dashboard")
  }

  return (
    <>
      <Header title="Employee Management" description="Manage employees and their information" />
      <main className="flex-1 overflow-auto p-6">
        <UsersTable showAddButton />
      </main>
    </>
  )
}
