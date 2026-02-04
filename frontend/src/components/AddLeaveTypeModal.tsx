'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { leaveApi } from '../lib/api/leave';
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

interface AddLeaveTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AddLeaveTypeModal({ isOpen, onClose, onSuccess }: AddLeaveTypeModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    isActive: true,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const processedValue = name === 'code' ? value.toUpperCase() : value;

    setFormData((prev) => ({
      ...prev,
      [name]: processedValue,
    }));

    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
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
    const nextErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      nextErrors.name = 'Leave type name is required';
    } else if (formData.name.length > 100) {
      nextErrors.name = 'Leave type name must not exceed 100 characters';
    }

    if (formData.code && formData.code.trim()) {
      const codePattern = /^[A-Z0-9]{2,20}$/;
      if (!codePattern.test(formData.code.trim())) {
        nextErrors.code = 'Code must be 2-20 uppercase alphanumeric characters';
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      const payload: {
        name: string;
        code?: string;
        description?: string;
        isActive?: boolean;
      } = {
        name: formData.name.trim(),
        isActive: formData.isActive,
      };

      if (formData.code.trim()) payload.code = formData.code.trim();
      if (formData.description.trim()) payload.description = formData.description.trim();

      await leaveApi.createLeaveType(payload);
      toast.success('Leave type created successfully');
      onSuccess?.();
      handleClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create leave type';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    setFormData({ name: '', code: '', description: '', isActive: true });
    setErrors({});
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Leave Type</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">
              Leave Type Name <span className="text-red-500">*</span>
            </Label>
            <Input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              disabled={loading}
              placeholder="e.g., Annual Leave"
              maxLength={100}
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
          </div>

          <div>
            <Label htmlFor="code">Leave Type Code</Label>
            <Input
              type="text"
              id="code"
              name="code"
              value={formData.code}
              onChange={handleInputChange}
              disabled={loading}
              placeholder="e.g., AL, SL"
              maxLength={20}
            />
            <p className="mt-1 text-xs text-gray-500">
              Optional. 2-20 uppercase alphanumeric characters (e.g., AL, SL)
            </p>
            {errors.code && <p className="mt-1 text-sm text-red-600">{errors.code}</p>}
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              disabled={loading}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              placeholder="Optional description of the leave type..."
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
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
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
                {loading ? 'Creating...' : 'Create Leave Type'}
              </Button>
            </DialogFooter>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
