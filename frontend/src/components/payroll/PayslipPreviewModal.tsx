'use client';

import { X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import type { PayslipRecord } from '../../lib/api/payroll';
import { Button } from '../ui/button';
import { PayslipDetailsCard } from './PayslipDetailsCard';

interface PayslipPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payslip: PayslipRecord | null;
  loading?: boolean;
}

export function PayslipPreviewModal({ open, onOpenChange, payslip, loading = false }: PayslipPreviewModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-5xl overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between gap-3">
            <DialogTitle>Payslip Details</DialogTitle>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => onOpenChange(false)}
              aria-label="Close payslip details"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        {loading ? <div className="py-8 text-sm text-gray-600">Loading payslip details...</div> : null}
        {!loading && payslip ? <PayslipDetailsCard payslip={payslip} /> : null}
      </DialogContent>
    </Dialog>
  );
}
