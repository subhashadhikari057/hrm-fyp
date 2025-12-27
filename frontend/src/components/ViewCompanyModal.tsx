'use client';

import { useState, useEffect } from 'react';
import { companyApi, type Company } from '../lib/api/company';
import {
  Building2,
  CalendarDays,
  Clock,
  Hash,
  MapPin,
  UserCog,
  Users,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export interface ViewCompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string | null;
}

export function ViewCompanyModal({ isOpen, onClose, companyId }: ViewCompanyModalProps) {
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch company data when modal opens
  useEffect(() => {
    if (isOpen && companyId) {
      fetchCompanyData();
    } else {
      setCompany(null);
      setError(null);
    }
  }, [isOpen, companyId]);

  const fetchCompanyData = async () => {
    if (!companyId) return;

    setLoading(true);
    setError(null);
    try {
      const response = await companyApi.getCompanyById(companyId);
      setCompany(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load company data');
      console.error('Error fetching company:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDateOnly = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const statusStyles: Record<string, string> = {
      active: 'bg-green-100 text-green-800',
      suspended: 'bg-yellow-100 text-yellow-800',
      archived: 'bg-gray-100 text-gray-800',
    };

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${statusStyles[status] || statusStyles.active
          }`}
      >
        <span
          className={`w-1.5 h-1.5 rounded-full ${status === 'active'
            ? 'bg-green-600'
            : status === 'suspended'
              ? 'bg-yellow-600'
              : 'bg-gray-600'
            }`}
        ></span>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Company Details</DialogTitle>
        </DialogHeader>
        <div className="max-h-[70vh] overflow-y-auto">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm mb-4">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex flex-col justify-center items-center py-10">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-200 border-t-blue-600"></div>
              <span className="mt-3 text-sm text-gray-600">Loading company data...</span>
            </div>
          ) : company ? (
            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b border-gray-200 pb-4">
                {company.logoUrl ? (
                  <img
                    src={`${API_BASE_URL}/uploads/${company.logoUrl}`}
                    alt={company.name}
                    className="w-12 h-12 rounded-lg object-cover border border-gray-200"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                      if (fallback) fallback.classList.remove('hidden');
                    }}
                  />
                ) : null}
                <div
                  className={`w-12 h-12 rounded-lg bg-blue-600 flex items-center justify-center text-white text-sm font-semibold ${company.logoUrl ? 'hidden' : ''}`}
                >
                  {company.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2)}
                </div>
                <div className="min-w-0">
                  <h4 className="text-lg font-semibold text-gray-900 truncate">{company.name}</h4>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Hash className="h-4 w-4" />
                    <span className="font-mono">{company.code}</span>
                  </div>
                </div>
                <div className="ml-auto">{getStatusBadge(company.status)}</div>
              </div>

              <div className="divide-y divide-gray-200 text-sm">
                <div className="grid grid-cols-[160px_1fr] items-center gap-4 py-3">
                  <div className="flex items-center gap-2 text-gray-500">
                    <Building2 className="h-4 w-4" />
                    <span>Industry</span>
                  </div>
                  <div className="text-gray-900 text-right truncate">{company.industry || 'N/A'}</div>
                </div>
                <div className="grid grid-cols-[160px_1fr] items-center gap-4 py-3">
                  <div className="flex items-center gap-2 text-gray-500">
                    <UserCog className="h-4 w-4" />
                    <span>Admin</span>
                  </div>
                  <div className="text-gray-900 text-right truncate">
                    {company.adminName || 'N/A'}
                  </div>
                </div>
                <div className="grid grid-cols-[160px_1fr] items-center gap-4 py-3">
                  <div className="flex items-center gap-2 text-gray-500">
                    <Users className="h-4 w-4" />
                    <span>Total Users</span>
                  </div>
                  <div className="text-gray-900 text-right">{company.userCount.toLocaleString()}</div>
                </div>
                <div className="grid grid-cols-[160px_1fr] items-center gap-4 py-3">
                  <div className="flex items-center gap-2 text-gray-500">
                    <Users className="h-4 w-4" />
                    <span>Max Employees</span>
                  </div>
                  <div className="text-gray-900 text-right">
                    {company.maxEmployees ? company.maxEmployees.toLocaleString() : 'N/A'}
                  </div>
                </div>
                <div className="grid grid-cols-[160px_1fr] items-center gap-4 py-3">
                  <div className="flex items-center gap-2 text-gray-500">
                    <MapPin className="h-4 w-4" />
                    <span>Address</span>
                  </div>
                  <div className="text-gray-900 text-right truncate">{company.address || 'N/A'}</div>
                </div>
                <div className="grid grid-cols-[160px_1fr] items-center gap-4 py-3">
                  <div className="flex items-center gap-2 text-gray-500">
                    <MapPin className="h-4 w-4" />
                    <span>City</span>
                  </div>
                  <div className="text-gray-900 text-right truncate">{company.city || 'N/A'}</div>
                </div>
                <div className="grid grid-cols-[160px_1fr] items-center gap-4 py-3">
                  <div className="flex items-center gap-2 text-gray-500">
                    <MapPin className="h-4 w-4" />
                    <span>Country</span>
                  </div>
                  <div className="text-gray-900 text-right truncate">{company.country || 'N/A'}</div>
                </div>
                <div className="grid grid-cols-[160px_1fr] items-center gap-4 py-3">
                  <div className="flex items-center gap-2 text-gray-500">
                    <Clock className="h-4 w-4" />
                    <span>Plan Expires</span>
                  </div>
                  <div className="text-gray-900 text-right">{formatDateOnly(company.planExpiresAt)}</div>
                </div>
                <div className="grid grid-cols-[160px_1fr] items-center gap-4 py-3">
                  <div className="flex items-center gap-2 text-gray-500">
                    <CalendarDays className="h-4 w-4" />
                    <span>Created At</span>
                  </div>
                  <div className="text-gray-900 text-right">{formatDate(company.createdAt)}</div>
                </div>
                <div className="grid grid-cols-[160px_1fr] items-center gap-4 py-3">
                  <div className="flex items-center gap-2 text-gray-500">
                    <CalendarDays className="h-4 w-4" />
                    <span>Last Updated</span>
                  </div>
                  <div className="text-gray-900 text-right">{formatDate(company.updatedAt)}</div>
                </div>
              </div>

            </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-sm text-gray-500">No company data available</p>
            </div>
          )}
        </div>
        <div className="pt-6">
          <DialogFooter>
            <Button type="button" variant="cancel" onClick={onClose}>
              Close
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}









