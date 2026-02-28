'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { format } from 'date-fns';
import { Eye, Search, Filter, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ViewingRequest {
  id: string;
  property_id: string;
  tenant_id: string;
  requested_date: string;
  requested_time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
  properties: {
    id: string;
    title: string;
    location: string;
  };
  profiles: {
    id: string;
    email: string;
    name: string;
    phone: string;
  };
}

export default function ViewingRequestsPage() {
  const supabase = createClientComponentClient();
  const { user, profile } = useAuth();
  const [viewingRequests, setViewingRequests] = useState<ViewingRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<ViewingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [confirmDialog, setConfirmDialog] = useState(false);
  const [completeDialog, setCompleteDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ViewingRequest | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch viewing requests for properties owned by this landlord
  const fetchViewingRequests = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('viewing_requests')
        .select(
          `
          id,
          property_id,
          tenant_id,
          requested_date,
          requested_time,
          status,
          created_at,
          updated_at,
          properties (
            id,
            title,
            location
          ),
          profiles (
            id,
            email,
            name,
            phone
          )
        `
        )
        .eq('properties.landlord_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('Error fetching viewing requests:', fetchError);
        setError('Failed to load viewing requests');
        return;
      }

      setViewingRequests(data as ViewingRequest[]);
    } catch (err) {
      console.error('Error:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchViewingRequests();
  }, [user]);

  // Filter requests based on search and status
  useEffect(() => {
    let filtered = viewingRequests;

    if (statusFilter !== 'all') {
      filtered = filtered.filter((req) => req.status === statusFilter);
    }

    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (req) =>
          req.properties.title.toLowerCase().includes(lowerSearch) ||
          req.properties.location.toLowerCase().includes(lowerSearch) ||
          req.profiles.name.toLowerCase().includes(lowerSearch) ||
          req.profiles.email.toLowerCase().includes(lowerSearch)
      );
    }

    setFilteredRequests(filtered);
  }, [viewingRequests, searchTerm, statusFilter]);

  const handleConfirmViewing = async () => {
    if (!selectedRequest) return;

    try {
      setActionLoading(true);
      const { error } = await supabase
        .from('viewing_requests')
        .update({ status: 'confirmed', updated_at: new Date().toISOString() })
        .eq('id', selectedRequest.id);

      if (error) throw error;

      setViewingRequests((prev) =>
        prev.map((req) =>
          req.id === selectedRequest.id ? { ...req, status: 'confirmed' } : req
        )
      );

      setConfirmDialog(false);
      setSelectedRequest(null);
    } catch (err) {
      console.error('Error confirming viewing:', err);
      setError('Failed to confirm viewing');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteViewing = async () => {
    if (!selectedRequest) return;

    try {
      setActionLoading(true);
      const { error } = await supabase
        .from('viewing_requests')
        .update({ status: 'completed', updated_at: new Date().toISOString() })
        .eq('id', selectedRequest.id);

      if (error) throw error;

      setViewingRequests((prev) =>
        prev.map((req) =>
          req.id === selectedRequest.id ? { ...req, status: 'completed' } : req
        )
      );

      setCompleteDialog(false);
      setSelectedRequest(null);
    } catch (err) {
      console.error('Error completing viewing:', err);
      setError('Failed to complete viewing');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelViewing = async (id: string) => {
    try {
      setActionLoading(true);
      const { error } = await supabase
        .from('viewing_requests')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      setViewingRequests((prev) =>
        prev.map((req) => (req.id === id ? { ...req, status: 'cancelled' } : req))
      );
    } catch (err) {
      console.error('Error cancelling viewing:', err);
      setError('Failed to cancel viewing');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'confirmed':
        return <AlertCircle className="w-4 h-4" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  if (!profile || profile.role !== 'landlord') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-xl font-semibold text-gray-800">Access Denied</p>
          <p className="text-gray-600">Only landlords can access this page</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Eye className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Viewing Requests</h1>
          </div>
          <p className="text-gray-600">
            Manage viewing requests for your properties. Confirm times and mark viewings as completed.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-900">{error}</p>
              <button
                onClick={() => setError(null)}
                className="text-sm text-red-700 hover:text-red-900 mt-1"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Search and Filter Bar */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Search by property name, location, or tenant name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="w-full md:w-48 flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="grid grid-cols-1 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-lg p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
                <div className="h-4 bg-gray-200 rounded w-2/3 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="bg-white rounded-lg p-12 text-center">
            <Eye className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-xl font-semibold text-gray-900 mb-2">
              {viewingRequests.length === 0
                ? 'No viewing requests yet'
                : 'No requests matching your filters'}
            </p>
            <p className="text-gray-600">
              {viewingRequests.length === 0
                ? 'Viewing requests from tenants will appear here'
                : 'Try adjusting your search or filters'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredRequests.map((request) => (
              <div
                key={request.id}
                className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 hover:shadow-md transition"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  {/* Left Section - Property & Tenant Info */}
                  <div className="flex-1">
                    <div className="flex items-start gap-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {request.properties.title}
                        </h3>
                        <p className="text-sm text-gray-600 mb-3">
                          📍 {request.properties.location}
                        </p>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-700">Tenant:</span>
                            <span className="text-sm text-gray-600">{request.profiles.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-700">Email:</span>
                            <span className="text-sm text-gray-600">{request.profiles.email}</span>
                          </div>
                          {request.profiles.phone && (
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-700">Phone:</span>
                              <span className="text-sm text-gray-600">{request.profiles.phone}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Middle Section - Date & Time */}
                  <div className="md:w-48">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <p className="text-xs font-semibold text-blue-600 uppercase mb-2">
                        Requested Time
                      </p>
                      <p className="text-lg font-bold text-gray-900">
                        {format(new Date(request.requested_date), 'MMM dd, yyyy')}
                      </p>
                      <p className="text-sm text-gray-700 mt-1">{request.requested_time}</p>
                    </div>
                  </div>

                  {/* Right Section - Status & Actions */}
                  <div className="md:w-48">
                    <div className="flex flex-col gap-3">
                      {/* Status Badge */}
                      <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-full ${getStatusBadgeColor(request.status)} text-sm font-medium`}>
                        {getStatusIcon(request.status)}
                        <span className="capitalize">{request.status}</span>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col gap-2">
                        {request.status === 'pending' && (
                          <Button
                            onClick={() => {
                              setSelectedRequest(request);
                              setConfirmDialog(true);
                            }}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                            size="sm"
                          >
                            Confirm Time
                          </Button>
                        )}

                        {request.status === 'confirmed' && (
                          <Button
                            onClick={() => {
                              setSelectedRequest(request);
                              setCompleteDialog(true);
                            }}
                            className="w-full bg-green-600 hover:bg-green-700 text-white"
                            size="sm"
                          >
                            Complete Viewing
                          </Button>
                        )}

                        {request.status !== 'completed' && request.status !== 'cancelled' && (
                          <Button
                            onClick={() => handleCancelViewing(request.id)}
                            variant="outline"
                            className="w-full text-red-600 border-red-200 hover:bg-red-50"
                            size="sm"
                            disabled={actionLoading}
                          >
                            Cancel
                          </Button>
                        )}

                        {request.status === 'completed' && (
                          <div className="text-center">
                            <p className="text-xs text-green-600 font-semibold">✓ Completed</p>
                            <p className="text-xs text-gray-600">
                              {format(new Date(request.updated_at), 'MMM dd, HH:mm')}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirm Viewing Dialog */}
      <Dialog open={confirmDialog} onOpenChange={setConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Viewing Time</DialogTitle>
            <DialogDescription>
              Are you confirming that you'll be available at this time?
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4 py-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-2">Property</p>
                <p className="font-semibold text-gray-900">{selectedRequest.properties.title}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-2">Date</p>
                  <p className="font-semibold text-gray-900">
                    {format(new Date(selectedRequest.requested_date), 'MMM dd, yyyy')}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-2">Time</p>
                  <p className="font-semibold text-gray-900">{selectedRequest.requested_time}</p>
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900">
                  ✓ The tenant will be notified that you've confirmed this viewing time.
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirmViewing}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              disabled={actionLoading}
            >
              {actionLoading ? 'Confirming...' : 'Confirm Viewing'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Complete Viewing Dialog */}
      <Dialog open={completeDialog} onOpenChange={setCompleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Viewing Completion</DialogTitle>
            <DialogDescription>
              Mark this viewing as completed. The tenant can then submit their application.
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4 py-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-2">Property</p>
                <p className="font-semibold text-gray-900">{selectedRequest.properties.title}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-2">Tenant</p>
                  <p className="font-semibold text-gray-900">{selectedRequest.profiles.name}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-2">Date</p>
                  <p className="font-semibold text-gray-900">
                    {format(new Date(selectedRequest.requested_date), 'MMM dd')}
                  </p>
                </div>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-900">
                  ✓ The tenant will be notified that the viewing is complete and can now apply for
                  this property.
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setCompleteDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCompleteViewing}
              className="bg-green-600 hover:bg-green-700 text-white"
              disabled={actionLoading}
            >
              {actionLoading ? 'Completing...' : 'Complete Viewing'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
