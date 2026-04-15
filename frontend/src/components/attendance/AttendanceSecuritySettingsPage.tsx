'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import DashboardLayout from '../DashboardLayout';
import { PageHeader } from '../PageHeader';
import { attendanceApi } from '../../lib/api/attendance';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { useBreadcrumbs } from '../AppBreadcrumbs';
import { usePathname } from 'next/navigation';

type FormState = {
  attendanceIpRestrictionEnabled: boolean;
  attendanceAllowedIpRangesText: string;
  attendanceGeoRestrictionEnabled: boolean;
  officeLatitude: string;
  officeLongitude: string;
  officeRadiusMeters: string;
};

function parseNumber(value: string) {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseIpRules(text: string) {
  return text
    .split('\n')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

const EMPTY_FORM: FormState = {
  attendanceIpRestrictionEnabled: false,
  attendanceAllowedIpRangesText: '',
  attendanceGeoRestrictionEnabled: false,
  officeLatitude: '',
  officeLongitude: '',
  officeRadiusMeters: '150',
};

export default function AttendanceSecuritySettingsPage() {
  const pathname = usePathname();
  const rolePath = pathname.split('/')[2] || 'companyadmin';
  useBreadcrumbs([
    { href: `/dashboard/${rolePath}`, label: 'Dashboard' },
    { href: `/dashboard/${rolePath}/attendance`, label: 'Attendance' },
    { label: 'Attendance Settings' },
  ]);

  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [savedForm, setSavedForm] = useState<FormState>(EMPTY_FORM);

  useEffect(() => {
    const loadSettings = async () => {
      setLoading(true);
      try {
        const response = await attendanceApi.getSecuritySettings();
        const data = response.data;
        const nextForm: FormState = {
          attendanceIpRestrictionEnabled: data.attendanceIpRestrictionEnabled ?? false,
          attendanceAllowedIpRangesText: (data.attendanceAllowedIpRanges || []).join('\n'),
          attendanceGeoRestrictionEnabled: data.attendanceGeoRestrictionEnabled ?? false,
          officeLatitude:
            data.officeLatitude === null || data.officeLatitude === undefined
              ? ''
              : String(data.officeLatitude),
          officeLongitude:
            data.officeLongitude === null || data.officeLongitude === undefined
              ? ''
              : String(data.officeLongitude),
          officeRadiusMeters:
            data.officeRadiusMeters === null || data.officeRadiusMeters === undefined
              ? '150'
              : String(data.officeRadiusMeters),
        };
        setForm(nextForm);
        setSavedForm(nextForm);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load settings';
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  const setField = (key: keyof FormState, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const detectOfficeLocation = async () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      toast.error('Geolocation is not supported in this browser');
      return;
    }

    setDetectingLocation(true);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 12000,
          maximumAge: 0,
        });
      });

      setForm((prev) => ({
        ...prev,
        officeLatitude: String(position.coords.latitude),
        officeLongitude: String(position.coords.longitude),
      }));
      toast.success('Office coordinates captured from current location');
    } catch {
      toast.error('Unable to capture location. Please allow location access and try again.');
    } finally {
      setDetectingLocation(false);
    }
  };

  const handleCancel = () => {
    setForm(savedForm);
    setIsEditing(false);
  };

  const ipRules = parseIpRules(form.attendanceAllowedIpRangesText);
  const hasConfiguredCoordinates =
    form.officeLatitude.trim().length > 0 && form.officeLongitude.trim().length > 0;

  const handleSave = async () => {
    if (form.attendanceIpRestrictionEnabled && ipRules.length === 0) {
      toast.error('Add at least one office public IP/CIDR when IP restriction is enabled.');
      return;
    }

    const officeLatitude = parseNumber(form.officeLatitude);
    const officeLongitude = parseNumber(form.officeLongitude);
    const officeRadiusMeters = parseNumber(form.officeRadiusMeters);

    if (
      form.attendanceGeoRestrictionEnabled &&
      (officeLatitude === undefined || officeLongitude === undefined)
    ) {
      toast.error('Latitude and longitude are required when geofence is enabled.');
      return;
    }

    if (
      form.attendanceGeoRestrictionEnabled &&
      (officeRadiusMeters === undefined || officeRadiusMeters < 20 || officeRadiusMeters > 5000)
    ) {
      toast.error('Radius must be between 20 and 5000 meters.');
      return;
    }

    setSaving(true);
    try {
      const response = await attendanceApi.updateSecuritySettings({
        attendanceIpRestrictionEnabled: form.attendanceIpRestrictionEnabled,
        attendanceAllowedIpRanges: ipRules,
        attendanceGeoRestrictionEnabled: form.attendanceGeoRestrictionEnabled,
        officeLatitude,
        officeLongitude,
        officeRadiusMeters,
      });

      setSavedForm(form);
      setIsEditing(false);
      toast.success(response.message || 'Attendance security settings updated.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save settings';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Attendance Security Settings"
          description="Control who can mark attendance based on office network and office location."
        />

        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle className="text-base">Office Wi-Fi / IP Restriction</CardTitle>
              <p className="mt-1 text-sm text-gray-500">
                Employees can mark attendance only from approved public IP/CIDR.
              </p>
            </div>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                form.attendanceIpRestrictionEnabled
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              {form.attendanceIpRestrictionEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300"
                checked={form.attendanceIpRestrictionEnabled}
                onChange={(event) =>
                  setField('attendanceIpRestrictionEnabled', event.target.checked)
                }
                disabled={loading || saving || !isEditing}
              />
              <span className="text-sm text-gray-800">
                Allow check-in/check-out only from approved office public IP or CIDR.
              </span>
            </label>

            <div className="space-y-2">
              <Label htmlFor="attendanceAllowedIpRanges">
                Allowed Public IP/CIDR (one per line)
              </Label>
              <textarea
                id="attendanceAllowedIpRanges"
                value={form.attendanceAllowedIpRangesText}
                onChange={(event) =>
                  setField('attendanceAllowedIpRangesText', event.target.value)
                }
                placeholder={'103.41.200.10\n103.41.200.0/24'}
                rows={4}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                disabled={loading || saving || !isEditing}
              />
              <p className="text-xs text-gray-500">
                Use your office&apos;s public IP. Private IPs like 192.168.x.x are not reliable for
                this check.
              </p>
              {!loading && (
                <p className="text-xs text-gray-500">
                  Configured entries: <span className="font-semibold text-gray-700">{ipRules.length}</span>
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle className="text-base">Office Geofence Restriction</CardTitle>
              <p className="mt-1 text-sm text-gray-500">
                Employees must be inside your office radius to check in/out.
              </p>
            </div>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                form.attendanceGeoRestrictionEnabled
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              {form.attendanceGeoRestrictionEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300"
                checked={form.attendanceGeoRestrictionEnabled}
                onChange={(event) =>
                  setField('attendanceGeoRestrictionEnabled', event.target.checked)
                }
                disabled={loading || saving || !isEditing}
              />
              <span className="text-sm text-gray-800">
                Require employees to be inside office radius when marking attendance.
              </span>
            </label>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="officeLatitude">Office Latitude</Label>
                <Input
                  id="officeLatitude"
                  value={form.officeLatitude}
                  onChange={(event) => setField('officeLatitude', event.target.value)}
                  placeholder="27.7172"
                  disabled={loading || saving || !isEditing}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="officeLongitude">Office Longitude</Label>
                <Input
                  id="officeLongitude"
                  value={form.officeLongitude}
                  onChange={(event) => setField('officeLongitude', event.target.value)}
                  placeholder="85.3240"
                  disabled={loading || saving || !isEditing}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="officeRadiusMeters">Radius (meters)</Label>
                <Input
                  id="officeRadiusMeters"
                  value={form.officeRadiusMeters}
                  onChange={(event) => setField('officeRadiusMeters', event.target.value)}
                  placeholder="150"
                  disabled={loading || saving || !isEditing}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={detectOfficeLocation}
                disabled={loading || saving || detectingLocation || !isEditing}
              >
                {detectingLocation ? 'Detecting location...' : 'Use Current Location'}
              </Button>
              <span className="text-xs text-gray-500">
                Stand at office center and click this to auto-fill coordinates.
              </span>
            </div>
            {!loading && (
              <p className="text-xs text-gray-500">
                Coordinates configured:{' '}
                <span className="font-semibold text-gray-700">
                  {hasConfiguredCoordinates ? 'Yes' : 'No'}
                </span>
              </p>
            )}
          </CardContent>
        </Card>

        {isEditing ? (
          <div className="flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={loading || saving}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="blue"
              onClick={handleSave}
              disabled={loading || saving}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="blue"
              onClick={() => setIsEditing(true)}
              disabled={loading}
            >
              Edit Settings
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
