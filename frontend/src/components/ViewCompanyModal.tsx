'use client';

import { useState, useEffect } from 'react';
import { companyApi, type Company } from '../lib/api/company';

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
                  <span className="mt-3 sm:mt-4 text-sm sm:text-base text-gray-600 font-medium">
                    Loading company data...
                  </span>
                </div>
              ) : company ? (
                <div className="space-y-4 sm:space-y-6">
                  {/* Company Header */}
                  <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4 md:gap-6 pb-4 sm:pb-6 border-b border-gray-200">
                    <div className="flex-shrink-0 mx-auto sm:mx-0">
                      {company.logoUrl ? (
                        <>
                          <img
                            src={`${API_BASE_URL}/uploads/${company.logoUrl}`}
                            alt={company.name}
                            className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-lg sm:rounded-xl object-cover border-2 border-gray-200"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                              if (fallback) fallback.classList.remove('hidden');
                            }}
                          />
                          <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-lg sm:rounded-xl bg-blue-600 flex items-center justify-center text-white text-2xl sm:text-3xl md:text-4xl font-bold border-2 border-gray-200 hidden">
                            {company.name
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .toUpperCase()
                              .slice(0, 2)}
                          </div>
                        </>
                      ) : (
                        <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-lg sm:rounded-xl bg-blue-600 flex items-center justify-center text-white text-2xl sm:text-3xl md:text-4xl font-bold border-2 border-gray-200">
                          {company.name
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
                        {company.name}
                      </h4>
                      <p className="text-gray-500 text-xs sm:text-sm md:text-base mb-3 sm:mb-4 truncate flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2">
                        <svg
                          className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"
                          />
                        </svg>
                        <span className="font-mono">{company.code}</span>
                      </p>
                      <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                        {getStatusBadge(company.status)}
                      </div>
                    </div>
                  </div>

                  {/* Company Information Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    {/* Industry */}
                    <div className="bg-gray-50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-200 hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <svg
                            className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          Industry
                        </label>
                      </div>
                      <p className="text-xs sm:text-sm font-medium text-gray-900 pl-8 sm:pl-10">
                        {company.industry || 'N/A'}
                      </p>
                    </div>

                    {/* User Count */}
                    <div className="bg-gray-50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-200 hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                          <svg
                            className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                            />
                          </svg>
                        </div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          Total Users
                        </label>
                      </div>
                      <p className="text-xs sm:text-sm font-medium text-gray-900 pl-8 sm:pl-10">
                        {company.userCount.toLocaleString()}
                      </p>
                    </div>

                    {/* Max Employees */}
                    {company.maxEmployees && (
                      <div className="bg-gray-50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-200 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                            <svg
                              className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-600"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M17 20h5v-2a3 3 0 00-5.196-2.137M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.196-2.137M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                              />
                            </svg>
                          </div>
                          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                            Max Employees
                          </label>
                        </div>
                        <p className="text-xs sm:text-sm font-medium text-gray-900 pl-8 sm:pl-10">
                          {company.maxEmployees.toLocaleString()}
                        </p>
                      </div>
                    )}

                    {/* Address */}
                    {company.address && (
                      <div className="bg-gray-50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-200 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                            <svg
                              className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-600"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                            </svg>
                          </div>
                          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                            Address
                          </label>
                        </div>
                        <p className="text-xs sm:text-sm font-medium text-gray-900 pl-8 sm:pl-10 break-words">
                          {company.address}
                        </p>
                      </div>
                    )}

                    {/* City */}
                    {company.city && (
                      <div className="bg-gray-50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-200 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <svg
                              className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-600"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                              />
                            </svg>
                          </div>
                          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">City</label>
                        </div>
                        <p className="text-xs sm:text-sm font-medium text-gray-900 pl-8 sm:pl-10">
                          {company.city}
                        </p>
                      </div>
                    )}

                    {/* Country */}
                    {company.country && (
                      <div className="bg-gray-50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-200 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-pink-100 flex items-center justify-center flex-shrink-0">
                            <svg
                              className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-pink-600"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                          </div>
                          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                            Country
                          </label>
                        </div>
                        <p className="text-xs sm:text-sm font-medium text-gray-900 pl-8 sm:pl-10">
                          {company.country}
                        </p>
                      </div>
                    )}

                    {/* Plan Expires At */}
                    {company.planExpiresAt && (
                      <div className="bg-gray-50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-200 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-yellow-100 flex items-center justify-center flex-shrink-0">
                            <svg
                              className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-600"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                          </div>
                          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                            Plan Expires
                          </label>
                        </div>
                        <p className="text-xs sm:text-sm font-medium text-gray-900 pl-8 sm:pl-10">
                          {formatDateOnly(company.planExpiresAt)}
                        </p>
                      </div>
                    )}

                    {/* Created At */}
                    <div className="bg-gray-50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-200 hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-teal-100 flex items-center justify-center flex-shrink-0">
                          <svg
                            className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-teal-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          Created At
                        </label>
                      </div>
                      <p className="text-xs sm:text-sm font-medium text-gray-900 pl-8 sm:pl-10">
                        {formatDate(company.createdAt)}
                      </p>
                    </div>

                    {/* Updated At */}
                    {company.updatedAt && (
                      <div className="bg-gray-50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-200 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-cyan-100 flex items-center justify-center flex-shrink-0">
                            <svg
                              className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-600"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                              />
                            </svg>
                          </div>
                          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                            Last Updated
                          </label>
                        </div>
                        <p className="text-xs sm:text-sm font-medium text-gray-900 pl-8 sm:pl-10">
                          {formatDate(company.updatedAt)}
                        </p>
                      </div>
                    )}
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
                    <svg
                      className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                  </div>
                  <p className="text-sm sm:text-base text-gray-500 font-medium">No company data available</p>
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








