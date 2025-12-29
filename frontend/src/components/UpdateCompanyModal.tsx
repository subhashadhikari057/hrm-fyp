'use client';

import { useState, useEffect } from 'react';
import { companyApi, type Company, type UpdateCompanyRequest } from '../lib/api/company';
import { API_BASE_URL } from '../lib/api/types';
import toast from 'react-hot-toast';
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

export interface UpdateCompanyModalProps {
    isOpen: boolean;
    onClose: () => void;
    companyId: string | null;
    onSuccess: () => void;
}

export function UpdateCompanyModal({
    isOpen,
    onClose,
    companyId,
    onSuccess,
}: UpdateCompanyModalProps) {
    const [formData, setFormData] = useState<UpdateCompanyRequest>({
        name: '',
        code: '',
        industry: '',
        address: '',
        city: '',
        country: '',
        planExpiresAt: '',
        maxEmployees: undefined,
    });
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [fetchingCompany, setFetchingCompany] = useState(false);

    // Fetch company data when modal opens
    useEffect(() => {
        if (isOpen && companyId) {
            fetchCompanyData();
        } else {
            resetForm();
        }
    }, [isOpen, companyId]);

    const fetchCompanyData = async () => {
        if (!companyId) return;

        setFetchingCompany(true);
        try {
            const response = await companyApi.getCompanyById(companyId);
            const company = response.data;

            setFormData({
                name: company.name || '',
                code: company.code || '',
                industry: company.industry || '',
                address: company.address || '',
                city: company.city || '',
                country: company.country || '',
                planExpiresAt: company.planExpiresAt
                    ? new Date(company.planExpiresAt).toISOString().split('T')[0]
                    : '',
                maxEmployees: company.maxEmployees || undefined,
            });
            setLogoFile(null);
            setLogoPreview(company.logoUrl ? `${API_BASE_URL}/uploads/${company.logoUrl}` : null);
        } catch (error) {
            toast.error('Failed to load company data');
            onClose();
        } finally {
            setFetchingCompany(false);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            code: '',
            industry: '',
            address: '',
            city: '',
            country: '',
            planExpiresAt: '',
            maxEmployees: undefined,
        });
        setLogoFile(null);
        setLogoPreview(null);
    };

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]:
                name === 'maxEmployees'
                    ? value
                        ? parseInt(value)
                        : undefined
                    : name === 'code'
                      ? value.toUpperCase()
                      : value,
        }));
    };

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                toast.error('Please select an image file');
                return;
            }

            // Validate file size (5MB max)
            if (file.size > 5 * 1024 * 1024) {
                toast.error('Image size must be less than 5MB');
                return;
            }

            setLogoFile(file);

            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!companyId) return;

        setLoading(true);
        try {
            const updateData: UpdateCompanyRequest = {};

            // Only include fields that have values
            if (formData.name?.trim()) updateData.name = formData.name.trim();
            if (formData.code?.trim()) updateData.code = formData.code.trim().toUpperCase();
            if (formData.industry?.trim()) updateData.industry = formData.industry.trim();
            if (formData.address?.trim()) updateData.address = formData.address.trim();
            if (formData.city?.trim()) updateData.city = formData.city.trim();
            if (formData.country?.trim()) updateData.country = formData.country.trim();
            if (formData.planExpiresAt) updateData.planExpiresAt = new Date(formData.planExpiresAt).toISOString();
            if (formData.maxEmployees !== undefined && formData.maxEmployees > 0) {
                updateData.maxEmployees = formData.maxEmployees;
            }
            if (logoFile) updateData.logo = logoFile;

            await companyApi.updateCompany(companyId, updateData);

            toast.success('Company updated successfully');
            onSuccess();
            onClose();
        } catch (error: any) {
            toast.error(error.message || 'Failed to update company');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Update Company</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                        {fetchingCompany ? (
                            <div className="flex justify-center items-center py-12">
                                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600"></div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Logo Upload */}
                                <div>
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
                                                accept="image/*"
                                                onChange={handleLogoChange}
                                            />
                                            <p className="text-xs text-muted-foreground mt-1">
                                                PNG, JPG, GIF up to 5MB
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Company Name */}
                                <div>
                                    <Label htmlFor="name">
                                        Company Name <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        type="text"
                                        id="name"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        required
                                        maxLength={150}
                                        placeholder="Enter company name"
                                    />
                                </div>

                                {/* Company Code */}
                                <div>
                                    <Label htmlFor="code">
                                        Company Code <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        type="text"
                                        id="code"
                                        name="code"
                                        value={formData.code}
                                        onChange={handleInputChange}
                                        required
                                        maxLength={10}
                                        pattern="[A-Z0-9]{2,10}"
                                        placeholder="ACME001"
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">
                                        2-10 uppercase alphanumeric characters
                                    </p>
                                </div>

                                {/* Industry */}
                                <div>
                                    <Label htmlFor="industry">Industry</Label>
                                    <Input
                                        type="text"
                                        id="industry"
                                        name="industry"
                                        value={formData.industry}
                                        onChange={handleInputChange}
                                        placeholder="e.g., Technology, Healthcare"
                                    />
                                </div>

                                {/* Address */}
                                <div>
                                    <Label htmlFor="address">Address</Label>
                                    <Input
                                        type="text"
                                        id="address"
                                        name="address"
                                        value={formData.address}
                                        onChange={handleInputChange}
                                        placeholder="Street address"
                                    />
                                </div>

                                {/* City & Country */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="city">City</Label>
                                        <Input
                                            type="text"
                                            id="city"
                                            name="city"
                                            value={formData.city}
                                            onChange={handleInputChange}
                                            placeholder="City"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="country">Country</Label>
                                        <Input
                                            type="text"
                                            id="country"
                                            name="country"
                                            value={formData.country}
                                            onChange={handleInputChange}
                                            placeholder="Country"
                                        />
                                    </div>
                                </div>

                                {/* Plan Expires At & Max Employees */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="planExpiresAt">Plan Expires At</Label>
                                        <Input
                                            type="date"
                                            id="planExpiresAt"
                                            name="planExpiresAt"
                                            value={formData.planExpiresAt}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="maxEmployees">Max Employees</Label>
                                        <Input
                                            type="number"
                                            id="maxEmployees"
                                            name="maxEmployees"
                                            value={formData.maxEmployees || ''}
                                            onChange={handleInputChange}
                                            min="1"
                                            placeholder="100"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="pt-6">
                            <DialogFooter>
                                <Button type="button" variant="cancel" onClick={onClose} disabled={loading}>
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    variant="blue"
                                    disabled={loading || fetchingCompany}
                                >
                                    {loading ? 'Updating...' : 'Update Company'}
                                </Button>
                            </DialogFooter>
                        </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
