'use client';

import { useState } from 'react';
import { companyApi, type CreateCompanyWithAdminRequest } from '../lib/api/company';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';

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
        [name]: name === 'companyCode' ? value.toUpperCase() : value,
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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Company</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2 space-y-1.5">
              <Label htmlFor="companyName">
                Company Name <span className="text-red-500">*</span>
              </Label>
              <Input
                type="text"
                id="companyName"
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                required
                maxLength={150}
                placeholder="Acme Corporation"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="companyCode">Company Code</Label>
              <Input
                type="text"
                id="companyCode"
                name="companyCode"
                value={formData.companyCode}
                onChange={handleChange}
                maxLength={10}
                pattern="[A-Z0-9]{2,10}"
                placeholder="ACME001"
              />
              <p className="text-xs text-muted-foreground">2-10 uppercase alphanumeric characters</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="industry">Industry</Label>
              <Input
                type="text"
                id="industry"
                name="industry"
                value={formData.industry}
                onChange={handleChange}
                placeholder="Technology"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="adminEmail">
                Admin Email <span className="text-red-500">*</span>
              </Label>
              <Input
                type="email"
                id="adminEmail"
                name="adminEmail"
                value={formData.adminEmail}
                onChange={handleChange}
                required
                placeholder="admin@company.com"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="adminPassword">
                Admin Password <span className="text-red-500">*</span>
              </Label>
              <Input
                type="password"
                id="adminPassword"
                name="adminPassword"
                value={formData.adminPassword}
                onChange={handleChange}
                required
                minLength={8}
                placeholder="Minimum 8 characters"
              />
              <p className="text-xs text-muted-foreground">
                Password must be at least 8 characters long
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="adminFullName">Admin Full Name</Label>
              <Input
                type="text"
                id="adminFullName"
                name="adminFullName"
                value={formData.adminFullName}
                onChange={handleChange}
                placeholder="Jane Smith"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="adminPhone">Admin Phone</Label>
              <Input
                type="tel"
                id="adminPhone"
                name="adminPhone"
                value={formData.adminPhone}
                onChange={handleChange}
                maxLength={20}
                placeholder="+1234567890"
              />
            </div>

            <div className="md:col-span-2 space-y-1.5">
              <Label htmlFor="address">Address</Label>
              <Input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="123 Main Street"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="city">City</Label>
              <Input
                type="text"
                id="city"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="New York"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="country">Country</Label>
              <Input
                type="text"
                id="country"
                name="country"
                value={formData.country}
                onChange={handleChange}
                placeholder="United States"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="maxEmployees">Max Employees</Label>
              <Input
                type="number"
                id="maxEmployees"
                name="maxEmployees"
                value={formData.maxEmployees || ''}
                onChange={handleChange}
                min="1"
                placeholder="100"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="planExpiresAt">Plan Expires At</Label>
              <Input
                type="date"
                id="planExpiresAt"
                name="planExpiresAt"
                value={formData.planExpiresAt}
                onChange={handleChange}
              />
            </div>

            <div className="md:col-span-2 space-y-1.5">
              <Label htmlFor="logo">Company Logo</Label>
              <Input
                type="file"
                id="logo"
                name="logo"
                accept="image/*"
                onChange={handleChange}
              />
              {logoFile && (
                <p className="text-xs text-muted-foreground">Selected: {logoFile.name}</p>
              )}
            </div>
          </div>

          <div className="pt-6">
            <DialogFooter>
              <Button type="button" variant="cancel" onClick={handleClose} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" variant="blue" disabled={loading}>
                {loading ? 'Creating...' : 'Create Company'}
              </Button>
            </DialogFooter>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
