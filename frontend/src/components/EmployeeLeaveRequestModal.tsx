'use client';

import { Button } from './ui/button';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import type { HalfDaySession, LeaveStatsItem, LeaveType } from '../lib/api/leave';

type EmployeeLeaveRequestModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  creating: boolean;
  leaveTypes: LeaveType[];
  formTypeId: string;
  onFormTypeIdChange: (value: string) => void;
  formStartDate: string;
  onFormStartDateChange: (value: string) => void;
  formEndDate: string;
  onFormEndDateChange: (value: string) => void;
  minDate: string;
  formReason: string;
  onFormReasonChange: (value: string) => void;
  formIsHalfDay: boolean;
  onFormIsHalfDayChange: (value: boolean) => void;
  formHalfDaySession: HalfDaySession;
  onFormHalfDaySessionChange: (value: HalfDaySession) => void;
  selectedLeaveStats?: LeaveStatsItem | null;
  onSubmit: () => void;
};

export default function EmployeeLeaveRequestModal({
  open,
  onOpenChange,
  creating,
  leaveTypes,
  formTypeId,
  onFormTypeIdChange,
  formStartDate,
  onFormStartDateChange,
  formEndDate,
  onFormEndDateChange,
  minDate,
  formReason,
  onFormReasonChange,
  formIsHalfDay,
  onFormIsHalfDayChange,
  formHalfDaySession,
  onFormHalfDaySessionChange,
  selectedLeaveStats,
  onSubmit,
}: EmployeeLeaveRequestModalProps) {
  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !creating && onOpenChange(nextOpen)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Leave Request</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Leave Type</label>
            <select
              className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              value={formTypeId}
              onChange={(e) => onFormTypeIdChange(e.target.value)}
            >
              {leaveTypes.length === 0 && <option value="">No leave types</option>}
              {leaveTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Start Date</label>
              <Input
                type="date"
                min={minDate}
                value={formStartDate}
                onChange={(e) => onFormStartDateChange(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">End Date</label>
              <Input
                type="date"
                min={formStartDate || minDate}
                value={formEndDate}
                onChange={(e) => onFormEndDateChange(e.target.value)}
              />
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

          {selectedLeaveStats && (
            <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
              <div className="font-semibold">Leave Balance</div>
              <div className="mt-1">
                Allocated: {selectedLeaveStats.allocatedDays} | Used: {selectedLeaveStats.usedDays} | Pending: {selectedLeaveStats.pendingDays} | Remaining: {selectedLeaveStats.remainingDays}
              </div>
            </div>
          )}

          <div className="space-y-3 rounded-md border border-gray-200 p-3">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <input
                type="checkbox"
                checked={formIsHalfDay}
                onChange={(e) => onFormIsHalfDayChange(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              Half-day leave
            </label>

            {formIsHalfDay && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Session</label>
                <select
                  className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  value={formHalfDaySession}
                  onChange={(e) => onFormHalfDaySessionChange(e.target.value as HalfDaySession)}
                >
                  <option value="FIRST_HALF">First Half</option>
                  <option value="SECOND_HALF">Second Half</option>
                </select>
              </div>
            )}
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
