'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { subscriptionApi } from '../../lib/api/subscription';

const AVAILABLE_FEATURES = [
  { value: 'attendance', label: 'Attendance' },
  { value: 'leave', label: 'Leave' },
  { value: 'projects', label: 'Projects' },
  { value: 'policy', label: 'Policy' },
  { value: 'complaints', label: 'Complaints' },
  { value: 'payroll', label: 'Payroll' },
];

interface CreateSubscriptionPlanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => Promise<void> | void;
}

export function CreateSubscriptionPlanModal({
  open,
  onOpenChange,
  onSuccess,
}: CreateSubscriptionPlanModalProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    code: '',
    description: '',
    monthlyPrice: '',
    yearlyPrice: '',
    maxEmployees: '',
    features: [] as string[],
  });

  useEffect(() => {
    if (!open) return;
    setForm({
      name: '',
      code: '',
      description: '',
      monthlyPrice: '',
      yearlyPrice: '',
      maxEmployees: '',
      features: [],
    });
  }, [open]);

  const toggleFeature = (feature: string) => {
    setForm((prev) => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter((item) => item !== feature)
        : [...prev.features, feature],
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);

    try {
      await subscriptionApi.createPlan({
        name: form.name,
        code: form.code,
        description: form.description || undefined,
        monthlyPrice: form.monthlyPrice ? Number(form.monthlyPrice) : 0,
        yearlyPrice: form.yearlyPrice ? Number(form.yearlyPrice) : undefined,
        maxEmployees: form.maxEmployees ? Number(form.maxEmployees) : undefined,
        features: form.features,
        isActive: true,
      });
      toast.success('Subscription plan created successfully');
      await onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create plan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !loading && onOpenChange(nextOpen)}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between gap-3">
            <DialogTitle>Create Subscription Plan</DialogTitle>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              aria-label="Close subscription plan modal"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Plan Name</Label>
              <Input id="name" value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">Plan Code</Label>
              <Input id="code" value={form.code} onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))} required />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input id="description" value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="monthlyPrice">Monthly Price</Label>
              <Input id="monthlyPrice" type="number" value={form.monthlyPrice} onChange={(e) => setForm((prev) => ({ ...prev, monthlyPrice: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="yearlyPrice">Yearly Price</Label>
              <Input id="yearlyPrice" type="number" value={form.yearlyPrice} onChange={(e) => setForm((prev) => ({ ...prev, yearlyPrice: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxEmployees">Employee Limit</Label>
              <Input id="maxEmployees" type="number" value={form.maxEmployees} onChange={(e) => setForm((prev) => ({ ...prev, maxEmployees: e.target.value }))} />
            </div>
          </div>

          <div className="space-y-3">
            <Label>Enabled Features</Label>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {AVAILABLE_FEATURES.map((feature) => {
                const checked = form.features.includes(feature.value);
                return (
                  <label
                    key={feature.value}
                    className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm transition-colors ${
                      checked
                        ? 'border-blue-200 bg-blue-50 text-blue-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleFeature(feature.value)}
                      className="h-4 w-4"
                    />
                    <span>{feature.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="cancel" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" variant="blue" disabled={loading}>
              {loading ? 'Creating...' : 'Create Plan'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
