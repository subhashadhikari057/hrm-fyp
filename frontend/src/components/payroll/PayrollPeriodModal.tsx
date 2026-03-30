'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import type { CreatePayrollPeriodPayload } from '../../lib/api/payroll';

interface PayrollPeriodModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loading?: boolean;
  onSubmit: (payload: CreatePayrollPeriodPayload) => Promise<void> | void;
}

function todayValue() {
  return new Date().toISOString().slice(0, 10);
}

export function PayrollPeriodModal({
  open,
  onOpenChange,
  loading = false,
  onSubmit,
}: PayrollPeriodModalProps) {
  const [form, setForm] = useState<CreatePayrollPeriodPayload>({
    fiscalYearLabel: '2081/82',
    periodYear: new Date().getFullYear(),
    periodMonth: new Date().getMonth() + 1,
    periodLabel: '',
    startDate: todayValue(),
    endDate: todayValue(),
  });

  const handleChange = (key: keyof CreatePayrollPeriodPayload, value: string | number) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await onSubmit({
      ...form,
      periodYear: Number(form.periodYear),
      periodMonth: Number(form.periodMonth),
      periodLabel: form.periodLabel?.trim() || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !loading && onOpenChange(nextOpen)}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Payroll Period</DialogTitle>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="fiscalYearLabel">Fiscal Year Label</Label>
              <Input
                id="fiscalYearLabel"
                value={form.fiscalYearLabel}
                onChange={(e) => handleChange('fiscalYearLabel', e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="periodLabel">Period Label</Label>
              <Input
                id="periodLabel"
                value={form.periodLabel || ''}
                onChange={(e) => handleChange('periodLabel', e.target.value)}
                placeholder="Optional custom label"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="periodYear">Period Year</Label>
              <Input
                id="periodYear"
                type="number"
                value={form.periodYear}
                onChange={(e) => handleChange('periodYear', Number(e.target.value))}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="periodMonth">Period Month</Label>
              <Input
                id="periodMonth"
                type="number"
                min={1}
                max={12}
                value={form.periodMonth}
                onChange={(e) => handleChange('periodMonth', Number(e.target.value))}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={form.startDate}
                onChange={(e) => handleChange('startDate', e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={form.endDate}
                onChange={(e) => handleChange('endDate', e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="cancel" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" variant="blue" disabled={loading}>
              {loading ? 'Creating...' : 'Create Period'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
