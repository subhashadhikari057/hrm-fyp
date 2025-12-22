'use client';

import { useState } from 'react';
import { useToast } from '../contexts/ToastContext';
import { workShiftApi } from '../lib/api/workshift';

interface AddWorkShiftModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;

function normalizeTime(value: string) {
    if (!value) return value;
    if (/^\d{2}:\d{2}$/.test(value)) {
        return `${value}:00`;
    }
    return value;
}

export function AddWorkShiftModal({
    isOpen,
    onClose,
    onSuccess,
}: AddWorkShiftModalProps) {
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        description: '',
        startTime: '',
        endTime: '',
        isActive: true,
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const { showToast } = useToast();

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

        if (!formData.name.trim()) {
            newErrors.name = 'Work shift name is required';
        } else if (formData.name.length > 100) {
            newErrors.name = 'Work shift name must not exceed 100 characters';
        }

        if (formData.code && formData.code.trim()) {
            const codePattern = /^[A-Z0-9]{2,20}$/;
            if (!codePattern.test(formData.code.trim())) {
                newErrors.code = 'Code must be 2-20 uppercase alphanumeric characters';
            }
        }

        if (!formData.startTime) {
            newErrors.startTime = 'Start time is required';
        } else if (!TIME_REGEX.test(formData.startTime)) {
            newErrors.startTime = 'Start time must be in HH:mm or HH:mm:ss format';
        }

        if (!formData.endTime) {
            newErrors.endTime = 'End time is required';
        } else if (!TIME_REGEX.test(formData.endTime)) {
            newErrors.endTime = 'End time must be in HH:mm or HH:mm:ss format';
        }

        if (
            formData.startTime &&
            formData.endTime &&
            TIME_REGEX.test(formData.startTime) &&
            TIME_REGEX.test(formData.endTime) &&
            normalizeTime(formData.startTime) === normalizeTime(formData.endTime)
        ) {
            newErrors.endTime = 'End time must be different from start time';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setLoading(true);
        try {
            const createData: {
                name: string;
                code?: string;
                description?: string;
                startTime: string;
                endTime: string;
                isActive?: boolean;
            } = {
                name: formData.name.trim(),
                startTime: normalizeTime(formData.startTime),
                endTime: normalizeTime(formData.endTime),
            };

            if (formData.code && formData.code.trim()) {
                createData.code = formData.code.trim();
            }

            if (formData.description && formData.description.trim()) {
                createData.description = formData.description.trim();
            }

            createData.isActive = formData.isActive;

            await workShiftApi.createWorkShift(createData);

            showToast('Work shift created successfully', 'success');
            onSuccess?.();
            handleClose();
        } catch (error: unknown) {
            console.error('Error creating work shift:', error);
            const errorMessage =
                error instanceof Error ? error.message : 'Failed to create work shift';
            showToast(errorMessage, 'error');
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
                startTime: '',
                endTime: '',
                isActive: true,
            });
            setErrors({});
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="w-full max-w-2xl bg-white rounded-lg shadow-xl p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Add Work Shift</h3>
                    <button
                        onClick={handleClose}
                        disabled={loading}
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

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label
                            htmlFor="name"
                            className="block text-sm font-medium text-gray-700 mb-1"
                        >
                            Work Shift Name <span className="text-red-500">*</span>
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
                            placeholder="e.g., Morning Shift"
                            maxLength={100}
                        />
                        {errors.name && (
                            <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                        )}
                    </div>

                    <div>
                        <label
                            htmlFor="code"
                            className="block text-sm font-medium text-gray-700 mb-1"
                        >
                            Work Shift Code
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
                            placeholder="e.g., MS01, ES02"
                            maxLength={20}
                        />
                        <p className="mt-1 text-xs text-gray-500">
                            Optional. 2-20 uppercase alphanumeric characters
                        </p>
                        {errors.code && (
                            <p className="mt-1 text-sm text-red-600">{errors.code}</p>
                        )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label
                                htmlFor="startTime"
                                className="block text-sm font-medium text-gray-700 mb-1"
                            >
                                Start Time <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="time"
                                step="1"
                                id="startTime"
                                name="startTime"
                                value={formData.startTime}
                                onChange={handleInputChange}
                                disabled={loading}
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100 disabled:cursor-not-allowed ${errors.startTime ? 'border-red-500' : 'border-gray-300'
                                    }`}
                            />
                            {errors.startTime && (
                                <p className="mt-1 text-sm text-red-600">{errors.startTime}</p>
                            )}
                        </div>

                        <div>
                            <label
                                htmlFor="endTime"
                                className="block text-sm font-medium text-gray-700 mb-1"
                            >
                                End Time <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="time"
                                step="1"
                                id="endTime"
                                name="endTime"
                                value={formData.endTime}
                                onChange={handleInputChange}
                                disabled={loading}
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100 disabled:cursor-not-allowed ${errors.endTime ? 'border-red-500' : 'border-gray-300'
                                    }`}
                            />
                            {errors.endTime && (
                                <p className="mt-1 text-sm text-red-600">{errors.endTime}</p>
                            )}
                        </div>
                    </div>

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
                            placeholder="Optional description of the work shift..."
                        />
                    </div>

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
                            {loading ? 'Creating...' : 'Create Work Shift'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
