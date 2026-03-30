'use client';

import { useMemo, useState } from 'react';
import DashboardLayout from '../../../components/DashboardLayout';
import { authApi } from '../../../lib/api/auth';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import toast from 'react-hot-toast';
import { CheckCircle2, Eye, EyeOff, LockKeyhole, ShieldCheck, XCircle } from 'lucide-react';

export default function SettingsPage() {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });
  const [loading, setLoading] = useState(false);

  const passwordChecks = useMemo(
    () => [
      { label: 'At least 8 characters', valid: formData.newPassword.length >= 8 },
      {
        label: 'Different from current password',
        valid: formData.currentPassword.length > 0 && formData.newPassword.length > 0 && formData.newPassword !== formData.currentPassword,
      },
      {
        label: 'Matches confirmation',
        valid:
          formData.confirmPassword.length > 0 &&
          formData.newPassword === formData.confirmPassword,
      },
    ],
    [formData.confirmPassword, formData.currentPassword, formData.newPassword],
  );

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const toggleVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const resetForm = () => {
    setFormData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
      toast.error('Please fill in all password fields');
      return;
    }

    if (formData.newPassword.length < 8) {
      toast.error('New password must be at least 8 characters long');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('New password and confirmation do not match');
      return;
    }

    if (formData.currentPassword === formData.newPassword) {
      toast.error('New password must be different from current password');
      return;
    }

    setLoading(true);
    try {
      const response = await authApi.changePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });

      toast.success(response.message || 'Password changed successfully');
      resetForm();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Change Password</h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage your account security and keep your password up to date.
          </p>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_340px]">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-start gap-4 border-b border-gray-100 pb-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <LockKeyhole className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">Change Password</h3>
                <p className="mt-1 text-sm text-gray-600">
                  Use a strong password that you do not use anywhere else.
                </p>
              </div>
            </div>

            <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
              {([
                ['currentPassword', 'Current Password', 'Enter current password'],
                ['newPassword', 'New Password', 'Enter new password'],
                ['confirmPassword', 'Confirm New Password', 'Re-enter new password'],
              ] as const).map(([name, label, placeholder]) => (
                <div key={name} className="space-y-2">
                  <Label htmlFor={name}>{label}</Label>
                  <div className="relative">
                    <Input
                      id={name}
                      name={name}
                      type={showPasswords[name] ? 'text' : 'password'}
                      value={formData[name]}
                      onChange={handleChange}
                      placeholder={placeholder}
                      disabled={loading}
                      className="pr-11"
                    />
                    <button
                      type="button"
                      onClick={() => toggleVisibility(name)}
                      className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-gray-400 transition-colors hover:text-gray-700"
                      aria-label={showPasswords[name] ? 'Hide password' : 'Show password'}
                    >
                      {showPasswords[name] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              ))}

              <div className="flex items-center justify-between gap-3 border-t border-gray-100 pt-5">
                <p className="text-xs text-gray-500">
                  Changing your password keeps your account secure across devices.
                </p>
                <Button type="submit" variant="blue" disabled={loading}>
                  {loading ? 'Updating...' : 'Update Password'}
                </Button>
              </div>
            </form>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-gradient-to-b from-slate-50 to-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">Password Guidelines</h3>
                <p className="text-sm text-gray-600">Quick checks before you save.</p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {passwordChecks.map((check) => (
                <div
                  key={check.label}
                  className={`flex items-center justify-between rounded-xl border px-4 py-3 text-sm ${
                    check.valid
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      : 'border-rose-200 bg-rose-50 text-rose-700'
                  }`}
                >
                  <span>{check.label}</span>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide">
                    {check.valid ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                    {check.valid ? 'Ready' : 'Not met'}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Avoid reusing old passwords or sharing them with anyone.
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
