'use client';

import { useEffect, useState } from 'react';
import { companyUserApi, type CompanyUser, type CompanyUserRole, type UpdateCompanyUserRequest } from '../lib/api/company-users';
import { API_BASE_URL } from '../lib/api/types';
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

export interface UpdateCompanyUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user: CompanyUser | null;
}

const USER_ROLES: { value: CompanyUserRole; label: string }[] = [
  { value: 'hr_manager', label: 'HR Manager' },
  { value: 'manager', label: 'Manager' },
  { value: 'employee', label: 'Employee' },
];

export function UpdateCompanyUserModal({ isOpen, onClose, onSuccess, user }: UpdateCompanyUserModalProps) {
  const [formData, setFormData] = useState<UpdateCompanyUserRequest>({
    fullName: '',
    phone: '',
    role: 'employee',
    isActive: true,
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && user) {
      setFormData({
        fullName: user.fullName || '',
        phone: user.phone || '',
        role: user.role,
        isActive: user.isActive,
      });
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
      }
      setAvatarFile(null);
      setAvatarPreview(null);
    }
  }, [isOpen, user]);

  useEffect(() => {
    return () => {
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'file') {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB');
        return;
      }
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
      }
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
      return;
    }
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setError(null);
    setLoading(true);

    try {
      const submitData: UpdateCompanyUserRequest = {
        fullName: formData.fullName?.trim() || undefined,
        phone: formData.phone?.trim() || undefined,
        role: formData.role,
        isActive: formData.isActive,
      };
      if (avatarFile) {
        submitData.avatar = avatarFile;
      }

      await companyUserApi.updateCompanyUser(user.id, submitData);
      onSuccess();
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError(null);
    if (avatarPreview) {
      URL.revokeObjectURL(avatarPreview);
    }
    setAvatarFile(null);
    setAvatarPreview(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update User</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="email">Email</Label>
              <Input
                type="email"
                id="email"
                value={user?.email || ''}
                disabled
              />
            </div>

            <div>
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                type="text"
                id="fullName"
                name="fullName"
                value={formData.fullName || ''}
                onChange={handleChange}
                autoComplete="off"
                placeholder="John Doe"
              />
            </div>

            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone || ''}
                onChange={handleChange}
                maxLength={20}
                autoComplete="off"
                placeholder="+1234567890"
              />
            </div>

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

            <div className="md:col-span-2 space-y-1.5">
              <Label htmlFor="avatar">Avatar</Label>
              <div className="flex items-center gap-4">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Avatar preview"
                    className="w-20 h-20 rounded-lg object-cover border-2 border-gray-200"
                  />
                ) : user?.avatarUrl ? (
                  <img
                    src={
                      user.avatarUrl.startsWith('http')
                        ? user.avatarUrl
                        : `${API_BASE_URL}/uploads/${user.avatarUrl}`
                    }
                    alt={user.fullName || user.email}
                    className="w-20 h-20 rounded-lg object-cover border-2 border-gray-200"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">
                    <span className="text-xs">No image</span>
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

          <div className="pt-6">
            <DialogFooter>
              <Button type="button" variant="cancel" onClick={handleClose} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" variant="blue" disabled={loading}>
                {loading ? 'Updating...' : 'Update User'}
              </Button>
            </DialogFooter>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
