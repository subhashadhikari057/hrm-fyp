'use client';

import { Employee } from '@/lib/api/employee';
import { API_BASE_URL } from '@/lib/api/types';
import { User, Mail, Phone, MapPin, Briefcase, Calendar, DollarSign, AlertCircle, Users } from 'lucide-react';
import { format } from 'date-fns';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';

interface EmployeeViewModalProps {
    isOpen: boolean;
    onClose: () => void;
    employee: Employee | null;
}

export default function EmployeeViewModal({ isOpen, onClose, employee }: EmployeeViewModalProps) {
    if (!employee) return null;

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'N/A';
        try {
            return format(new Date(dateString), 'MMM dd, yyyy');
        } catch {
            return 'Invalid date';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active':
                return 'bg-green-100 text-green-700';
            case 'on_leave':
                return 'bg-yellow-100 text-yellow-700';
            case 'terminated':
                return 'bg-red-100 text-red-700';
            default:
                return 'bg-gray-100 text-gray-700';
        }
    };

    const getEmploymentTypeLabel = (type: string | null) => {
        if (!type) return 'N/A';
        return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    const getGenderLabel = (gender: string | null) => {
        if (!gender) return 'N/A';
        return gender.charAt(0).toUpperCase() + gender.slice(1);
    };

    const fullName = [employee.firstName, employee.middleName, employee.lastName].filter(Boolean).join(' ');
    const initials = `${employee.firstName.charAt(0)}${employee.lastName.charAt(0)}`.toUpperCase();
    const imageUrl = employee.imageUrl ? `${API_BASE_URL}/uploads/${employee.imageUrl}` : null;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Employee Details</DialogTitle>
                </DialogHeader>
                <div className="max-h-[70vh] overflow-y-auto p-6">
                    {/* Profile Section */}
                    <div className="flex items-start gap-6 mb-8 pb-8 border-b border-gray-200">
                        <div className="flex-shrink-0">
                            {imageUrl ? (
                                <>
                                    <img
                                        src={imageUrl}
                                        alt={fullName}
                                        className="w-24 h-24 rounded-full object-cover border-4 border-indigo-100"
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.style.display = 'none';
                                            const fallback = target.nextElementSibling as HTMLElement;
                                            if (fallback) fallback.style.display = 'flex';
                                        }}
                                    />
                                    <div
                                        className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center border-4 border-indigo-100"
                                        style={{ display: 'none' }}
                                    >
                                        <span className="text-white text-2xl font-semibold">{initials}</span>
                                    </div>
                                </>
                            ) : (
                                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center border-4 border-indigo-100">
                                    <span className="text-white text-2xl font-semibold">{initials}</span>
                                </div>
                            )}
                        </div>
                        <div className="flex-1">
                            <h3 className="text-2xl font-semibold text-gray-900 mb-2">{fullName}</h3>
                            <div className="flex items-center gap-3 mb-3">
                                <span className="text-sm font-mono text-gray-600 bg-gray-100 px-3 py-1 rounded">
                                    {employee.employeeCode}
                                </span>
                                <span className={`text-sm px-3 py-1 rounded-full ${getStatusColor(employee.status)}`}>
                                    {employee.status.replace('_', ' ').toUpperCase()}
                                </span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                {employee.workEmail && (
                                    <div className="flex items-center gap-2 text-gray-600">
                                        <Mail className="h-4 w-4 text-gray-400" />
                                        <span>{employee.workEmail}</span>
                                    </div>
                                )}
                                {employee.phone && (
                                    <div className="flex items-center gap-2 text-gray-600">
                                        <Phone className="h-4 w-4 text-gray-400" />
                                        <span>{employee.phone}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Personal Information */}
                        <div>
                            <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <User className="h-4 w-4 text-indigo-600" />
                                Personal Information
                            </h4>
                            <div className="space-y-3">
                                <DetailItem label="First Name" value={employee.firstName} />
                                {employee.middleName && (
                                    <DetailItem label="Middle Name" value={employee.middleName} />
                                )}
                                <DetailItem label="Last Name" value={employee.lastName} />
                                <DetailItem label="Gender" value={getGenderLabel(employee.gender)} />
                                <DetailItem label="Date of Birth" value={formatDate(employee.dateOfBirth)} />
                            </div>
                        </div>

                        {/* Employment Information */}
                        <div>
                            <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <Briefcase className="h-4 w-4 text-indigo-600" />
                                Employment Information
                            </h4>
                            <div className="space-y-3">
                                <DetailItem
                                    label="Department"
                                    value={employee.department ? `${employee.department.name}${employee.department.code ? ` (${employee.department.code})` : ''}` : 'N/A'}
                                />
                                <DetailItem
                                    label="Designation"
                                    value={employee.designation ? `${employee.designation.name}${employee.designation.code ? ` (${employee.designation.code})` : ''}` : 'N/A'}
                                />
                                <DetailItem
                                    label="Employment Type"
                                    value={getEmploymentTypeLabel(employee.employmentType)}
                                />
                                <DetailItem label="Join Date" value={formatDate(employee.joinDate)} />
                                <DetailItem label="Probation End" value={formatDate(employee.probationEnd)} />
                            </div>
                        </div>

                        {/* Contact Information */}
                        <div>
                            <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <Mail className="h-4 w-4 text-indigo-600" />
                                Contact Information
                            </h4>
                            <div className="space-y-3">
                                <DetailItem label="Work Email" value={employee.workEmail || 'N/A'} />
                                <DetailItem label="Personal Email" value={employee.personalEmail || 'N/A'} />
                                <DetailItem label="Phone" value={employee.phone || 'N/A'} />
                                <DetailItem label="Address" value={employee.address || 'N/A'} />
                            </div>
                        </div>

                        {/* Emergency Contact */}
                        <div>
                            <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <AlertCircle className="h-4 w-4 text-indigo-600" />
                                Emergency Contact
                            </h4>
                            <div className="space-y-3">
                                <DetailItem
                                    label="Contact Name"
                                    value={employee.emergencyContactName || 'N/A'}
                                />
                                <DetailItem
                                    label="Contact Phone"
                                    value={employee.emergencyContactPhone || 'N/A'}
                                />
                            </div>
                        </div>

                        {/* Compensation */}
                        {employee.baseSalary !== null && (
                            <div>
                                <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <DollarSign className="h-4 w-4 text-indigo-600" />
                                    Compensation
                                </h4>
                                <div className="space-y-3">
                                    <DetailItem
                                        label="Base Salary"
                                        value={`$${employee.baseSalary.toLocaleString()}`}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Account Information */}
                        {employee.user && (
                            <div>
                                <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <Users className="h-4 w-4 text-indigo-600" />
                                    Account Information
                                </h4>
                                <div className="space-y-3">
                                    <DetailItem label="Email" value={employee.user.email} />
                                    <DetailItem label="Role" value={employee.user.role.replace('_', ' ').toUpperCase()} />
                                    {employee.user.fullName && (
                                        <DetailItem label="Full Name" value={employee.user.fullName} />
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* System Information */}
                    <div className="mt-8 pt-6 border-t border-gray-200">
                        <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-indigo-600" />
                            System Information
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <DetailItem label="Created At" value={formatDate(employee.createdAt)} />
                            <DetailItem label="Updated At" value={formatDate(employee.updatedAt)} />
                        </div>
                    </div>
                </div>

                <div className="pt-6">
                    <DialogFooter>
                        <Button onClick={onClose} type="button" variant="cancel">
                            Close
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function DetailItem({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex flex-col">
            <span className="text-xs text-gray-500 mb-1">{label}</span>
            <span className="text-sm text-gray-900">{value}</span>
        </div>
    );
}
