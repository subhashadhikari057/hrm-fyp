'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { departmentApi } from '../lib/api/department';
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

interface AddDepartmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export function AddDepartmentModal({
    isOpen,
    onClose,
    onSuccess,
}: AddDepartmentModalProps) {
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        description: '',
        isActive: true,
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

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
            newErrors.name = 'Department name is required';
        } else if (formData.name.length > 100) {
            newErrors.name = 'Department name must not exceed 100 characters';
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

        if (!validateForm()) {
            return;
        }

        setLoading(true);
        try {
            // Prepare create data
            const createData: {
                name: string;
                code?: string;
                description?: string;
                isActive?: boolean;
            } = {
                name: formData.name.trim(),
            };

            // Add optional fields if provided
            if (formData.code && formData.code.trim()) {
                createData.code = formData.code.trim();
            }

            if (formData.description && formData.description.trim()) {
                createData.description = formData.description.trim();
            }

            createData.isActive = formData.isActive;

            await departmentApi.createDepartment(createData);

            toast.success('Department created successfully');
            onSuccess?.();
            handleClose();
        } catch (error: unknown) {
            console.error('Error creating department:', error);
            const errorMessage =
                error instanceof Error ? error.message : 'Failed to create department';
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

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Add Department</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Department Name */}
                    <div>
                        <Label htmlFor="name">
                            Department Name <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            disabled={loading}
                            placeholder="e.g., Human Resources"
                            maxLength={100}
                        />
                        {errors.name && (
                            <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                        )}
                    </div>

                    {/* Department Code */}
                    <div>
                        <Label htmlFor="code">
                            Department Code
                        </Label>
                        <Input
                            type="text"
                            id="code"
                            name="code"
                            value={formData.code}
                            onChange={handleInputChange}
                            disabled={loading}
                            placeholder="e.g., HR, IT, FIN"
                            maxLength={20}
                        />
                        <p className="mt-1 text-xs text-gray-500">
                            Optional. 2-20 uppercase alphanumeric characters (e.g., HR, IT, FIN)
                        </p>
                        {errors.code && (
                            <p className="mt-1 text-sm text-red-600">{errors.code}</p>
                        )}
                    </div>

                    {/* Description */}
                    <div>
                        <Label htmlFor="description">
                            Description
                        </Label>
                        <textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            disabled={loading}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                            placeholder="Optional description of the department..."
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
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        <Label htmlFor="isActive" className="ml-2">
                            Active
                        </Label>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-6">
                        <DialogFooter>
                            <Button type="button" variant="cancel" onClick={handleClose} disabled={loading}>
                                Cancel
                            </Button>
                            <Button type="submit" variant="blue" disabled={loading}>
                                {loading ? 'Creating...' : 'Create Department'}
                            </Button>
                        </DialogFooter>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
