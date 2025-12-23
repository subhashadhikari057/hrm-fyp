'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { employeeApi, type Employee, type UpdateEmployeeData } from '../lib/api/employee';
import { departmentApi, type Department } from '../lib/api/department';
import { designationApi, type Designation } from '../lib/api/designation';
import { workShiftApi, type WorkShift } from '../lib/api/workshift';

interface UpdateEmployeeModalProps {
    isOpen: boolean;
    onClose: () => void;
    employeeId: string | null;
    onSuccess?: () => void;
}

export function UpdateEmployeeModal({
    isOpen,
    onClose,
    employeeId,
    onSuccess,
}: UpdateEmployeeModalProps) {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        middleName: '',
        departmentId: '',
        designationId: '',
        workShiftId: '',
        employmentType: '',
        gender: '',
        dateOfBirth: '',
        joinDate: '',
        probationEnd: '',
        locationId: '',
        workEmail: '',
        personalEmail: '',
        phone: '',
        address: '',
        emergencyContactName: '',
        emergencyContactPhone: '',
        baseSalary: '',
        image: null as File | null,
    });
    const [departments, setDepartments] = useState<Department[]>([]);
    const [designations, setDesignations] = useState<Designation[]>([]);
    const [workShifts, setWorkShifts] = useState<WorkShift[]>([]);
    const [loading, setLoading] = useState(false);
    const [fetchingData, setFetchingData] = useState(false);
    const [fetchingOptions, setFetchingOptions] = useState(false);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    useEffect(() => {
        if (!isOpen) return;

        const fetchOptions = async () => {
            setFetchingOptions(true);
            try {
                const [departmentsRes, designationsRes, workShiftsRes] = await Promise.all([
                    departmentApi.getDepartments({ isActive: true }),
                    designationApi.getDesignations({ isActive: true }),
                    workShiftApi.getWorkShifts({ isActive: true }),
                ]);

                setDepartments(departmentsRes.data);
                setDesignations(designationsRes.data);
                setWorkShifts(workShiftsRes.data);
            } catch (error) {
                console.error('Error fetching employee form options:', error);
                toast.error('Failed to load departments, designations, or work shifts');
            } finally {
                setFetchingOptions(false);
            }
        };

        fetchOptions();
    }, [isOpen]);

    useEffect(() => {
        const fetchEmployee = async () => {
            if (!employeeId || !isOpen) return;

            setFetchingData(true);
            try {
                const response = await employeeApi.getEmployeeById(employeeId);
                const employee: Employee = response.data;

                setFormData({
                    firstName: employee.firstName || '',
                    lastName: employee.lastName || '',
                    middleName: employee.middleName || '',
                    departmentId: employee.departmentId || '',
                    designationId: employee.designationId || '',
                    workShiftId: employee.workShiftId || '',
                    employmentType: employee.employmentType || '',
                    gender: employee.gender || '',
                    dateOfBirth: employee.dateOfBirth ? employee.dateOfBirth.slice(0, 10) : '',
                    joinDate: employee.joinDate ? employee.joinDate.slice(0, 10) : '',
                    probationEnd: employee.probationEnd ? employee.probationEnd.slice(0, 10) : '',
                    locationId: employee.locationId || '',
                    workEmail: employee.workEmail || '',
                    personalEmail: employee.personalEmail || '',
                    phone: employee.phone || '',
                    address: employee.address || '',
                    emergencyContactName: employee.emergencyContactName || '',
                    emergencyContactPhone: employee.emergencyContactPhone || '',
                    baseSalary: employee.baseSalary ? String(employee.baseSalary) : '',
                    image: null,
                });
                setErrors({});
            } catch (error) {
                console.error('Error fetching employee:', error);
                toast.error('Failed to load employee data');
                onClose();
            } finally {
                setFetchingData(false);
            }
        };

        fetchEmployee();
    }, [employeeId, isOpen, onClose]);

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));

        if (errors[name]) {
            setErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setFormData((prev) => ({
            ...prev,
            image: file,
        }));
    };

    const validateForm = () => {
        const newErrors: { [key: string]: string } = {};

        if (!formData.firstName.trim()) {
            newErrors.firstName = 'First name is required';
        }
        if (!formData.lastName.trim()) {
            newErrors.lastName = 'Last name is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm() || !employeeId) {
            return;
        }

        setLoading(true);
        try {
            const payload: UpdateEmployeeData = {
                firstName: formData.firstName.trim(),
                lastName: formData.lastName.trim(),
            };

            payload.middleName = formData.middleName.trim();
            payload.departmentId = formData.departmentId || undefined;
            payload.designationId = formData.designationId || undefined;
            payload.workShiftId = formData.workShiftId || undefined;
            payload.employmentType = formData.employmentType
                ? (formData.employmentType as UpdateEmployeeData['employmentType'])
                : undefined;
            payload.gender = formData.gender ? (formData.gender as UpdateEmployeeData['gender']) : undefined;
            payload.dateOfBirth = formData.dateOfBirth || undefined;
            payload.joinDate = formData.joinDate || undefined;
            payload.probationEnd = formData.probationEnd || undefined;
            payload.locationId = formData.locationId.trim() || undefined;
            payload.workEmail = formData.workEmail.trim() || undefined;
            payload.personalEmail = formData.personalEmail.trim() || undefined;
            payload.phone = formData.phone.trim() || undefined;
            payload.address = formData.address.trim() || undefined;
            payload.emergencyContactName = formData.emergencyContactName.trim() || undefined;
            payload.emergencyContactPhone = formData.emergencyContactPhone.trim() || undefined;
            payload.baseSalary = formData.baseSalary ? Number(formData.baseSalary) : undefined;
            if (formData.image) payload.image = formData.image;

            await employeeApi.updateEmployee(employeeId, payload);

            toast.success('Employee updated successfully');
            onSuccess?.();
            onClose();
        } catch (error: unknown) {
            console.error('Error updating employee:', error);
            const errorMessage =
                error instanceof Error ? error.message : 'Failed to update employee';
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (!loading) {
            setErrors({});
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="w-full max-w-3xl bg-white rounded-lg shadow-xl p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Update Employee</h3>
                    <button
                        onClick={handleClose}
                        disabled={loading || fetchingData}
                        className="text-gray-400 hover:text-gray-500 disabled:opacity-50"
                    >
                        <svg
                            className="w-6 h-6"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>

                {fetchingData ? (
                    <div className="py-8 text-center text-gray-500">Loading employee data...</div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    First Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="firstName"
                                    value={formData.firstName}
                                    onChange={handleInputChange}
                                    disabled={loading}
                                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100 ${errors.firstName ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                />
                                {errors.firstName && <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Middle Name
                                </label>
                                <input
                                    type="text"
                                    name="middleName"
                                    value={formData.middleName}
                                    onChange={handleInputChange}
                                    disabled={loading}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Last Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="lastName"
                                    value={formData.lastName}
                                    onChange={handleInputChange}
                                    disabled={loading}
                                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100 ${errors.lastName ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                />
                                {errors.lastName && <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Department
                                </label>
                                <select
                                    name="departmentId"
                                    value={formData.departmentId}
                                    onChange={handleInputChange}
                                    disabled={loading || fetchingOptions}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
                                >
                                    <option value="">Unassigned</option>
                                    {departments.map((dept) => (
                                        <option key={dept.id} value={dept.id}>
                                            {dept.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Designation
                                </label>
                                <select
                                    name="designationId"
                                    value={formData.designationId}
                                    onChange={handleInputChange}
                                    disabled={loading || fetchingOptions}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
                                >
                                    <option value="">Unassigned</option>
                                    {designations.map((designation) => (
                                        <option key={designation.id} value={designation.id}>
                                            {designation.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Work Shift
                                </label>
                                <select
                                    name="workShiftId"
                                    value={formData.workShiftId}
                                    onChange={handleInputChange}
                                    disabled={loading || fetchingOptions}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
                                >
                                    <option value="">Unassigned</option>
                                    {workShifts.map((shift) => (
                                        <option key={shift.id} value={shift.id}>
                                            {shift.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Employment Type
                                </label>
                                <select
                                    name="employmentType"
                                    value={formData.employmentType}
                                    onChange={handleInputChange}
                                    disabled={loading}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
                                >
                                    <option value="">Select type</option>
                                    <option value="full_time">Full-Time</option>
                                    <option value="part_time">Part-Time</option>
                                    <option value="contract">Contract</option>
                                    <option value="intern">Intern</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Gender
                                </label>
                                <select
                                    name="gender"
                                    value={formData.gender}
                                    onChange={handleInputChange}
                                    disabled={loading}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
                                >
                                    <option value="">Select gender</option>
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Date of Birth
                                </label>
                                <input
                                    type="date"
                                    name="dateOfBirth"
                                    value={formData.dateOfBirth}
                                    onChange={handleInputChange}
                                    disabled={loading}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Join Date
                                </label>
                                <input
                                    type="date"
                                    name="joinDate"
                                    value={formData.joinDate}
                                    onChange={handleInputChange}
                                    disabled={loading}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Probation End
                                </label>
                                <input
                                    type="date"
                                    name="probationEnd"
                                    value={formData.probationEnd}
                                    onChange={handleInputChange}
                                    disabled={loading}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Location ID
                                </label>
                                <input
                                    type="text"
                                    name="locationId"
                                    value={formData.locationId}
                                    onChange={handleInputChange}
                                    disabled={loading}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
                                    placeholder="Location UUID"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Work Email
                                </label>
                                <input
                                    type="email"
                                    name="workEmail"
                                    value={formData.workEmail}
                                    onChange={handleInputChange}
                                    disabled={loading}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Personal Email
                                </label>
                                <input
                                    type="email"
                                    name="personalEmail"
                                    value={formData.personalEmail}
                                    onChange={handleInputChange}
                                    disabled={loading}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Phone
                                </label>
                                <input
                                    type="text"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    disabled={loading}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Address
                                </label>
                                <input
                                    type="text"
                                    name="address"
                                    value={formData.address}
                                    onChange={handleInputChange}
                                    disabled={loading}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Emergency Contact Name
                                </label>
                                <input
                                    type="text"
                                    name="emergencyContactName"
                                    value={formData.emergencyContactName}
                                    onChange={handleInputChange}
                                    disabled={loading}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Emergency Contact Phone
                                </label>
                                <input
                                    type="text"
                                    name="emergencyContactPhone"
                                    value={formData.emergencyContactPhone}
                                    onChange={handleInputChange}
                                    disabled={loading}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Base Salary
                                </label>
                                <input
                                    type="number"
                                    name="baseSalary"
                                    value={formData.baseSalary}
                                    onChange={handleInputChange}
                                    disabled={loading}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Profile Image
                                </label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    disabled={loading}
                                    className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3 pt-4">
                            <button
                                type="button"
                                onClick={handleClose}
                                disabled={loading}
                                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {loading ? 'Updating...' : 'Update Employee'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
