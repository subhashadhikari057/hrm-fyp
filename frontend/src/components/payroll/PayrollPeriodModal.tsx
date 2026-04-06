'use client';

import { useMemo, useState } from 'react';
import { CalendarDays, RefreshCw } from 'lucide-react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import type { CreatePayrollPeriodPayload } from '../../lib/api/payroll';
import { convertBsToAd, getFiscalYearLabelFromBs, NEPALI_MONTHS } from '../../lib/nepali-date';

interface PayrollPeriodModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loading?: boolean;
  onSubmit: (payload: CreatePayrollPeriodPayload) => Promise<void> | void;
}

export function PayrollPeriodModal({
  open,
  onOpenChange,
  loading = false,
  onSubmit,
}: PayrollPeriodModalProps) {
  const [form, setForm] = useState({
    bsPeriodYear: '',
    bsPeriodMonth: '',
    bsStartDate: '',
    bsEndDate: '',
    periodLabel: '',
  });

  const handleChange = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const normalizeBsDate = (value: string) => value.trim().replace(/\//g, '-');

  const derivedPayload = useMemo(() => {
    if (!form.bsPeriodYear || !form.bsPeriodMonth || !form.bsStartDate || !form.bsEndDate) {
      return null;
    }

    try {
      const normalizedStart = normalizeBsDate(form.bsStartDate);
      const normalizedEnd = normalizeBsDate(form.bsEndDate);
      const startDate = convertBsToAd(normalizedStart);
      const endDate = convertBsToAd(normalizedEnd);

      return {
        fiscalYearLabel: getFiscalYearLabelFromBs(Number(form.bsPeriodYear), Number(form.bsPeriodMonth)),
        bsPeriodYear: Number(form.bsPeriodYear),
        bsPeriodMonth: Number(form.bsPeriodMonth),
        bsPeriodMonthLabel: NEPALI_MONTHS[Number(form.bsPeriodMonth) - 1],
        bsStartDate: normalizedStart,
        bsEndDate: normalizedEnd,
        periodYear: startDate.getUTCFullYear(),
        periodMonth: startDate.getUTCMonth() + 1,
        periodLabel:
          form.periodLabel?.trim() ||
          `${NEPALI_MONTHS[Number(form.bsPeriodMonth) - 1]} ${form.bsPeriodYear} Payroll`,
        startDate: startDate.toISOString().slice(0, 10),
        endDate: endDate.toISOString().slice(0, 10),
      } satisfies CreatePayrollPeriodPayload;
    } catch {
      return null;
    }
  }, [form]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!derivedPayload) return;
    await onSubmit(derivedPayload);
  };

  const conversionReady = !!derivedPayload;

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !loading && onOpenChange(nextOpen)}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Payroll Period</DialogTitle>
        </DialogHeader>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
                <CalendarDays className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Nepali Payroll Period</p>
                <p className="mt-1 text-xs text-gray-600">
                  Enter the payroll month in BS format. Use dates like `2082/12/01`.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="bsPeriodYear">Nepali Year (BS)</Label>
              <Input
                id="bsPeriodYear"
                type="number"
                value={form.bsPeriodYear}
                onChange={(e) => handleChange('bsPeriodYear', e.target.value)}
                placeholder="2082"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bsPeriodMonth">Nepali Month</Label>
              <select
                id="bsPeriodMonth"
                className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                value={form.bsPeriodMonth}
                onChange={(e) => handleChange('bsPeriodMonth', e.target.value)}
                disabled={loading}
              >
                <option value="" disabled>
                  Select Nepali month
                </option>
                {NEPALI_MONTHS.map((month, index) => (
                  <option key={month} value={index + 1}>
                    {month}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="bsStartDate">Start Date (BS)</Label>
              <Input
                id="bsStartDate"
                value={form.bsStartDate}
                onChange={(e) => handleChange('bsStartDate', e.target.value)}
                placeholder="----/--/--"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bsEndDate">End Date (BS)</Label>
              <Input
                id="bsEndDate"
                value={form.bsEndDate}
                onChange={(e) => handleChange('bsEndDate', e.target.value)}
                placeholder="----/--/--"
                disabled={loading}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
              <Label htmlFor="fiscalYearLabel">Fiscal Year</Label>
              <Input id="fiscalYearLabel" value={derivedPayload?.fiscalYearLabel || ''} placeholder="Calculated automatically" disabled />
            </div>
          </div>

          <div className={`rounded-xl border p-4 ${conversionReady ? 'border-emerald-200 bg-emerald-50' : 'border-dashed border-gray-300 bg-gray-50'}`}>
            <div className="flex items-start gap-3">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${conversionReady ? 'bg-white text-emerald-600' : 'bg-white text-gray-400'}`}>
                <RefreshCw className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900">Gregorian Conversion</p>
                <p className="mt-1 text-xs text-gray-600">
                  {conversionReady
                    ? `Converted to AD: ${derivedPayload?.startDate} to ${derivedPayload?.endDate}`
                    : 'Fill valid BS dates and select the Nepali month to convert automatically.'}
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="cancel" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" variant="blue" disabled={loading || !derivedPayload}>
              {loading ? 'Creating...' : 'Create Period'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
