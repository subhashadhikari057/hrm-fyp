'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { workShiftApi, type WorkShift } from '../lib/api/workshift';
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

interface UpdateWorkShiftModalProps {
    isOpen: boolean;
    onClose: () => void;
    workShiftId: string | null;
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

function formatTimeForInput(value?: string) {
    if (!value) return '';
    if (TIME_REGEX.test(value)) return value;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    const seconds = String(date.getUTCSeconds()).padStart(2, '0');
    return seconds === '00' ? `${hours}:${minutes}` : `${hours}:${minutes}:${seconds}`;
}

export function UpdateWorkShiftModal({
    isOpen,
    onClose,
    workShiftId,
    onSuccess,
}: UpdateWorkShiftModalProps) {
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        description: '',
        startTime: '',
        endTime: '',
        isActive: true,
    });
    const [loading, setLoading] = useState(false);
    const [fetchingData, setFetchingData] = useState(false);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    useEffect(() => {
        const fetchWorkShiftData = async () => {
            if (!workShiftId || !isOpen) return;

            setFetchingData(true);
            try {
                const response = await workShiftApi.getWorkShiftById(workShiftId);
                const workShift: WorkShift = response.data;

                setFormData({
                    name: workShift.name,
                    code: workShift.code || '',
                    description: workShift.description || '',
                    startTime: formatTimeForInput(workShift.startTime),
                    endTime: formatTimeForInput(workShift.endTime),
                    isActive: workShift.isActive,
                });
                setErrors({});
            } catch (error) {
                console.error('Error fetching work shift:', error);
                toast.error('Failed to load work shift data');
                onClose();
            } finally {
                setFetchingData(false);
            }
        };

        fetchWorkShiftData();
    }, [workShiftId, isOpen, onClose]);

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;

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

        if (formData.startTime && !TIME_REGEX.test(formData.startTime)) {
            newErrors.startTime = 'Start time must be in HH:mm or HH:mm:ss format';
        }

        if (formData.endTime && !TIME_REGEX.test(formData.endTime)) {
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

        if (!validateForm() || !workShiftId) {
            return;
        }

        setLoading(true);
        try {
            const updateData: {
                name: string;
                code?: string;
                description?: string;
                startTime?: string;
                endTime?: string;
                isActive: boolean;
            } = {
                name: formData.name.trim(),
                isActive: formData.isActive,
            };

            if (formData.code && formData.code.trim()) {
                updateData.code = formData.code.trim();
            }

            if (formData.description && formData.description.trim()) {
                updateData.description = formData.description.trim();
            }

            if (formData.startTime) {
                updateData.startTime = normalizeTime(formData.startTime);
            }

            if (formData.endTime) {
                updateData.endTime = normalizeTime(formData.endTime);
            }

            await workShiftApi.updateWorkShift(workShiftId, updateData);

            toast.success('Work shift updated successfully');
            onSuccess?.();
            onClose();
        } catch (error: unknown) {
            console.error('Error updating work shift:', error);
            const errorMessage =
                error instanceof Error ? error.message : 'Failed to update work shift';
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
                startTime: '',
                endTime: '',
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
                    <DialogTitle>Update Work Shift</DialogTitle>
                </DialogHeader>
                {fetchingData ? (
                    <div className="py-8 text-center text-gray-500">Loading work shift data...</div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <Label htmlFor="name">
                                Work Shift Name <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                type="text"
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                disabled={loading}
                                placeholder="e.g., Morning Shift"
                                maxLength={100}
                            />
                            {errors.name && (
                                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                            )}
                        </div>

                        <div>
                            <Label htmlFor="code">
                                Work Shift Code
                            </Label>
                            <Input
                                type="text"
                                id="code"
                                name="code"
                                value={formData.code}
                                onChange={handleInputChange}
                                disabled={loading}
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
                                <Label htmlFor="startTime">
                                    Start Time
                                </Label>
                                <Input
                                    type="time"
                                    step="1"
                                    id="startTime"
                                    name="startTime"
                                    value={formData.startTime}
                                    onChange={handleInputChange}
                                    disabled={loading}
                                />
                                {errors.startTime && (
                                    <p className="mt-1 text-sm text-red-600">{errors.startTime}</p>
                                )}
                            </div>

                            <div>
                                <Label htmlFor="endTime">
                                    End Time
                                </Label>
                                <Input
                                    type="time"
                                    step="1"
                                    id="endTime"
                                    name="endTime"
                                    value={formData.endTime}
                                    onChange={handleInputChange}
                                    disabled={loading}
                                />
                                {errors.endTime && (
                                    <p className="mt-1 text-sm text-red-600">{errors.endTime}</p>
                                )}
                            </div>
                        </div>

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
                            <Label htmlFor="isActive" className="ml-2">
                                Active
                            </Label>
                        </div>

                        <div className="pt-6">
                            <DialogFooter>
                                <Button type="button" variant="cancel" onClick={handleClose} disabled={loading}>
                                    Cancel
                                </Button>
                                <Button type="submit" variant="blue" disabled={loading}>
                                    {loading ? 'Updating...' : 'Update Work Shift'}
                                </Button>
                            </DialogFooter>
                        </div>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}
