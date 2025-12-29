'use client';

import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { attendanceApi, type AttendanceDay, type AttendanceRecord } from '../lib/api/attendance';
import type { WorkShift } from '../lib/api/workshift';
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

export interface UpdateAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  record: AttendanceRecord | null;
  workShifts: WorkShift[];
}

const STATUS_OPTIONS: { value: AttendanceDay['status']; label: string }[] = [
  { value: 'PRESENT', label: 'Present' },
  { value: 'LATE', label: 'Late' },
  { value: 'HALF_DAY', label: 'Half Day' },
  { value: 'ABSENT', label: 'Absent' },
  { value: 'ON_LEAVE', label: 'On Leave' },
  { value: 'WEEKEND', label: 'Weekend' },
  { value: 'HOLIDAY', label: 'Holiday' },
];

const toDateInput = (value?: string | null) =>
  value ? new Date(value).toLocaleDateString('en-CA') : '';

const toTimeInput = (value?: string | null) =>
  value
    ? new Date(value).toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      })
    : '';

const buildDateTime = (date: string, time: string) => {
  if (!date || !time) return undefined;
  return new Date(`${date}T${time}:00+05:45`).toISOString();
};

export function UpdateAttendanceModal({
  isOpen,
  onClose,
  onSuccess,
  record,
  workShifts,
}: UpdateAttendanceModalProps) {
  const [date, setDate] = useState('');
  const [checkInTime, setCheckInTime] = useState('');
  const [checkOutTime, setCheckOutTime] = useState('');
  const [status, setStatus] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!record) return;
    setDate(toDateInput(record.date));
    setCheckInTime(toTimeInput(record.checkInTime));
    setCheckOutTime(toTimeInput(record.checkOutTime));
    setStatus(record.status || '');
    setNotes(record.notes || '');
  }, [record]);

  const shiftName = useMemo(() => {
    if (!record?.workShiftId) return 'Auto (Employee Default)';
    const shift = workShifts.find((item) => item.id === record.workShiftId);
    if (!shift) return 'Auto (Employee Default)';
    return `${shift.name} ${shift.code ? `(${shift.code})` : ''}`;
  }, [record, workShifts]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!record) return;

    setLoading(true);
    try {
      await attendanceApi.updateManualAttendance(record.id, {
        checkInTime: buildDateTime(date, checkInTime),
        checkOutTime: buildDateTime(date, checkOutTime),
        status: status ? (status as AttendanceDay['status']) : undefined,
        notes: notes.trim() || undefined,
      });

      toast.success('Attendance updated successfully');
      onSuccess?.();
      handleClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update attendance';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    onClose();
  };

  if (!record) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Edit Attendance</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Employee</Label>
              <div className="mt-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
                {record.employee
                  ? `${record.employee.firstName ?? ''} ${record.employee.lastName ?? ''}`.trim()
                  : 'Unknown'}
              </div>
            </div>
            <div>
              <Label>Date</Label>
              <Input id="date" type="date" value={date} disabled />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Shift</Label>
              <div className="mt-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
                {shiftName}
              </div>
            </div>
            <div>
              <Label htmlFor="status">Status Override</Label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              >
                <option value="">Auto calculate</option>
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="checkInTime">Check In</Label>
              <Input
                id="checkInTime"
                type="time"
                value={checkInTime}
                onChange={(e) => setCheckInTime(e.target.value)}
                disabled={loading}
              />
            </div>
            <div>
              <Label htmlFor="checkOutTime">Check Out</Label>
              <Input
                id="checkOutTime"
                type="time"
                value={checkOutTime}
                onChange={(e) => setCheckOutTime(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1 min-h-[90px] w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="cancel" onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" variant="blue" disabled={loading}>
              {loading ? 'Saving...' : 'Update Attendance'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
