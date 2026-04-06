'use client';

import { Button } from './ui/button';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import type { RegularizationRequestType } from '../lib/api/regularizations';

type RequestTypeOption = {
  value: RegularizationRequestType;
  label: string;
};

type EmployeeRegularizationRequestModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  creating: boolean;
  requestTypes: RequestTypeOption[];
  formDate: string;
  onFormDateChange: (value: string) => void;
  minDate: string;
  formType: RegularizationRequestType;
  onFormTypeChange: (value: RegularizationRequestType) => void;
  formCheckIn: string;
  onFormCheckInChange: (value: string) => void;
  formCheckOut: string;
  onFormCheckOutChange: (value: string) => void;
  formReason: string;
  onFormReasonChange: (value: string) => void;
  onSubmit: () => void;
};

export default function EmployeeRegularizationRequestModal({
  open,
  onOpenChange,
  creating,
  requestTypes,
  formDate,
  onFormDateChange,
  minDate,
  formType,
  onFormTypeChange,
  formCheckIn,
  onFormCheckInChange,
  formCheckOut,
  onFormCheckOutChange,
  formReason,
  onFormReasonChange,
  onSubmit,
}: EmployeeRegularizationRequestModalProps) {
  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !creating && onOpenChange(nextOpen)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Attendance Request</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Date</label>
              <Input type="date" min={minDate} value={formDate} onChange={(e) => onFormDateChange(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Request Type</label>
              <select
                className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                value={formType}
                onChange={(e) => onFormTypeChange(e.target.value as RegularizationRequestType)}
              >
                {requestTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Proposed Check-in</label>
              <Input type="time" value={formCheckIn} onChange={(e) => onFormCheckInChange(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Proposed Check-out</label>
              <Input type="time" value={formCheckOut} onChange={(e) => onFormCheckOutChange(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Reason</label>
            <textarea
              value={formReason}
              onChange={(e) => onFormReasonChange(e.target.value)}
              rows={3}
              placeholder="Provide a brief reason"
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="cancel" onClick={() => onOpenChange(false)} disabled={creating}>
            Cancel
          </Button>
          <Button variant="blue" onClick={onSubmit} disabled={creating}>
            {creating ? 'Submitting...' : 'Submit Request'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
