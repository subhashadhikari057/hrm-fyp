'use client';

import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { attendanceApi, type AttendanceDay } from '../lib/api/attendance';
import type { Employee } from '../lib/api/employee';
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

export interface AddAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (record: AttendanceDay) => void;
  employees: Employee[];
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

const buildDateTime = (date: string, time: string) => {
  if (!date || !time) return undefined;
  return new Date(`${date}T${time}:00+05:45`).toISOString();
};

export function AddAttendanceModal({
  isOpen,
  onClose,
  onSuccess,
  employees,
  workShifts,
}: AddAttendanceModalProps) {
  const [employeeId, setEmployeeId] = useState('');
  const [date, setDate] = useState('');
  const [shiftId, setShiftId] = useState('');
  const [checkInTime, setCheckInTime] = useState('');
  const [checkOutTime, setCheckOutTime] = useState('');
  const [status, setStatus] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (isOpen) {
      setDate(toDateInput(new Date().toISOString()));
    }
  }, [isOpen]);

  const employeeOptions = useMemo(
    () =>
      employees.map((employee) => ({
        value: employee.id,
        label: `${employee.firstName} ${employee.lastName}${employee.employeeCode ? ` (${employee.employeeCode})` : ''}`,
      })),
    [employees],
  );

  const validateForm = () => {
    const nextErrors: { [key: string]: string } = {};
    if (!employeeId) nextErrors.employeeId = 'Employee is required';
    if (!date) nextErrors.date = 'Date is required';
    if (!status && !checkInTime && !checkOutTime) {
      nextErrors.status = 'Select a status or provide check-in/out time';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await attendanceApi.createManualAttendance({
        employeeId,
        date: new Date(`${date}T00:00:00+05:45`).toISOString(),
        shiftId: shiftId || undefined,
        checkInTime: buildDateTime(date, checkInTime),
        checkOutTime: buildDateTime(date, checkOutTime),
        status: status ? (status as AttendanceDay['status']) : undefined,
        notes: notes.trim() || undefined,
      });

      toast.success('Attendance added successfully');
      onSuccess?.(response.data);
      handleClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add attendance';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    setEmployeeId('');
    setShiftId('');
    setCheckInTime('');
    setCheckOutTime('');
    setStatus('');
    setNotes('');
    setErrors({});
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Add Attendance</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="employeeId">
                Employee <span className="text-red-500">*</span>
              </Label>
              <select
                id="employeeId"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              >
                <option value="">Select employee</option>
                {employeeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.employeeId && (
                <p className="mt-1 text-xs text-red-500">{errors.employeeId}</p>
              )}
            </div>
            <div>
              <Label htmlFor="date">
                Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                disabled={loading}
              />
              {errors.date && <p className="mt-1 text-xs text-red-500">{errors.date}</p>}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="shiftId">Work Shift</Label>
              <select
                id="shiftId"
                value={shiftId}
                onChange={(e) => setShiftId(e.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              >
                <option value="">Auto (Employee Default)</option>
                {workShifts.map((shift) => (
                  <option key={shift.id} value={shift.id}>
                    {shift.name} {shift.code ? `(${shift.code})` : ''}
                  </option>
                ))}
              </select>
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
              {errors.status && <p className="mt-1 text-xs text-red-500">{errors.status}</p>}
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
              {loading ? 'Saving...' : 'Add Attendance'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
