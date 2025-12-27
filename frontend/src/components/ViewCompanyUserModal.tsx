'use client';

import { useMemo } from 'react';
import { type CompanyUser } from '../lib/api/company-users';
import { API_BASE_URL } from '../lib/api/types';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import {
  CalendarDays,
  Mail,
  Phone,
  User as UserIcon,
  UserX,
} from 'lucide-react';

export interface ViewCompanyUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: CompanyUser | null;
}

const roleMap: Record<string, string> = {
  hr_manager: 'HR Manager',
  manager: 'Manager',
  employee: 'Employee',
};

export function ViewCompanyUserModal({ isOpen, onClose, user }: ViewCompanyUserModalProps) {
  const resolveAvatarUrl = (avatarUrl: string | null | undefined) => {
    if (!avatarUrl) return null;
    return avatarUrl.startsWith('http') ? avatarUrl : `${API_BASE_URL}/uploads/${avatarUrl}`;
  };

  const statusBadge = (isActive: boolean) => (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
        isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-green-600' : 'bg-gray-600'}`}></span>
      {isActive ? 'Active' : 'Inactive'}
    </span>
  );

  const roleBadge = (role: string) => {
    const roleStyles: Record<string, string> = {
      hr_manager: 'bg-green-100 text-green-800',
      manager: 'bg-orange-100 text-orange-800',
      employee: 'bg-gray-100 text-gray-800',
    };
    return (
      <span
        className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold ${
          roleStyles[role] || roleStyles.employee
        }`}
      >
        {roleMap[role] || role}
      </span>
    );
  };

  const initials = useMemo(() => {
    if (!user) return '';
    return (user.fullName || user.email)
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }, [user]);

  const formatDate = (dateString?: string | null) => {
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
          <DialogTitle>User Details</DialogTitle>
        </DialogHeader>
        <div className="px-3 sm:px-4 md:px-6 pb-4 sm:pb-6 pt-4 sm:pt-6 relative">
          {!user ? (
            <div className="text-center py-12 sm:py-20">
              <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                <UserX className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
              </div>
              <p className="text-sm sm:text-base text-gray-500 font-medium">No user data available</p>
              <div className="pt-6">
                <DialogFooter>
                  <Button type="button" variant="cancel" onClick={onClose}>
                    Close
                  </Button>
                </DialogFooter>
              </div>
            </div>
          ) : (
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
                    {initials}
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
                <div className="ml-auto flex items-center gap-2">
                  {statusBadge(user.isActive)}
                  {roleBadge(user.role)}
                </div>
              </div>

              <div className="divide-y divide-gray-200 text-sm">
                <div className="grid grid-cols-[160px_1fr] items-center gap-4 py-3">
                  <div className="flex items-center gap-2 text-gray-500">
                    <UserIcon className="w-4 h-4" />
                    <span>Full Name</span>
                  </div>
                  <div className="text-gray-900 truncate text-right">
                    {user.fullName || 'N/A'}
                  </div>
                </div>
                <div className="grid grid-cols-[160px_1fr] items-center gap-4 py-3">
                  <div className="flex items-center gap-2 text-gray-500">
                    <Phone className="w-4 h-4" />
                    <span>Phone</span>
                  </div>
                  <div className="text-gray-900 truncate text-right">
                    {user.phone || 'N/A'}
                  </div>
                </div>
                <div className="grid grid-cols-[160px_1fr] items-center gap-4 py-3">
                  <div className="flex items-center gap-2 text-gray-500">
                    <UserIcon className="w-4 h-4" />
                    <span>Role</span>
                  </div>
                  <div className="text-gray-900 truncate text-right">
                    {roleMap[user.role] || user.role}
                  </div>
                </div>
                <div className="grid grid-cols-[160px_1fr] items-center gap-4 py-3">
                  <div className="flex items-center gap-2 text-gray-500">
                    <CalendarDays className="w-4 h-4" />
                    <span>Joined</span>
                  </div>
                  <div className="text-gray-900 truncate text-right">
                    {formatDate(user.createdAt)}
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <DialogFooter>
                  <Button type="button" variant="cancel" onClick={onClose}>
                    Close
                  </Button>
                </DialogFooter>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
