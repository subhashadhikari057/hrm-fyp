'use client';

import { useState } from 'react';
import { companyApi, type CreateCompanyWithAdminRequest } from '../lib/api/company';

export interface AddCompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddCompanyModal({ isOpen, onClose, onSuccess }: AddCompanyModalProps) {
  const [formData, setFormData] = useState<CreateCompanyWithAdminRequest>({
    companyName: '',
    companyCode: '',
    adminEmail: '',
    adminPassword: '',
    adminFullName: '',
    adminPhone: '',
    industry: '',
    address: '',
    city: '',
    country: '',
    maxEmployees: undefined,
    planExpiresAt: '',
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'file') {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        setLogoFile(file);
      }
    } else if (type === 'number') {
      setFormData((prev) => ({
        ...prev,
        [name]: value ? parseInt(value, 10) : undefined,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Validate required fields
      if (!formData.companyName || !formData.adminEmail || !formData.adminPassword) {
        throw new Error('Company name, admin email, and password are required');
      }

      // Prepare data
      const submitData: CreateCompanyWithAdminRequest = {
        companyName: formData.companyName.trim(),
        adminEmail: formData.adminEmail.trim(),
        adminPassword: formData.adminPassword,
      };

      if (formData.companyCode?.trim()) {
        submitData.companyCode = formData.companyCode.trim().toUpperCase();
      }

      if (formData.adminFullName?.trim()) {
        submitData.adminFullName = formData.adminFullName.trim();
      }

      if (formData.adminPhone?.trim()) {
        submitData.adminPhone = formData.adminPhone.trim();
      }

      if (formData.industry?.trim()) {
        submitData.industry = formData.industry.trim();
      }

      if (formData.address?.trim()) {
        submitData.address = formData.address.trim();
      }

      if (formData.city?.trim()) {
        submitData.city = formData.city.trim();
      }

      if (formData.country?.trim()) {
        submitData.country = formData.country.trim();
      }

      if (formData.maxEmployees) {
        submitData.maxEmployees = formData.maxEmployees;
      }

      if (formData.planExpiresAt) {
        submitData.planExpiresAt = formData.planExpiresAt;
      }

      if (logoFile) {
        submitData.logo = logoFile;
      }

      await companyApi.createCompanyWithAdmin(submitData);
      onSuccess();
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create company');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      companyName: '',
      companyCode: '',
      adminEmail: '',
      adminPassword: '',
      adminFullName: '',
      adminPhone: '',
      industry: '',
      address: '',
      city: '',
      country: '',
      maxEmployees: undefined,
      planExpiresAt: '',
    });
    setLogoFile(null);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop with blur */}
      <div className="fixed inset-0 bg-white/30 backdrop-blur-sm transition-opacity" onClick={handleClose} />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900">Add New Company</h3>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Company Name */}
              <div className="md:col-span-2">
                <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1">
                  Company Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="companyName"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  required
                  maxLength={150}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Acme Corporation"
                />
              </div>

              {/* Company Code */}
              <div>
                <label htmlFor="companyCode" className="block text-sm font-medium text-gray-700 mb-1">
                  Company Code
                </label>
                <input
                  type="text"
                  id="companyCode"
                  name="companyCode"
                  value={formData.companyCode}
                  onChange={handleChange}
                  maxLength={10}
                  pattern="[A-Z0-9]{2,10}"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
                  placeholder="ACME001"
                />
                <p className="mt-1 text-xs text-gray-500">2-10 uppercase alphanumeric characters</p>
              </div>

              {/* Industry */}
              <div>
                <label htmlFor="industry" className="block text-sm font-medium text-gray-700 mb-1">
                  Industry
                </label>
                <input
                  type="text"
                  id="industry"
                  name="industry"
                  value={formData.industry}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Technology"
                />
              </div>

              {/* Admin Email */}
              <div>
                <label htmlFor="adminEmail" className="block text-sm font-medium text-gray-700 mb-1">
                  Admin Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="adminEmail"
                  name="adminEmail"
                  value={formData.adminEmail}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="admin@company.com"
                />
              </div>

              {/* Admin Password */}
              <div>
                <label htmlFor="adminPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Admin Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  id="adminPassword"
                  name="adminPassword"
                  value={formData.adminPassword}
                  onChange={handleChange}
                  required
                  minLength={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Minimum 8 characters"
                />
                <p className="mt-1 text-xs text-gray-500">Password must be at least 8 characters long</p>
              </div>

              {/* Admin Full Name */}
              <div>
                <label htmlFor="adminFullName" className="block text-sm font-medium text-gray-700 mb-1">
                  Admin Full Name
                </label>
                <input
                  type="text"
                  id="adminFullName"
                  name="adminFullName"
                  value={formData.adminFullName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Jane Smith"
                />
              </div>

              {/* Admin Phone */}
              <div>
                <label htmlFor="adminPhone" className="block text-sm font-medium text-gray-700 mb-1">
                  Admin Phone
                </label>
                <input
                  type="tel"
                  id="adminPhone"
                  name="adminPhone"
                  value={formData.adminPhone}
                  onChange={handleChange}
                  maxLength={20}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="+1234567890"
                />
              </div>

              {/* Address */}
              <div className="md:col-span-2">
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="123 Main Street"
                />
              </div>

              {/* City */}
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                  City
                </label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="New York"
                />
              </div>

              {/* Country */}
              <div>
                <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
                  Country
                </label>
                <input
                  type="text"
                  id="country"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="United States"
                />
              </div>

              {/* Max Employees */}
              <div>
                <label htmlFor="maxEmployees" className="block text-sm font-medium text-gray-700 mb-1">
                  Max Employees
                </label>
                <input
                  type="number"
                  id="maxEmployees"
                  name="maxEmployees"
                  value={formData.maxEmployees || ''}
                  onChange={handleChange}
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="100"
                />
              </div>

              {/* Plan Expires At */}
              <div>
                <label htmlFor="planExpiresAt" className="block text-sm font-medium text-gray-700 mb-1">
                  Plan Expires At
                </label>
                <input
                  type="date"
                  id="planExpiresAt"
                  name="planExpiresAt"
                  value={formData.planExpiresAt}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Logo Upload */}
              <div className="md:col-span-2">
                <label htmlFor="logo" className="block text-sm font-medium text-gray-700 mb-1">
                  Company Logo
                </label>
                <input
                  type="file"
                  id="logo"
                  name="logo"
                  accept="image/*"
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
                {logoFile && (
                  <p className="mt-1 text-xs text-gray-500">Selected: {logoFile.name}</p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create Company'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

