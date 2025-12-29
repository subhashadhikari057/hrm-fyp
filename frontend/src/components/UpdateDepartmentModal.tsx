'use client';

import { useState, useEffect } from 'react';
import { departmentApi, type Department, type UpdateDepartmentRequest } from '../lib/api/department';
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

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Update Department</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                        {fetchingDepartment ? (
                            <div className="flex justify-center items-center py-12">
                                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600"></div>
                            </div>
                        ) : (
                            <div className="space-y-5">
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
                                        required
                                        maxLength={100}
                                        placeholder="Enter department name"
                                    />
                                </div>

                                {/* Department Code */}
                                <div>
                                    <Label htmlFor="code">Department Code</Label>
                                    <Input
                                        type="text"
                                        id="code"
                                        name="code"
                                        value={formData.code}
                                        onChange={handleInputChange}
                                        maxLength={20}
                                        pattern="[A-Z0-9]{2,20}"
                                        placeholder="HR"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">2-20 uppercase alphanumeric characters (optional)</p>
                                </div>

                                {/* Description */}
                                <div>
                                    <Label htmlFor="description">Description</Label>
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
                                    <Label htmlFor="isActive" className="ml-2">
                                        Active Department
                                    </Label>
                                </div>
                            </div>
                        )}

                        {/* Footer */}
                        <div className="pt-6">
                            <DialogFooter>
                                <Button type="button" variant="cancel" onClick={onClose} disabled={loading}>
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    variant="blue"
                                    disabled={loading || fetchingDepartment}
                                >
                                    {loading ? 'Updating...' : 'Update Department'}
                                </Button>
                            </DialogFooter>
                        </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
