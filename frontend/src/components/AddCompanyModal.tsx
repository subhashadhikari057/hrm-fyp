
'use client';

import { useState } from 'react';
import { companyApi, type CreateCompanyWithAdminRequest } from '../lib/api/company';
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

type CompanyFormData = Partial<CreateCompanyWithAdminRequest> & {
  companyName: string;
  adminEmail: string;
  adminPassword: string;
};

export interface AddCompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddCompanyModal({ isOpen, onClose, onSuccess }: AddCompanyModalProps) {
  const [formData, setFormData] = useState<CompanyFormData>({
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
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'file') {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        setLogoFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          setLogoPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
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

    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (step !== 2) {
      return;
    }
    if (!validateCompanyStep() || !validateAdminStep()) {
      return;
    }

    setLoading(true);
    try {
      // Validate required fields
      if (
        !formData.companyName ||
        !formData.adminEmail ||
        !formData.adminPassword ||
        !formData.adminFullName ||
        !formData.adminPhone ||
        !formData.industry ||
        !formData.address ||
        !formData.city ||
        !formData.maxEmployees
      ) {
        throw new Error(
          'Company name, admin email, password, admin full name, admin phone, industry, address, city, and max employees are required',
        );
      }

      // Prepare data
      const submitData: CreateCompanyWithAdminRequest = {
        companyName: formData.companyName.trim(),
        adminEmail: formData.adminEmail.trim(),
        adminPassword: formData.adminPassword,
        adminFullName: formData.adminFullName.trim(),
        adminPhone: formData.adminPhone.trim(),
        industry: formData.industry.trim(),
        address: formData.address.trim(),
        city: formData.city.trim(),
        maxEmployees: formData.maxEmployees,
      };

      if (formData.companyCode?.trim()) {
        submitData.companyCode = formData.companyCode.trim().toUpperCase();
      }

      if (formData.country?.trim()) {
        submitData.country = formData.country.trim();
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

  const validateCompanyStep = () => {
    const nextErrors: { [key: string]: string } = {};
    if (!formData.companyName?.trim()) nextErrors.companyName = 'Company name is required';
    if (!formData.industry?.trim()) nextErrors.industry = 'Industry is required';
    if (!formData.address?.trim()) nextErrors.address = 'Address is required';
    if (!formData.city?.trim()) nextErrors.city = 'City is required';
    if (!formData.maxEmployees) nextErrors.maxEmployees = 'Max employees is required';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const validateAdminStep = () => {
    if (!formData.adminEmail || !formData.adminPassword || !formData.adminFullName || !formData.adminPhone) {
      setError('Admin email, password, full name, and phone are required');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    setError(null);
    if (!validateCompanyStep()) return;
    setStep(2);
  };

  const handleBack = () => {
    setError(null);
    setStep(1);
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
    setLogoPreview(null);
    setStep(1);
    setError(null);
    setErrors({});
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

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Step {step} of 2</span>
            <span>{step === 1 ? 'Company details' : 'Admin details'}</span>
          </div>

          {step === 1 ? (
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
                  className={errors.companyName ? 'border-red-500 focus-visible:ring-red-500' : undefined}
                />
                {errors.companyName && <p className="mt-1 text-sm text-red-600">{errors.companyName}</p>}
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
                />
                <p className="text-xs text-muted-foreground">2-10 uppercase alphanumeric characters</p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="industry">
                  Industry <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="text"
                  id="industry"
                  name="industry"
                  value={formData.industry}
                  onChange={handleChange}
                  required
                  className={errors.industry ? 'border-red-500 focus-visible:ring-red-500' : undefined}
                />
                {errors.industry && <p className="mt-1 text-sm text-red-600">{errors.industry}</p>}
              </div>

              <div className="md:col-span-2 space-y-1.5">
                <Label htmlFor="address">
                  Address <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                  className={errors.address ? 'border-red-500 focus-visible:ring-red-500' : undefined}
                />
                {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="city">
                  City <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="text"
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  required
                  className={errors.city ? 'border-red-500 focus-visible:ring-red-500' : undefined}
                />
                {errors.city && <p className="mt-1 text-sm text-red-600">{errors.city}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="country">Country</Label>
                <Input
                  type="text"
                  id="country"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="maxEmployees">
                  Max Employees <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="number"
                  id="maxEmployees"
                  name="maxEmployees"
                  value={formData.maxEmployees || ''}
                  onChange={handleChange}
                  min="1"
                  required
                  className={errors.maxEmployees ? 'border-red-500 focus-visible:ring-red-500' : undefined}
                />
                {errors.maxEmployees && (
                  <p className="mt-1 text-sm text-red-600">{errors.maxEmployees}</p>
                )}
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
                <div className="flex items-center gap-4">
                  {logoPreview ? (
                    <img
                      src={logoPreview}
                      alt="Logo preview"
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
                      id="logo"
                      name="logo"
                      accept="image/*"
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="adminFullName">
                  Admin Full Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="text"
                  id="adminFullName"
                  name="adminFullName"
                  value={formData.adminFullName}
                  onChange={handleChange}
                  required
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
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="adminPhone">
                  Admin Phone <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="tel"
                  id="adminPhone"
                  name="adminPhone"
                  value={formData.adminPhone}
                  onChange={handleChange}
                  required
                  maxLength={20}
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
                />
                <p className="text-xs text-muted-foreground">
                  Password must be at least 8 characters long
                </p>
              </div>
            </div>
          )}

          <div className="pt-6">
            <DialogFooter>
              <Button type="button" variant="cancel" onClick={handleClose} disabled={loading}>
                Cancel
              </Button>
              {step === 1 ? (
                <Button type="button" variant="blue" disabled={loading} onClick={handleNext}>
                  Next
                </Button>
              ) : (
                <>
                  <Button type="button" variant="cancel" onClick={handleBack} disabled={loading}>
                    Back
                  </Button>
                  <Button type="submit" variant="blue" disabled={loading}>
                    {loading ? 'Creating...' : 'Create Company'}
                  </Button>
                </>
              )}
            </DialogFooter>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
