'use client';

import { useState, useEffect } from 'react';
import { superadminApi, type UpdateUserRequest, type BackendUserRole, type User } from '../lib/api/superadmin';
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

export interface UpdateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userId: string | null;
}

const USER_ROLES: { value: BackendUserRole; label: string }[] = [
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'company_admin', label: 'Company Admin' },
  { value: 'hr_manager', label: 'HR Manager' },
  { value: 'manager', label: 'Manager' },
  { value: 'employee', label: 'Employee' },
];

export function UpdateUserModal({ isOpen, onClose, onSuccess, userId }: UpdateUserModalProps) {
  const [formData, setFormData] = useState<UpdateUserRequest>({
    email: '',
    fullName: '',
    phone: '',
    role: 'employee',
    avatarUrl: '',
    isActive: true,
  });
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingUser, setLoadingUser] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingCompanies, setLoadingCompanies] = useState(false);

  // Fetch user data and companies when modal opens
  useEffect(() => {
    if (isOpen && userId) {
      fetchUserData();
      fetchCompanies();
    }
  }, [isOpen, userId]);

  const fetchUserData = async () => {
    if (!userId) return;
    
    setLoadingUser(true);
    setError(null);
    try {
      const response = await superadminApi.getUserById(userId);
      const user = response.data;
      
      setFormData({
        email: user.email || '',
        fullName: user.fullName || '',
        phone: user.phone || '',
        role: user.role || 'employee',
        avatarUrl: user.avatarUrl || '',
        isActive: user.isActive !== undefined ? user.isActive : true,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load user data');
      console.error('Error fetching user:', err);
    } finally {
      setLoadingUser(false);
    }
  };

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
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    setError(null);
    setLoading(true);

    try {
      // Prepare data - only include fields that have values
      const submitData: UpdateUserRequest = {};

      if (formData.email?.trim()) {
        submitData.email = formData.email.trim();
      }

      if (formData.fullName?.trim()) {
        submitData.fullName = formData.fullName.trim();
      }

      if (formData.phone?.trim()) {
        submitData.phone = formData.phone.trim();
      }

      if (formData.role) {
        submitData.role = formData.role;
      }

      if (formData.avatarUrl?.trim()) {
        submitData.avatarUrl = formData.avatarUrl.trim();
      }

      if (formData.isActive !== undefined) {
        submitData.isActive = formData.isActive;
      }

      await superadminApi.updateUser(userId, submitData);
      onSuccess();
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      email: '',
      fullName: '',
      phone: '',
      role: 'employee',
      avatarUrl: '',
      isActive: true,
    });
    setError(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update User</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {loadingUser ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Loading user data...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Email */}
                <div className="md:col-span-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="user@example.com"
                  />
                </div>

                {/* Full Name */}
                <div>
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    type="text"
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="John Doe"
                  />
                </div>

                {/* Phone */}
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    maxLength={20}
                    placeholder="+1234567890"
                  />
                </div>

                {/* Role */}
                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <select
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {USER_ROLES.map((role) => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Avatar URL */}
                <div>
                  <Label htmlFor="avatarUrl">Avatar URL</Label>
                  <Input
                    type="url"
                    id="avatarUrl"
                    name="avatarUrl"
                    value={formData.avatarUrl}
                    onChange={handleChange}
                    placeholder="https://example.com/avatar.jpg"
                  />
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
            )}

            {/* Actions */}
            <div className="pt-6">
              <DialogFooter>
                <Button type="button" variant="cancel" onClick={handleClose} disabled={loading || loadingUser}>
                  Cancel
                </Button>
                <Button type="submit" variant="blue" disabled={loading || loadingUser}>
                  {loading ? 'Updating...' : 'Update User'}
                </Button>
              </DialogFooter>
            </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
