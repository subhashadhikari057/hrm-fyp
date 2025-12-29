'use client';

import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../../../components/DashboardLayout';
import { useAuth } from '../../../contexts/AuthContext';
import { API_BASE_URL, type BackendUser } from '../../../lib/api/types';
import { authApi } from '../../../lib/api/auth';
import { employeeApi, type Employee } from '../../../lib/api/employee';
import toast from 'react-hot-toast';

const roleLabels: Record<string, string> = {
  superadmin: 'Super Admin',
  companyadmin: 'Company Admin',
  hrmanager: 'HR Manager',
  manager: 'Manager',
  employee: 'Employee',
};

export default function ProfilePage() {
  const { user } = useAuth();
  const [authUser, setAuthUser] = useState<BackendUser | null>(null);
  const [employeeProfile, setEmployeeProfile] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const meResponse = await authApi.getCurrentUser();
        setAuthUser(meResponse.user);

        if (meResponse.user.role === 'employee') {
          const profileResponse = await employeeApi.getMyProfile();
          setEmployeeProfile(profileResponse.data);
        }
      } catch (error) {
        console.error('Failed to load profile:', error);
        toast.error('Failed to load profile details');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const displayName = useMemo(() => {
    return (
      authUser?.fullName ||
      user?.name ||
      authUser?.email?.split('@')[0] ||
      user?.email?.split('@')[0] ||
      'User'
    );
  }, [authUser, user]);

  const initials = displayName
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const roleLabel = useMemo(() => {
    const role =
      (authUser?.role && roleLabels[authUser.role as keyof typeof roleLabels]) ||
      (user?.role && roleLabels[user.role]) ||
      'User';
    return role;
  }, [authUser, user]);

  const avatarUrl = (() => {
    if (employeeProfile?.imageUrl) {
      return `${API_BASE_URL}/uploads/${employeeProfile.imageUrl}`;
    }

    if (!authUser?.avatarUrl && !user?.avatarUrl) return null;
    const raw = authUser?.avatarUrl || user?.avatarUrl || '';
    if (raw.startsWith('http')) return raw;
    if (raw.startsWith('/uploads')) return `${API_BASE_URL}${raw}`;
    if (raw.startsWith('uploads/')) return `${API_BASE_URL}/${raw}`;
    return `${API_BASE_URL}/uploads/${raw.replace(/^\//, '')}`;
  })();

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Profile</h1>
          <p className="mt-2 text-sm text-gray-600">
            Your account details from the current session.
          </p>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
              Loading profile details...
            </div>
          </div>
        ) : (
        <div className="grid grid-cols-1 gap-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-5">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={displayName}
                    className="h-20 w-20 rounded-full object-cover border-4 border-indigo-100"
                  />
                ) : (
                  <div className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xl font-semibold">
                    {initials}
                  </div>
                )}
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{displayName}</h2>
                  <p className="text-sm text-gray-500">{roleLabel}</p>
                  <p className="text-xs text-gray-400">
                    {authUser?.email || user?.email || 'No email available'}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                <span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1">
                  Status: Active
                </span>
                {authUser?.company?.name || authUser?.companyId || user?.companyId ? (
                  <span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1">
                    Company: {authUser?.company?.name || authUser?.companyId || user?.companyId}
                  </span>
                ) : null}
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <DetailItem label="Full Name" value={displayName} />
              <DetailItem label="Email" value={authUser?.email || user?.email || 'N/A'} />
              <DetailItem
                label="Phone"
                value={authUser?.phone || employeeProfile?.phone || 'N/A'}
              />
              <DetailItem label="Role" value={roleLabel} />
              <DetailItem
                label="Company"
                value={authUser?.company?.name || authUser?.companyId || user?.companyId || 'N/A'}
              />
            </div>
          </div>

          {employeeProfile ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="text-base font-semibold text-gray-900">Employee Details</h3>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <DetailItem
                  label="Employee Code"
                  value={employeeProfile.employeeCode || 'N/A'}
                />
                <DetailItem
                  label="Status"
                  value={employeeProfile.status ? employeeProfile.status.replace('_', ' ') : 'N/A'}
                />
                <DetailItem
                  label="Work Email"
                  value={employeeProfile.workEmail || 'N/A'}
                />
                <DetailItem
                  label="Personal Email"
                  value={employeeProfile.personalEmail || 'N/A'}
                />
                <DetailItem
                  label="Department"
                  value={employeeProfile.department?.name || 'N/A'}
                />
                <DetailItem
                  label="Designation"
                  value={employeeProfile.designation?.name || 'N/A'}
                />
                <DetailItem
                  label="Work Shift"
                  value={employeeProfile.workShift?.name || 'N/A'}
                />
                <DetailItem
                  label="Employment Type"
                  value={employeeProfile.employmentType ? employeeProfile.employmentType.replace('_', ' ') : 'N/A'}
                />
                <DetailItem
                  label="Gender"
                  value={employeeProfile.gender ? employeeProfile.gender.replace('_', ' ') : 'N/A'}
                />
                <DetailItem
                  label="Date of Birth"
                  value={employeeProfile.dateOfBirth ? employeeProfile.dateOfBirth.split('T')[0] : 'N/A'}
                />
                <DetailItem
                  label="Join Date"
                  value={employeeProfile.joinDate ? employeeProfile.joinDate.split('T')[0] : 'N/A'}
                />
                <DetailItem
                  label="Probation End"
                  value={employeeProfile.probationEnd ? employeeProfile.probationEnd.split('T')[0] : 'N/A'}
                />
                <DetailItem
                  label="Location ID"
                  value={employeeProfile.locationId || 'N/A'}
                />
                <DetailItem
                  label="Phone"
                  value={employeeProfile.phone || 'N/A'}
                />
                <DetailItem
                  label="Address"
                  value={employeeProfile.address || 'N/A'}
                />
                <DetailItem
                  label="Emergency Contact Name"
                  value={employeeProfile.emergencyContactName || 'N/A'}
                />
                <DetailItem
                  label="Emergency Contact Phone"
                  value={employeeProfile.emergencyContactPhone || 'N/A'}
                />
                <DetailItem
                  label="Base Salary"
                  value={employeeProfile.baseSalary !== null ? employeeProfile.baseSalary.toString() : 'N/A'}
                />
              </div>
            </div>
          ) : null}
        </div>
        )}
      </div>
    </DashboardLayout>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </label>
      <div className="mt-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
        {value}
      </div>
    </div>
  );
}
