'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { leaveApi, type LeaveType } from '../lib/api/leave';
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

export interface UpdateLeaveTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  leaveTypeId: string | null;
  onSuccess: () => void;
}

export function UpdateLeaveTypeModal({
  isOpen,
  onClose,
  leaveTypeId,
  onSuccess,
}: UpdateLeaveTypeModalProps) {
  const [formData, setFormData] = useState<Partial<LeaveType>>({
    name: '',
    code: '',
    description: '',
    isActive: true,
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    if (isOpen && leaveTypeId) {
      fetchLeaveType();
    } else {
      resetForm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, leaveTypeId]);

  const fetchLeaveType = async () => {
    if (!leaveTypeId) return;
    setFetching(true);
    try {
      const response = await leaveApi.getLeaveTypeById(leaveTypeId);
      const leaveType = response.data;
      setFormData({
        name: leaveType.name || '',
        code: leaveType.code || '',
        description: leaveType.description || '',
        isActive: leaveType.isActive,
      });
    } catch (error) {
      toast.error('Failed to load leave type data');
      onClose();
    } finally {
      setFetching(false);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', code: '', description: '', isActive: true });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const nextValue = name === 'code' ? value.toUpperCase() : value;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : nextValue,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveTypeId) return;

    setLoading(true);
    try {
      const payload: { name?: string; code?: string; description?: string; isActive?: boolean } = {};
      if (formData.name?.trim()) payload.name = formData.name.trim();
      if (formData.code?.trim()) payload.code = formData.code.trim().toUpperCase();
      if (formData.description?.trim()) payload.description = formData.description.trim();
      if (formData.isActive !== undefined) payload.isActive = formData.isActive;

      await leaveApi.updateLeaveType(leaveTypeId, payload);
      toast.success('Leave type updated successfully');
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to update leave type');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Update Leave Type</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          {fetching ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600"></div>
            </div>
          ) : (
            <div className="space-y-5">
              <div>
                <Label htmlFor="name">
                  Leave Type Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name || ''}
                  onChange={handleInputChange}
                  required
                  maxLength={100}
                  placeholder="Enter leave type name"
                />
              </div>

              <div>
                <Label htmlFor="code">Leave Type Code</Label>
                <Input
                  type="text"
                  id="code"
                  name="code"
                  value={formData.code || ''}
                  onChange={handleInputChange}
                  maxLength={20}
                  pattern="[A-Z0-9]{2,20}"
                  placeholder="AL"
                />
                <p className="text-xs text-gray-500 mt-1">
                  2-20 uppercase alphanumeric characters (optional)
                </p>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description || ''}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Enter leave type description"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  name="isActive"
                  checked={!!formData.isActive}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                />
                <Label htmlFor="isActive" className="ml-2">
                  Active Leave Type
                </Label>
              </div>
            </div>
          )}

          <div className="pt-6">
            <DialogFooter>
              <Button type="button" variant="cancel" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" variant="blue" disabled={loading || fetching}>
                {loading ? 'Updating...' : 'Update Leave Type'}
              </Button>
            </DialogFooter>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
