'use client';

import { useState, useEffect } from 'react';
import { companyApi, type Company, type UpdateCompanyRequest } from '../lib/api/company';
import toast from 'react-hot-toast';

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
            [name]: name === 'maxEmployees' ? (value ? parseInt(value) : undefined) : value,
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

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                    {/* Header */}
                    <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-bold text-gray-900">Update Company</h3>
                            <button
                                onClick={onClose}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
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
                    </div>

                    {/* Content */}
                    <form onSubmit={handleSubmit} className="p-6">
                        {fetchingCompany ? (
                            <div className="flex justify-center items-center py-12">
                                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600"></div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Logo Upload */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Company Logo
                                    </label>
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
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleLogoChange}
                                                className="block w-full text-sm text-gray-500
                          file:mr-4 file:py-2 file:px-4
                          file:rounded-lg file:border-0
                          file:text-sm file:font-semibold
                          file:bg-blue-50 file:text-blue-700
                          hover:file:bg-blue-100
                          cursor-pointer"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF up to 5MB</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Company Name */}
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                                        Company Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="name"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        required
                                        maxLength={150}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Enter company name"
                                    />
                                </div>

                                {/* Company Code */}
                                <div>
                                    <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
                                        Company Code <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="code"
                                        name="code"
                                        value={formData.code}
                                        onChange={handleInputChange}
                                        required
                                        maxLength={10}
                                        pattern="[A-Z0-9]{2,10}"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase font-mono"
                                        placeholder="ACME001"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">2-10 uppercase alphanumeric characters</p>
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
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="e.g., Technology, Healthcare"
                                    />
                                </div>

                                {/* Address */}
                                <div>
                                    <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                                        Address
                                    </label>
                                    <input
                                        type="text"
                                        id="address"
                                        name="address"
                                        value={formData.address}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Street address"
                                    />
                                </div>

                                {/* City & Country */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                                            City
                                        </label>
                                        <input
                                            type="text"
                                            id="city"
                                            name="city"
                                            value={formData.city}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="City"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
                                            Country
                                        </label>
                                        <input
                                            type="text"
                                            id="country"
                                            name="country"
                                            value={formData.country}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Country"
                                        />
                                    </div>
                                </div>

                                {/* Plan Expires At & Max Employees */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="planExpiresAt" className="block text-sm font-medium text-gray-700 mb-1">
                                            Plan Expires At
                                        </label>
                                        <input
                                            type="date"
                                            id="planExpiresAt"
                                            name="planExpiresAt"
                                            value={formData.planExpiresAt}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="maxEmployees" className="block text-sm font-medium text-gray-700 mb-1">
                                            Max Employees
                                        </label>
                                        <input
                                            type="number"
                                            id="maxEmployees"
                                            name="maxEmployees"
                                            value={formData.maxEmployees || ''}
                                            onChange={handleInputChange}
                                            min="1"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="100"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Footer */}
                        <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={loading}
                                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading || fetchingCompany}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                        Updating...
                                    </>
                                ) : (
                                    'Update Company'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
