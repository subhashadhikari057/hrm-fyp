'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import type { PayrollSettingsRecord, UpdatePayrollSettingsPayload } from '../../lib/api/payroll';

interface PayrollSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: PayrollSettingsRecord | null;
  loading?: boolean;
  onSubmit: (payload: UpdatePayrollSettingsPayload) => Promise<void> | void;
}

export function PayrollSettingsModal({ open, onOpenChange, settings, loading = false, onSubmit }: PayrollSettingsModalProps) {
  const [form, setForm] = useState<UpdatePayrollSettingsPayload>({
    enableTaxDeduction: true,
    enableEmployeeSsf: true,
    enableEmployerSsf: true,
    employeeSsfRate: 0.11,
    employerSsfRate: 0.2,
  });

  useEffect(() => {
    if (settings) {
      setForm({
        enableTaxDeduction: settings.enableTaxDeduction,
        enableEmployeeSsf: settings.enableEmployeeSsf,
        enableEmployerSsf: settings.enableEmployerSsf,
        employeeSsfRate: settings.employeeSsfRate,
        employerSsfRate: settings.employerSsfRate,
      });
    }
  }, [settings]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await onSubmit(form);
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !loading && onOpenChange(next)}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Payroll Settings</DialogTitle>
        </DialogHeader>
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex items-center gap-3 rounded-lg border border-gray-200 px-4 py-3 text-sm">
              <input type="checkbox" checked={!!form.enableTaxDeduction} onChange={(e) => setForm((p) => ({ ...p, enableTaxDeduction: e.target.checked }))} />
              Enable tax deduction
            </label>
            <label className="flex items-center gap-3 rounded-lg border border-gray-200 px-4 py-3 text-sm">
              <input type="checkbox" checked={!!form.enableEmployeeSsf} onChange={(e) => setForm((p) => ({ ...p, enableEmployeeSsf: e.target.checked }))} />
              Deduct employee SSF
            </label>
            <label className="flex items-center gap-3 rounded-lg border border-gray-200 px-4 py-3 text-sm md:col-span-2">
              <input type="checkbox" checked={!!form.enableEmployerSsf} onChange={(e) => setForm((p) => ({ ...p, enableEmployerSsf: e.target.checked }))} />
              Add employer/company SSF contribution
            </label>
            <div className="space-y-2">
              <Label htmlFor="employeeSsfRate">Employee SSF Rate</Label>
              <Input id="employeeSsfRate" type="number" step="0.01" value={form.employeeSsfRate ?? 0} onChange={(e) => setForm((p) => ({ ...p, employeeSsfRate: Number(e.target.value) }))} disabled={loading} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="employerSsfRate">Employer SSF Rate</Label>
              <Input id="employerSsfRate" type="number" step="0.01" value={form.employerSsfRate ?? 0} onChange={(e) => setForm((p) => ({ ...p, employerSsfRate: Number(e.target.value) }))} disabled={loading} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="cancel" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button>
            <Button type="submit" variant="blue" disabled={loading}>{loading ? 'Saving...' : 'Save Settings'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
