'use client';

import { useState, useEffect } from 'react';
import { companyApi, type Company, type UpdateCompanyRequest } from '../lib/api/company';
import { subscriptionApi, type SubscriptionPlan } from '../lib/api/subscription';
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
    const [companyRecord, setCompanyRecord] = useState<Company | null>(null);
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
    const [plans, setPlans] = useState<SubscriptionPlan[]>([]);

    // Fetch company data when modal opens
    useEffect(() => {
        if (isOpen && companyId) {
            fetchCompanyData();
            fetchSubscriptionPlans();
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
            setCompanyRecord(company);

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
                subscriptionPlanId: company.subscriptionPlan?.id || '',
                subscriptionStatus: company.subscriptionStatus || 'active',
            });
            setLogoFile(null);
            setLogoPreview(company.logoUrl ? `${API_BASE_URL}/uploads/${company.logoUrl}` : null);
        } catch {
            toast.error('Failed to load company data');
            onClose();
        } finally {
            setFetchingCompany(false);
        }
    };

    const fetchSubscriptionPlans = async () => {
        try {
            const response = await subscriptionApi.getPlans();
            setPlans(response.data || []);
        } catch {
            setPlans([]);
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
            subscriptionPlanId: '',
            subscriptionStatus: 'active',
        });
        setLogoFile(null);
        setLogoPreview(null);
        setCompanyRecord(null);
    };

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
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
            if (formData.subscriptionPlanId) updateData.subscriptionPlanId = formData.subscriptionPlanId;
            if (formData.subscriptionStatus) updateData.subscriptionStatus = formData.subscriptionStatus;
            if (logoFile) updateData.logo = logoFile;

            await companyApi.updateCompany(companyId, updateData);

            onSuccess();
            onClose();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to update company');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-xl">
                <DialogHeader>
                    <DialogTitle>Update Company</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6">
                        {fetchingCompany ? (
                            <div className="flex justify-center items-center py-12">
                                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600"></div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                                    <p className="text-sm font-medium text-gray-900">Current Subscription</p>
                                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-600">
                                        <span className="rounded-full bg-white px-3 py-1.5 ring-1 ring-gray-200">
                                            Plan: {companyRecord?.subscriptionPlan
                                                ? `${companyRecord.subscriptionPlan.name} (${companyRecord.subscriptionPlan.code})`
                                                : 'No plan assigned'}
                                        </span>
                                        <span className="rounded-full bg-white px-3 py-1.5 ring-1 ring-gray-200 capitalize">
                                            Status: {companyRecord?.subscriptionStatus || 'active'}
                                        </span>
                                        <span className="rounded-full bg-white px-3 py-1.5 ring-1 ring-gray-200">
                                            Expiry: {formData.planExpiresAt || 'Not set'}
                                        </span>
                                    </div>
                                </div>

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
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
                                </div>

                                {/* Industry */}
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="subscriptionPlanId">Subscription Plan</Label>
                                        <select
                                            id="subscriptionPlanId"
                                            name="subscriptionPlanId"
                                            value={formData.subscriptionPlanId || ''}
                                            onChange={handleInputChange}
                                            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                                        >
                                            <option value="">No plan assigned</option>
                                            {plans.map((plan) => (
                                                <option key={plan.id} value={plan.id}>
                                                    {plan.name} ({plan.code})
                                                </option>
                                            ))}
                                        </select>
                                        {formData.subscriptionPlanId ? (
                                            <p className="mt-1 text-xs text-muted-foreground">
                                                Selected plan: {plans.find((plan) => plan.id === formData.subscriptionPlanId)?.name || companyRecord?.subscriptionPlan?.name || 'Assigned plan'}
                                            </p>
                                        ) : null}
                                    </div>
                                    <div>
                                        <Label htmlFor="subscriptionStatus">Subscription Status</Label>
                                        <select
                                            id="subscriptionStatus"
                                            name="subscriptionStatus"
                                            value={formData.subscriptionStatus || 'active'}
                                            onChange={handleInputChange}
                                            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                                        >
                                            <option value="trial">Trial</option>
                                            <option value="active">Active</option>
                                            <option value="expired">Expired</option>
                                            <option value="cancelled">Cancelled</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}

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
                </form>
            </DialogContent>
        </Dialog>
    );
}
