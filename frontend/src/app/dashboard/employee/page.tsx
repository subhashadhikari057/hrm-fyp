'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '../../../components/DashboardLayout';
import { QuickActionsGrid } from '../../../components/QuickActionsGrid';
import { attendanceApi, type AttendanceDay } from '../../../lib/api/attendance';

export default function EmployeeDashboard() {
  const [isLoading, setIsLoading] = useState(false);
  const [lastAttendance, setLastAttendance] = useState<AttendanceDay | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const hasCheckedIn = !!lastAttendance?.checkInTime;
  const hasCheckedOut = !!lastAttendance?.checkOutTime;

  useEffect(() => {
    (async () => {
      try {
        const today = await attendanceApi.getMyToday();
        if (today) {
          setLastAttendance(today);
        }
      } catch {
        // Ignore initial load errors for now
      }
    })();
  }, []);

  async function handleCheckIn() {
    try {
      setIsLoading(true);
      setError(null);
      const res = await attendanceApi.checkIn();
      setLastAttendance(res.data);
      setMessage(res.message || 'Check-in successful');
    } catch (e: any) {
      setError(e?.message || 'Failed to check in');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCheckOut() {
    try {
      setIsLoading(true);
      setError(null);
      const res = await attendanceApi.checkOut();
      setLastAttendance(res.data);
      setMessage(res.message || 'Check-out successful');
    } catch (e: any) {
      setError(e?.message || 'Failed to check out');
    } finally {
      setIsLoading(false);
    }
  }
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">
              Employee Dashboard
            </h2>
            <p className="mt-2 text-gray-600">
              Welcome to your personal workspace
            </p>
          </div>
          <div className="flex items-center gap-3">
            {lastAttendance && (
              <div className="text-right text-xs text-gray-600">
                <div className="font-medium text-gray-900">
                  Status: {lastAttendance.status}
                </div>
              </div>
            )}
            {!hasCheckedIn && (
              <button
                onClick={handleCheckIn}
                disabled={isLoading}
                className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  'Please wait...'
                ) : (
                  <>
                    <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 17l5-5-5-5m5 5H3m12-7h4a2 2 0 012 2v8a2 2 0 01-2 2h-4" />
                    </svg>
                    Clock in
                  </>
                )}
              </button>
            )}
            {hasCheckedIn && !hasCheckedOut && (
              <button
                onClick={handleCheckOut}
                disabled={isLoading}
                className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  'Please wait...'
                ) : (
                  <>
                    <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 7l-5 5 5 5m-5-5h12m-6-7h4a2 2 0 012 2v8a2 2 0 01-2 2h-4" />
                    </svg>
                    Clock out
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Leave Balance</p>
                <p className="text-2xl font-semibold text-gray-900">15 days</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Requests</p>
                <p className="text-2xl font-semibold text-gray-900">2</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Profile Status</p>
                <p className="text-2xl font-semibold text-gray-900">Complete</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <QuickActionsGrid
            title="Quick Actions"
            columns={2}
            actions={[
              {
                label: 'Request Leave',
                href: '/dashboard/employee/leave',
                icon: (
                  <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                ),
                color: 'blue',
              },
              {
                label: 'View Payslips',
                href: '/dashboard/employee/payslips',
                icon: (
                  <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                ),
                color: 'green',
              },
              {
                label: 'Update Profile',
                href: '/dashboard/employee/profile',
                icon: (
                  <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                ),
                color: 'purple',
              },
            ]}
          />

          <div className="bg-white rounded-lg shadow p-6 border border-gray-200 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Today&apos;s Attendance</h3>

            {message && (
              <div className="rounded-md bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-700">
                {message}
              </div>
            )}
            {error && (
              <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            {lastAttendance && (
              <div className="text-sm text-gray-700 space-y-1">
                <p>
                  <span className="font-medium">Status:</span> {lastAttendance.status}
                </p>
                <p>
                  <span className="font-medium">Check-in:</span>{' '}
                  {lastAttendance.checkInTime
                    ? new Date(lastAttendance.checkInTime).toLocaleTimeString()
                    : '-'}
                </p>
                <p>
                  <span className="font-medium">Check-out:</span>{' '}
                  {lastAttendance.checkOutTime
                    ? new Date(lastAttendance.checkOutTime).toLocaleTimeString()
                    : '-'}
                </p>
                <p>
                  <span className="font-medium">Worked:</span>{' '}
                  {lastAttendance.totalWorkMinutes} min
                </p>
                {lastAttendance.lateMinutes > 0 && (
                  <p>
                    <span className="font-medium">Late by:</span>{' '}
                    {lastAttendance.lateMinutes} min
                  </p>
                )}
                {lastAttendance.overtimeMinutes > 0 && (
                  <p>
                    <span className="font-medium">Overtime:</span>{' '}
                    {lastAttendance.overtimeMinutes} min
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
