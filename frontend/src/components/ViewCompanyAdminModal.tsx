'use client';

import { useState, useEffect } from 'react';
import { superadminApi, type User } from '../lib/api/superadmin';
import {
  Building2,
  CalendarDays,
  Mail,
  Phone,
  User as UserIcon,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { API_BASE_URL } from '../lib/api/types';

export interface ViewCompanyAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string | null;
}

export function ViewCompanyAdminModal({ isOpen, onClose, userId }: ViewCompanyAdminModalProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && userId) {
      fetchUser();
    } else {
      setUser(null);
      setError(null);
    }
  }, [isOpen, userId]);

  const fetchUser = async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await superadminApi.getUserById(userId);
      setUser(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const resolveAvatarUrl = (avatarUrl: string | null | undefined) => {
    if (!avatarUrl) return null;
    return avatarUrl.startsWith('http') ? avatarUrl : `${API_BASE_URL}/uploads/${avatarUrl}`;
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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Company Admin Details</DialogTitle>
        </DialogHeader>

        <div className="px-3 sm:px-4 md:px-6 pb-4 sm:pb-6 pt-4 sm:pt-6 relative">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-xs sm:text-sm mb-3 sm:mb-4">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex flex-col justify-center items-center py-12 sm:py-20">
              <div className="relative">
                <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-4 border-blue-200 border-t-blue-600"></div>
              </div>
              <span className="mt-3 sm:mt-4 text-sm sm:text-base text-gray-600 font-medium">
                Loading admin data...
              </span>
            </div>
          ) : user ? (
            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b border-gray-200 pb-4">
                {resolveAvatarUrl(user.avatarUrl) ? (
                  <img
                    src={resolveAvatarUrl(user.avatarUrl) || ''}
                    alt={user.fullName || user.email}
                    className="w-12 h-12 rounded-full object-cover border border-gray-200"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gray-900 text-white flex items-center justify-center text-sm font-semibold">
                    {(user.fullName || user.email)
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2)}
                  </div>
                )}
                <div className="min-w-0">
                  <h4 className="text-lg font-semibold text-gray-900 truncate">
                    {user.fullName || 'No Name'}
                  </h4>
                  <div className="flex items-center gap-2 text-sm text-gray-500 truncate">
                    <Mail className="w-4 h-4" />
                    <span className="truncate">{user.email}</span>
                  </div>
                </div>
              </div>

              <div className="divide-y divide-gray-200 text-sm">
                <div className="grid grid-cols-[160px_1fr] items-center gap-4 py-3">
                  <div className="flex items-center gap-2 text-gray-500">
                    <UserIcon className="w-4 h-4" />
                    <span>Role</span>
                  </div>
                  <div className="text-gray-900 text-right truncate">
                    Company Admin
                  </div>
                </div>
                <div className="grid grid-cols-[160px_1fr] items-center gap-4 py-3">
                  <div className="flex items-center gap-2 text-gray-500">
                    <Phone className="w-4 h-4" />
                    <span>Phone</span>
                  </div>
                  <div className="text-gray-900 text-right truncate">
                    {user.phone || 'N/A'}
                  </div>
                </div>
                <div className="grid grid-cols-[160px_1fr] items-center gap-4 py-3">
                  <div className="flex items-center gap-2 text-gray-500">
                    <Building2 className="w-4 h-4" />
                    <span>Company</span>
                  </div>
                  <div className="text-gray-900 text-right truncate">
                    {user.company ? `${user.company.name} (${user.company.code})` : 'N/A'}
                  </div>
                </div>
                <div className="grid grid-cols-[160px_1fr] items-center gap-4 py-3">
                  <div className="flex items-center gap-2 text-gray-500">
                    <CalendarDays className="w-4 h-4" />
                    <span>Created At</span>
                  </div>
                  <div className="text-gray-900 text-right">{formatDate(user.createdAt)}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-sm text-gray-500">No admin data available</p>
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
