import { Header } from "@/components/header"
import { CategoryGrid } from "@/components/categories/category-grid"

export default function CategoriesPage() {
  return (
    <>
      <Header title="Categories & Folders" description="Organize your documents" />
      <main className="flex-1 overflow-auto p-6">
        <CategoryGrid />
      </main>
    </>
  )
}
