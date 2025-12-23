'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { designationApi, type Designation } from '../lib/api/designation';

interface UpdateDesignationModalProps {
    isOpen: boolean;
    onClose: () => void;
    designationId: string | null;
    onSuccess?: () => void;
}

export function UpdateDesignationModal({
    isOpen,
    onClose,
    designationId,
    onSuccess,
}: UpdateDesignationModalProps) {
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        description: '',
        isActive: true,
    });
    const [loading, setLoading] = useState(false);
    const [fetchingData, setFetchingData] = useState(false);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    // Fetch designation data when modal opens
    useEffect(() => {
        const fetchDesignationData = async () => {
            if (!designationId || !isOpen) return;

            setFetchingData(true);
            try {
                const response = await designationApi.getDesignationById(designationId);
                const designation = response.data;

                setFormData({
                    name: designation.name,
                    code: designation.code || '',
                    description: designation.description || '',
                    isActive: designation.isActive,
                });
                setErrors({});
            } catch (error) {
                console.error('Error fetching designation:', error);
                toast.error('Failed to load designation data');
                onClose();
            } finally {
                setFetchingData(false);
            }
        };

        fetchDesignationData();
    }, [designationId, isOpen, onClose]);

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;

        // Uppercase transformation for code field
        const processedValue = name === 'code' ? value.toUpperCase() : value;

        setFormData((prev) => ({
            ...prev,
            [name]: processedValue,
        }));

        // Clear error for this field
        if (errors[name]) {
            setErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: checked,
        }));
    };

    const validateForm = () => {
        const newErrors: { [key: string]: string } = {};

        // Name validation
        if (!formData.name.trim()) {
            newErrors.name = 'Designation name is required';
        } else if (formData.name.length > 100) {
            newErrors.name = 'Designation name must not exceed 100 characters';
        }

        // Code validation (optional, but if provided must meet requirements)
        if (formData.code && formData.code.trim()) {
            const codePattern = /^[A-Z0-9]{2,20}$/;
            if (!codePattern.test(formData.code.trim())) {
                newErrors.code = 'Code must be 2-20 uppercase alphanumeric characters';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm() || !designationId) {
            return;
        }

        setLoading(true);
        try {
            // Prepare update data
            const updateData: {
                name: string;
                code?: string;
                description?: string;
                isActive: boolean;
            } = {
                name: formData.name.trim(),
                isActive: formData.isActive,
            };

            // Add optional fields if provided
            if (formData.code && formData.code.trim()) {
                updateData.code = formData.code.trim();
            }

            if (formData.description && formData.description.trim()) {
                updateData.description = formData.description.trim();
            }

            await designationApi.updateDesignation(designationId, updateData);

            toast.success('Designation updated successfully');
            onSuccess?.();
            onClose();
        } catch (error: unknown) {
            console.error('Error updating designation:', error);
            const errorMessage =
                error instanceof Error ? error.message : 'Failed to update designation';
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (!loading) {
            setFormData({
                name: '',
                code: '',
                description: '',
                isActive: true,
            });
            setErrors({});
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Update Designation</h3>
                    <button
                        onClick={handleClose}
                        disabled={loading || fetchingData}
                        className="text-gray-400 hover:text-gray-500 disabled:opacity-50"
                    >
                        <svg
                            className="w-6 h-6"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>

                {fetchingData ? (
                    <div className="py-8 text-center text-gray-500">Loading designation data...</div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Designation Name */}
                        <div>
                            <label
                                htmlFor="name"
                                className="block text-sm font-medium text-gray-700 mb-1"
                            >
                                Designation Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                disabled={loading}
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100 disabled:cursor-not-allowed ${errors.name ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                placeholder="e.g., Software Engineer"
                                maxLength={100}
                            />
                            {errors.name && (
                                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                            )}
                        </div>

                        {/* Designation Code */}
                        <div>
                            <label
                                htmlFor="code"
                                className="block text-sm font-medium text-gray-700 mb-1"
                            >
                                Designation Code
                            </label>
                            <input
                                type="text"
                                id="code"
                                name="code"
                                value={formData.code}
                                onChange={handleInputChange}
                                disabled={loading}
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100 disabled:cursor-not-allowed font-mono ${errors.code ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                placeholder="e.g., SE01, MGR02"
                                maxLength={20}
                            />
                            <p className="mt-1 text-xs text-gray-500">
                                Optional. 2-20 uppercase alphanumeric characters (e.g., SE01, MGR02)
                            </p>
                            {errors.code && (
                                <p className="mt-1 text-sm text-red-600">{errors.code}</p>
                            )}
                        </div>

                        {/* Description */}
                        <div>
                            <label
                                htmlFor="description"
                                className="block text-sm font-medium text-gray-700 mb-1"
                            >
                                Description
                            </label>
                            <textarea
                                id="description"
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                disabled={loading}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                placeholder="Optional description of the designation..."
                            />
                        </div>

                        {/* Active Status */}
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="isActive"
                                name="isActive"
                                checked={formData.isActive}
                                onChange={handleCheckboxChange}
                                disabled={loading}
                                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                            <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                                Active
                            </label>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-end space-x-3 pt-4">
                            <button
                                type="button"
                                onClick={handleClose}
                                disabled={loading}
                                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {loading ? 'Updating...' : 'Update Designation'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
