"use client"

import { useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabase"

interface Location {
  id: string
  name: string
  city: string
  province: string
  type: 'township' | 'suburb' | 'cbd'
}

interface LocationSelectorProps {
  value?: string
  onChange: (locationId: string, locationData: Location | null) => void
  label?: string
  required?: boolean
}

export function LocationSelector({ value, onChange, label = "Location", required = false }: LocationSelectorProps) {
  const [provinces, setProvinces] = useState<string[]>([])
  const [cities, setCities] = useState<string[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [allLocations, setAllLocations] = useState<Location[]>([])
  
  const [selectedProvince, setSelectedProvince] = useState<string>("")
  const [selectedCity, setSelectedCity] = useState<string>("")
  const [selectedLocation, setSelectedLocation] = useState<string>(value || "")

  // Load all locations on mount
  useEffect(() => {
    loadLocations()
  }, [])

  // Load provinces from locations
  useEffect(() => {
    if (allLocations.length > 0) {
      const uniqueProvinces = Array.from(new Set(allLocations.map(loc => loc.province))).sort()
      setProvinces(uniqueProvinces)
    }
  }, [allLocations])

  // Update cities when province changes
  useEffect(() => {
    if (selectedProvince && allLocations.length > 0) {
      const provinceCities = allLocations
        .filter(loc => loc.province === selectedProvince)
        .map(loc => loc.city)
      const uniqueCities = Array.from(new Set(provinceCities)).sort()
      setCities(uniqueCities)
      setSelectedCity("")
      setSelectedLocation("")
      setLocations([])
    }
  }, [selectedProvince, allLocations])

  // Update locations when city changes
  useEffect(() => {
    if (selectedCity && allLocations.length > 0) {
      const cityLocations = allLocations
        .filter(loc => loc.province === selectedProvince && loc.city === selectedCity)
        .sort((a, b) => a.name.localeCompare(b.name))
      setLocations(cityLocations)
      setSelectedLocation("")
    }
  }, [selectedCity, selectedProvince, allLocations])

  const loadLocations = async () => {
    try {
      const { data, error } = await supabase
        .from('townships')
        .select('id, name, city, province, type')
        .eq('is_active', true)
        .order('name')

      if (error) throw error
      setAllLocations(data || [])
    } catch (error) {
      console.error('Error loading locations:', error)
    }
  }

  const handleLocationChange = (locationId: string) => {
    setSelectedLocation(locationId)
    const location = allLocations.find(loc => loc.id === locationId)
    onChange(locationId, location || null)
  }

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="province" className="text-sm font-medium text-slate-700">
          Province {required && <span className="text-red-500">*</span>}
        </Label>
        <Select value={selectedProvince} onValueChange={setSelectedProvince}>
          <SelectTrigger className="w-full mt-1">
            <SelectValue placeholder="Select Province" />
          </SelectTrigger>
          <SelectContent>
            {provinces.map((province) => (
              <SelectItem key={province} value={province}>
                {province}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedProvince && (
        <div>
          <Label htmlFor="city" className="text-sm font-medium text-slate-700">
            City {required && <span className="text-red-500">*</span>}
          </Label>
          <Select value={selectedCity} onValueChange={setSelectedCity}>
            <SelectTrigger className="w-full mt-1">
              <SelectValue placeholder="Select City" />
            </SelectTrigger>
            <SelectContent>
              {cities.map((city) => (
                <SelectItem key={city} value={city}>
                  {city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {selectedCity && (
        <div>
          <Label htmlFor="location" className="text-sm font-medium text-slate-700">
            {label} {required && <span className="text-red-500">*</span>}
          </Label>
          <Select value={selectedLocation} onValueChange={handleLocationChange}>
            <SelectTrigger className="w-full mt-1">
              <SelectValue placeholder="Select Township/Suburb/CBD" />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              {locations.map((location) => (
                <SelectItem key={location.id} value={location.id}>
                  {location.name} ({location.type})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  )
}
