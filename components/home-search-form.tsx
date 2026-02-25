"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { MapPin, Search } from "lucide-react"

export function HomeSearchForm() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const query = searchQuery.trim()
    if (query) {
      router.push(`/tenant/properties?search=${encodeURIComponent(query)}`)
    } else {
      router.push("/tenant/properties")
    }
  }

  return (
    <form onSubmit={handleSearch} className="bg-white rounded-3xl p-4 shadow-2xl shadow-orange-500/20 border-2 border-orange-200">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-orange-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Soweto, Sandton, Khayelitsha..."
            className="w-full pl-12 pr-4 py-4 bg-orange-50/50 border-2 border-orange-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all text-slate-800 placeholder:text-slate-400 font-medium"
          />
        </div>
        <Button
          type="submit"
          className="bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 hover:from-orange-600 hover:via-amber-600 hover:to-yellow-600 px-10 py-4 rounded-2xl font-bold text-lg shadow-lg shadow-orange-500/30 group"
        >
          <Search className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
          Search Now
        </Button>
      </div>
    </form>
  )
}
