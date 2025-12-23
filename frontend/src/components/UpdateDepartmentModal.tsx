'use client';

import { useState, useEffect } from 'react';
import { departmentApi, type Department, type UpdateDepartmentRequest } from '../lib/api/department';
import toast from 'react-hot-toast';

export interface UpdateDepartmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    departmentId: string | null;
    onSuccess: () => void;
}

export function UpdateDepartmentModal({
    isOpen,
    onClose,
    departmentId,
    onSuccess,
}: UpdateDepartmentModalProps) {
    const [formData, setFormData] = useState<UpdateDepartmentRequest>({
        name: '',
        code: '',
        description: '',
        isActive: true,
    });
    const [loading, setLoading] = useState(false);
    const [fetchingDepartment, setFetchingDepartment] = useState(false);

    // Fetch department data when modal opens
    useEffect(() => {
        if (isOpen && departmentId) {
            fetchDepartmentData();
        } else {
            resetForm();
        }
    }, [isOpen, departmentId]);

    const fetchDepartmentData = async () => {
        if (!departmentId) return;

        setFetchingDepartment(true);
        try {
            const response = await departmentApi.getDepartmentById(departmentId);
            const department = response.data;

            setFormData({
                name: department.name || '',
                code: department.code || '',
                description: department.description || '',
                isActive: department.isActive,
            });
        } catch (error) {
            toast.error('Failed to load department data');
            onClose();
        } finally {
            setFetchingDepartment(false);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            code: '',
            description: '',
            isActive: true,
        });
    };

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value, type } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!departmentId) return;

        setLoading(true);
        try {
            const updateData: UpdateDepartmentRequest = {};

            // Only include fields that have values
            if (formData.name?.trim()) updateData.name = formData.name.trim();
            if (formData.code?.trim()) updateData.code = formData.code.trim().toUpperCase();
            if (formData.description?.trim()) updateData.description = formData.description.trim();
            if (formData.isActive !== undefined) updateData.isActive = formData.isActive;

            await departmentApi.updateDepartment(departmentId, updateData);

            toast.success('Department updated successfully');
            onSuccess();
            onClose();
        } catch (error: any) {
            toast.error(error.message || 'Failed to update department');
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
                <div className="relative bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                    {/* Header */}
                    <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-bold text-gray-900">Update Department</h3>
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
                        {fetchingDepartment ? (
                            <div className="flex justify-center items-center py-12">
                                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600"></div>
                            </div>
                        ) : (
                            <div className="space-y-5">
                                {/* Department Name */}
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                                        Department Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="name"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        required
                                        maxLength={100}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Enter department name"
                                    />
                                </div>

                                {/* Department Code */}
                                <div>
                                    <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
                                        Department Code
                                    </label>
                                    <input
                                        type="text"
                                        id="code"
                                        name="code"
                                        value={formData.code}
                                        onChange={handleInputChange}
                                        maxLength={20}
                                        pattern="[A-Z0-9]{2,20}"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase font-mono"
                                        placeholder="HR"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">2-20 uppercase alphanumeric characters (optional)</p>
                                </div>

                                {/* Description */}
                                <div>
                                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                                        Description
                                    </label>
                                    <textarea
                                        id="description"
                                        name="description"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        rows={3}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                        placeholder="Enter department description"
                                    />
                                </div>

                                {/* Is Active */}
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="isActive"
                                        name="isActive"
                                        checked={formData.isActive}
                                        onChange={handleInputChange}
                                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                    />
                                    <label htmlFor="isActive" className="ml-2 text-sm font-medium text-gray-700">
                                        Active Department
                                    </label>
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
                                disabled={loading || fetchingDepartment}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                        Updating...
                                    </>
                                ) : (
                                    'Update Department'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
