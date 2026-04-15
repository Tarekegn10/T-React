import { Header } from "@/components/header"
import { SearchForm } from "@/components/search/search-form"

export default function SearchPage() {
  return (
    <>
      <Header title="Search Documents" description="Find documents quickly" />
      <main className="flex-1 overflow-auto p-6">
        <SearchForm />
      </main>
    </>
  )
}
