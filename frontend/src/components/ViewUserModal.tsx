'use client';

import { useState, useEffect } from 'react';
import { superadminApi, type User } from '../lib/api/superadmin';

export interface ViewUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string | null;
}

// Map backend role to display role
function mapRoleToDisplay(role: string): string {
  const roleMap: Record<string, string> = {
    super_admin: 'Super Admin',
    company_admin: 'Company Admin',
    hr_manager: 'HR Manager',
    manager: 'Manager',
    employee: 'Employee',
  };
  return roleMap[role] || role;
}

export function ViewUserModal({ isOpen, onClose, userId }: ViewUserModalProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch user data when modal opens
  useEffect(() => {
    if (isOpen && userId) {
      fetchUserData();
    } else {
      setUser(null);
      setError(null);
    }
  }, [isOpen, userId]);

  const fetchUserData = async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);
    try {
      const response = await superadminApi.getUserById(userId);
      setUser(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load user data');
      console.error('Error fetching user:', err);
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

  const getStatusBadge = (isActive: boolean) => {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
          isActive
            ? 'bg-green-100 text-green-800'
            : 'bg-gray-100 text-gray-800'
        }`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-green-600' : 'bg-gray-600'}`}></span>
        {isActive ? 'Active' : 'Inactive'}
      </span>
    );
  };

  const getRoleBadge = (role: string) => {
    const roleStyles: Record<string, string> = {
      super_admin: 'bg-purple-100 text-purple-800',
      company_admin: 'bg-blue-100 text-blue-800',
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
        {mapRoleToDisplay(role)}
      </span>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop with blur */}
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300" 
        onClick={onClose} 
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-2 sm:p-4">
        <div className="relative bg-white rounded-lg sm:rounded-xl shadow-xl max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
          {/* Content */}
          <div className="relative">
            {/* Close button - absolute positioned */}
            <button
              onClick={onClose}
              className="absolute top-2 right-2 sm:top-4 sm:right-4 z-20 w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-white hover:bg-gray-50 text-gray-500 hover:text-gray-700 transition-colors shadow-md"
              aria-label="Close"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

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
                <span className="mt-3 sm:mt-4 text-sm sm:text-base text-gray-600 font-medium">Loading user data...</span>
              </div>
            ) : user ? (
              <div className="space-y-4 sm:space-y-6">
                {/* Profile Header */}
                <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4 md:gap-6 pb-4 sm:pb-6 border-b border-gray-200">
                  <div className="flex-shrink-0 mx-auto sm:mx-0">
                    {user.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt={user.fullName || user.email}
                        className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full object-cover border-2 border-gray-200"
                      />
                    ) : (
                      <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl sm:text-3xl md:text-4xl font-bold border-2 border-gray-200">
                        {(user.fullName || user.email)
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .toUpperCase()
                          .slice(0, 2)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 pt-0 sm:pt-2 text-center sm:text-left w-full sm:w-auto">
                    <h4 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 truncate mb-1">
                      {user.fullName || 'No Name'}
                    </h4>
                    <p className="text-gray-500 text-xs sm:text-sm md:text-base mb-3 sm:mb-4 truncate flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2">
                      <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span className="truncate">{user.email}</span>
                    </p>
                    <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                      {getStatusBadge(user.isActive)}
                      {getRoleBadge(user.role)}
                    </div>
                  </div>
                </div>

                {/* User Information Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  {/* Email */}
                  <div className="bg-gray-50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-200 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</label>
                    </div>
                    <p className="text-xs sm:text-sm font-medium text-gray-900 break-words pl-8 sm:pl-10">{user.email}</p>
                  </div>

                  {/* Full Name */}
                  <div className="bg-gray-50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-200 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                        <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Full Name</label>
                    </div>
                    <p className="text-xs sm:text-sm font-medium text-gray-900 pl-8 sm:pl-10">{user.fullName || 'N/A'}</p>
                  </div>

                  {/* Phone */}
                  <div className="bg-gray-50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-200 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                        <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                      </div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Phone</label>
                    </div>
                    <p className="text-xs sm:text-sm font-medium text-gray-900 pl-8 sm:pl-10">{user.phone || 'N/A'}</p>
                  </div>

                  {/* Company */}
                  <div className="bg-gray-50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-200 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                        <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Company</label>
                    </div>
                    <p className="text-xs sm:text-sm font-medium text-gray-900 pl-8 sm:pl-10">
                      {user.company ? `${user.company.name} (${user.company.code})` : 'N/A'}
                    </p>
                  </div>

                  {/* Joined At */}
                  <div className="bg-gray-50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-200 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                        <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Joined At</label>
                    </div>
                    <p className="text-xs sm:text-sm font-medium text-gray-900 pl-8 sm:pl-10">{formatDate(user.createdAt)}</p>
                  </div>

                  {/* Last Login */}
                  <div className="bg-gray-50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-200 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-pink-100 flex items-center justify-center flex-shrink-0">
                        <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Last Login</label>
                    </div>
                    <p className="text-xs sm:text-sm font-medium text-gray-900 pl-8 sm:pl-10">{formatDate(user.lastLoginAt)}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2 sm:gap-3 pt-4 sm:pt-6 mt-4 sm:mt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 sm:py-20">
                <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                  <svg className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <p className="text-sm sm:text-base text-gray-500 font-medium">No user data available</p>
                <div className="flex justify-end gap-2 sm:gap-3 pt-4 sm:pt-6 mt-4 sm:mt-6">
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}

