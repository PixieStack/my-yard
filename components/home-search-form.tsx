"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { MapPin, Search, X } from "lucide-react"

interface Township {
  name: string
  city: string
  province: string
  type: string
}

export function HomeSearchForm() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [suggestions, setSuggestions] = useState<Township[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    const debounce = setTimeout(async () => {
      if (searchQuery.length >= 2) {
        setLoading(true)
        try {
          const res = await fetch(`/api/townships?search=${encodeURIComponent(searchQuery)}`)
          const data = await res.json()
          setSuggestions((data.townships || []).slice(0, 8))
          setShowSuggestions(true)
        } catch {
          setSuggestions([])
        } finally {
          setLoading(false)
        }
      } else {
        setSuggestions([])
        setShowSuggestions(false)
      }
    }, 250)
    return () => clearTimeout(debounce)
  }, [searchQuery])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setShowSuggestions(false)
    const query = searchQuery.trim()
    if (query) {
      router.push(`/tenant/properties?search=${encodeURIComponent(query)}`)
    } else {
      router.push("/tenant/properties")
    }
  }

  const selectSuggestion = (township: Township) => {
    setSearchQuery(township.name)
    setShowSuggestions(false)
    router.push(`/tenant/properties?search=${encodeURIComponent(township.name)}`)
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "township": return "bg-orange-100 text-orange-700"
      case "suburb": return "bg-blue-100 text-blue-700"
      case "cbd": return "bg-green-100 text-green-700"
      default: return "bg-gray-100 text-gray-700"
    }
  }

  return (
    <form onSubmit={handleSearch} className="relative" data-testid="home-search-form">
      <div className="bg-white rounded-3xl p-4 shadow-2xl shadow-orange-500/20 border-2 border-orange-200">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-orange-500" />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              placeholder="Search Soweto, Sandton, Khayelitsha..."
              className="w-full pl-12 pr-10 py-4 bg-orange-50/50 border-2 border-orange-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all text-slate-800 placeholder:text-slate-400 font-medium"
              data-testid="home-search-input"
              autoComplete="off"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => { setSearchQuery(""); setSuggestions([]); setShowSuggestions(false) }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Button
            type="submit"
            className="bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 hover:from-orange-600 hover:via-amber-600 hover:to-yellow-600 px-10 py-4 rounded-2xl font-bold text-lg shadow-lg shadow-orange-500/30 group"
            data-testid="home-search-submit"
          >
            <Search className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
            Search Now
          </Button>
        </div>
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-xl border-2 border-orange-100 overflow-hidden z-50"
          data-testid="search-suggestions"
        >
          {loading && (
            <div className="px-4 py-2 text-sm text-slate-400">Searching...</div>
          )}
          {suggestions.map((township, i) => (
            <button
              key={`${township.name}-${township.city}-${i}`}
              type="button"
              onClick={() => selectSuggestion(township)}
              className="w-full px-4 py-3 flex items-center gap-3 hover:bg-orange-50 transition-colors text-left border-b border-orange-50 last:border-0"
              data-testid={`suggestion-${i}`}
            >
              <MapPin className="h-4 w-4 text-orange-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="font-medium text-slate-800">{township.name}</span>
                <span className="text-slate-400 text-sm ml-2">{township.city}, {township.province}</span>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getTypeColor(township.type)}`}>
                {township.type}
              </span>
            </button>
          ))}
        </div>
      )}
    </form>
  )
}
