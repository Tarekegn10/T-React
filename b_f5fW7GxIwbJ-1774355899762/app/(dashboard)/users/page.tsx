import { Header } from "@/components/header"
import { UsersTable } from "@/components/users/users-table"

export default function UsersPage() {
  return (
    <>
      <Header title="Employee Management" description="Manage employees and their information" />
      <main className="flex-1 overflow-auto p-6">
        <UsersTable showAddButton />
      </main>
    </>
  )
}
