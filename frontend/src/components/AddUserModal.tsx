'use client';

import { useState, useEffect } from 'react';
import { superadminApi, type CreateUserRequest, type BackendUserRole } from '../lib/api/superadmin';
import { companyApi, type Company } from '../lib/api/company';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';

export interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const USER_ROLES: { value: BackendUserRole; label: string }[] = [
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'company_admin', label: 'Company Admin' },
  { value: 'hr_manager', label: 'HR Manager' },
  { value: 'manager', label: 'Manager' },
  { value: 'employee', label: 'Employee' },
];

export function AddUserModal({ isOpen, onClose, onSuccess }: AddUserModalProps) {
  const [formData, setFormData] = useState<CreateUserRequest>({
    email: '',
    password: '',
    fullName: '',
    phone: '',
    role: 'employee',
    companyId: '',
    isActive: true,
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingCompanies, setLoadingCompanies] = useState(false);

  // Fetch companies when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchCompanies();
    }
  }, [isOpen]);

  const fetchCompanies = async () => {
    setLoadingCompanies(true);
    try {
      const response = await companyApi.getCompanies();
      setCompanies(response.data);
    } catch (err) {
      console.error('Failed to fetch companies:', err);
    } finally {
      setLoadingCompanies(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'file') {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        setAvatarFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          setAvatarPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Validate required fields
      if (
        !formData.email ||
        !formData.password ||
        !formData.fullName ||
        !formData.phone ||
        !formData.role ||
        !formData.companyId
      ) {
        throw new Error('Email, password, full name, phone, role, and company are required');
      }

      // Prepare data - remove empty optional fields
      const submitData: CreateUserRequest = {
        email: formData.email.trim(),
        password: formData.password,
        fullName: formData.fullName.trim(),
        phone: formData.phone.trim(),
        role: formData.role,
        companyId: formData.companyId,
        isActive: formData.isActive !== undefined ? formData.isActive : true,
      };

      if (avatarFile) {
        submitData.avatar = avatarFile;
      }

      await superadminApi.createUser(submitData);
      onSuccess();
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      email: '',
      password: '',
      fullName: '',
      phone: '',
      role: 'employee',
      companyId: '',
      isActive: true,
    });
    setAvatarFile(null);
    setAvatarPreview(null);
    setError(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New User</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Email */}
              <div className="md:col-span-2">
                <Label htmlFor="email">
                  Email <span className="text-red-500">*</span>
                </Label>
              <Input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                autoComplete="off"
                placeholder="user@example.com"
              />
              </div>

              {/* Password */}
              <div className="md:col-span-2">
                <Label htmlFor="password">
                  Password <span className="text-red-500">*</span>
                </Label>
              <Input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={8}
                autoComplete="new-password"
                placeholder="Minimum 8 characters"
              />
                <p className="mt-1 text-xs text-muted-foreground">
                  Password must be at least 8 characters long
                </p>
              </div>

              {/* Full Name */}
              <div>
                <Label htmlFor="fullName">
                  Full Name <span className="text-red-500">*</span>
                </Label>
              <Input
                type="text"
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                required
                autoComplete="off"
                placeholder="John Doe"
              />
              </div>

              {/* Phone */}
              <div>
                <Label htmlFor="phone">
                  Phone <span className="text-red-500">*</span>
                </Label>
              <Input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                maxLength={20}
                autoComplete="off"
                placeholder="+1234567890"
              />
              </div>

              {/* Role */}
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                  Role <span className="text-red-500">*</span>
                </label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {USER_ROLES.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Company */}
              <div>
                <label htmlFor="companyId" className="block text-sm font-medium text-gray-700 mb-1">
                  Company <span className="text-red-500">*</span>
                </label>
                <select
                  id="companyId"
                  name="companyId"
                  value={formData.companyId}
                  onChange={handleChange}
                  required
                  disabled={loadingCompanies}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">Select company</option>
                  {loadingCompanies ? (
                    <option>Loading companies...</option>
                  ) : (
                    companies.map((company) => (
                      <option key={company.id} value={company.id}>
                        {company.name} ({company.code})
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="md:col-span-2 space-y-1.5">
                <Label htmlFor="avatar">Avatar</Label>
                <div className="flex items-center gap-4">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Avatar preview"
                      className="w-20 h-20 rounded-lg object-cover border-2 border-gray-200"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                  )}
                  <div className="flex-1">
                    <Input
                      type="file"
                      id="avatar"
                      name="avatar"
                      accept="image/*"
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              {/* Active Status */}
              <div className="md:col-span-2 flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleChange}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="isActive" className="ml-2 text-sm font-medium text-gray-700">
                  Active Account
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-6">
              <DialogFooter>
                <Button type="button" variant="cancel" onClick={handleClose} disabled={loading}>
                  Cancel
                </Button>
                <Button type="submit" variant="blue" disabled={loading}>
                  {loading ? 'Creating...' : 'Create User'}
                </Button>
              </DialogFooter>
            </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
