'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { FavoriteButton } from '@/components/favorite-button';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MapPin, Search, Filter, ChevronLeft, ChevronRight, Home, Bed, Bath, Maximize2 } from 'lucide-react';

interface Property {
  id: string;
  title: string;
  description: string;
  price_per_month?: number;
  rent_amount?: number;
  bedrooms: number;
  bathrooms: number;
  size_sqm: number;
  property_type: 'apartment' | 'house' | 'townhouse' | 'flat' | 'room' | 'bachelor' | 'cottage';
  location: string;
  township: string;
  address?: string;
  image_url?: string;
  verified: boolean;
  created_at: string;
  property_images?: Array<{
    image_url: string;
    is_primary: boolean;
    display_order: number;
  }>;
}

const PROPERTIES_PER_PAGE = 12;

// Helper function to get the rental price (handles both price_per_month and rent_amount)
const getRentAmount = (property: Property): number => {
  return property.price_per_month || property.rent_amount || 0;
};

export default function PropertiesPage() {
  const { user } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [township, setTownship] = useState('all');
  const [propertyType, setPropertyType] = useState('all');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minBedrooms, setMinBedrooms] = useState('all');
  const [townships, setTownships] = useState<string[]>([]);

  // Fetch all properties
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('properties')
          .select(`
            *,
            property_images(image_url, is_primary, display_order),
            townships(name)
          `)
          .eq('status', 'available')
          .order('created_at', { ascending: false });

        if (fetchError) {
          console.error('Error fetching properties:', fetchError);
          setError('Failed to load properties');
          return;
        }

        // Map townships data if it exists
        const mappedData = (data || []).map((p: any) => ({
          ...p,
          township: p.townships?.name || p.township || 'Uncategorized',
        }));

        setProperties(mappedData);

        // Extract unique townships
        const uniqueTownships = [...new Set(mappedData.map((p) => p.township))].filter(t => t && t !== 'Uncategorized').sort();
        setTownships(uniqueTownships);
      } catch (err) {
        console.error('Error:', err);
        setError('An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = properties;

    // Search by title or location
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.title.toLowerCase().includes(lowerSearch) ||
          p.location.toLowerCase().includes(lowerSearch) ||
          p.description.toLowerCase().includes(lowerSearch)
      );
    }

    // Filter by township
    if (township !== 'all') {
      filtered = filtered.filter((p) => p.township === township);
    }

    // Filter by property type
    if (propertyType !== 'all') {
      filtered = filtered.filter((p) => p.property_type === propertyType);
    }

    // Filter by price range
    if (minPrice) {
      filtered = filtered.filter((p) => getRentAmount(p) >= parseInt(minPrice));
    }
    if (maxPrice) {
      filtered = filtered.filter((p) => getRentAmount(p) <= parseInt(maxPrice));
    }

    // Filter by bedrooms
    if (minBedrooms !== 'all') {
      filtered = filtered.filter((p) => p.bedrooms >= parseInt(minBedrooms));
    }

    setFilteredProperties(filtered);
    setCurrentPage(1); // Reset to first page
  }, [properties, searchTerm, township, propertyType, minPrice, maxPrice, minBedrooms]);

  // Pagination
  const totalPages = Math.ceil(filteredProperties.length / PROPERTIES_PER_PAGE);
  const startIndex = (currentPage - 1) * PROPERTIES_PER_PAGE;
  const paginatedProperties = filteredProperties.slice(startIndex, startIndex + PROPERTIES_PER_PAGE);

  const handleResetFilters = () => {
    setSearchTerm('');
    setTownship('all');
    setPropertyType('all');
    setMinPrice('');
    setMaxPrice('');
    setMinBedrooms('all');
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Link href="/" className="flex items-center space-x-2 mb-4">
            <Image 
              src="https://ffkvytgvdqipscackxyg.supabase.co/storage/v1/object/public/public-assets/my-yard-logo.png" 
              alt="MyYard" 
              width={40} 
              height={40}
            />
            <span className="text-xl font-bold text-orange-600">MyYard</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Browse Properties</h1>
          <p className="text-gray-600">Discover available properties in your preferred township</p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-20">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  Filters
                </h2>
              </div>

              {/* Search */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Property name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Township */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Township</label>
                <Select value={township} onValueChange={setTownship}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Townships</SelectItem>
                    {townships.map((t, idx) => (
                      <SelectItem key={`township-${idx}`} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Property Type */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Property Type</label>
                <Select value={propertyType} onValueChange={setPropertyType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="room">Room</SelectItem>
                    <SelectItem value="bachelor">Bachelor</SelectItem>
                    <SelectItem value="cottage">Cottage</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Bedrooms */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Min. Bedrooms</label>
                <Select value={minBedrooms} onValueChange={setMinBedrooms}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any</SelectItem>
                    <SelectItem value="1">1+</SelectItem>
                    <SelectItem value="2">2+</SelectItem>
                    <SelectItem value="3">3+</SelectItem>
                    <SelectItem value="4">4+</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Price Range */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Price Range (R)</label>
                <div className="space-y-2">
                  <Input
                    type="number"
                    placeholder="Min price"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                  />
                  <Input
                    type="number"
                    placeholder="Max price"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                  />
                </div>
              </div>

              {/* Reset Button */}
              <Button
                variant="outline"
                className="w-full border-orange-500 text-orange-600 hover:bg-orange-50"
                onClick={handleResetFilters}
              >
                Reset Filters
              </Button>
            </div>
          </div>

          {/* Properties Grid */}
          <div className="lg:col-span-3">
            {/* Results Info */}
            <div className="mb-6">
              <p className="text-gray-600 font-medium">
                Showing {startIndex + 1} to {Math.min(startIndex + PROPERTIES_PER_PAGE, filteredProperties.length)} of{' '}
                <span className="font-bold text-gray-900">{filteredProperties.length}</span> properties
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-700">
                {error}
              </div>
            )}

            {/* Loading State */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg overflow-hidden shadow-sm animate-pulse">
                    <div className="h-48 bg-gray-200" />
                    <div className="p-4 space-y-3">
                      <div className="h-4 bg-gray-200 rounded w-3/4" />
                      <div className="h-4 bg-gray-200 rounded" />
                      <div className="h-4 bg-gray-200 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : paginatedProperties.length === 0 ? (
              <div className="bg-white rounded-lg p-12 text-center">
                <Home className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-lg font-semibold text-gray-900 mb-2">No properties found</p>
                <p className="text-gray-600">Try adjusting your filters or search terms</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {paginatedProperties.map((property) => (
                    <div
                      key={property.id}
                      className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-shadow"
                    >
                      {/* Image */}
                      <div className="relative h-48 bg-gray-200 group overflow-hidden">
                        {property.property_images && property.property_images.length > 0 ? (
                          <Image
                            src={property.property_images[0].image_url}
                            alt={property.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
                            <Home className="w-12 h-12 text-gray-400" />
                          </div>
                        )}

                        {/* Favorite Button */}
                        <div className="absolute top-3 right-3 z-10">
                          <FavoriteButton propertyId={property.id} size="default" />
                        </div>

                        {/* Verified Badge */}
                        {property.verified && (
                          <div className="absolute top-3 left-3 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                            ✓ Verified
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-4">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">{property.title}</h3>

                        {/* Location */}
                        <div className="flex items-center text-gray-600 text-sm mb-3">
                          <MapPin className="w-4 h-4 mr-1" />
                          {property.location}, {property.township}
                        </div>

                        {/* Details */}
                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                          <div className="flex items-center gap-1">
                            <Bed className="w-4 h-4" />
                            {property.bedrooms} Beds
                          </div>
                          <div className="flex items-center gap-1">
                            <Bath className="w-4 h-4" />
                            {property.bathrooms} Baths
                          </div>
                          <div className="flex items-center gap-1">
                            <Maximize2 className="w-4 h-4" />
                            {property.size_sqm}m²
                          </div>
                        </div>

                        {/* Price */}
                        <div className="border-t pt-3 mb-3">
                          <p className="text-2xl font-bold text-orange-600">
                            R{property.price_per_month ? property.price_per_month.toLocaleString() : 'N/A'}
                            <span className="text-sm text-gray-600 font-normal">/month</span>
                          </p>
                        </div>

                        {/* Property Type */}
                        <div className="mb-4">
                          <span className="inline-block bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs font-semibold capitalize">
                            {property.property_type}
                          </span>
                        </div>

                        {/* CTA */}
                        <Link href={`/browse/${property.id}`}>
                          <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold">
                            Apply
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-12 flex items-center justify-between">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="flex items-center gap-2"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Previous
                    </Button>

                    <div className="flex items-center gap-2">
                      {[...Array(totalPages)].map((_, i) => (
                        <Button
                          key={i + 1}
                          variant={currentPage === i + 1 ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setCurrentPage(i + 1)}
                          className={currentPage === i + 1 ? 'bg-orange-600 hover:bg-orange-700' : ''}
                        >
                          {i + 1}
                        </Button>
                      ))}
                    </div>

                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="flex items-center gap-2"
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
