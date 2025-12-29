'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { employeeApi, type CreateEmployeeData } from '../lib/api/employee';
import { departmentApi, type Department } from '../lib/api/department';
import { designationApi, type Designation } from '../lib/api/designation';
import { workShiftApi, type WorkShift } from '../lib/api/workshift';
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

interface AddEmployeeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export function AddEmployeeModal({
    isOpen,
    onClose,
    onSuccess,
}: AddEmployeeModalProps) {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        middleName: '',
        employeeCode: '',
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
    const [fetchingOptions, setFetchingOptions] = useState(false);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [step, setStep] = useState<1 | 2>(1);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

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

    useEffect(() => {
        return () => {
            if (imagePreview) {
                URL.revokeObjectURL(imagePreview);
            }
        };
    }, [imagePreview]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        if (!file) {
            setFormData((prev) => ({ ...prev, image: null }));
            if (imagePreview) {
                URL.revokeObjectURL(imagePreview);
            }
            setImagePreview(null);
            return;
        }
        if (!file.type.startsWith('image/')) {
            setErrors((prev) => ({ ...prev, image: 'Please select a valid image file' }));
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setErrors((prev) => ({ ...prev, image: 'Image size must be less than 5MB' }));
            return;
        }
        if (imagePreview) {
            URL.revokeObjectURL(imagePreview);
        }
        setImagePreview(URL.createObjectURL(file));
        setFormData((prev) => ({
            ...prev,
            image: file,
        }));
    };

    const validateForm = () => {
        const newErrors: { [key: string]: string } = {};

        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        }
        if (!formData.password.trim()) {
            newErrors.password = 'Password is required';
        } else if (formData.password.length < 8) {
            newErrors.password = 'Password must be at least 8 characters';
        }
        if (!formData.firstName.trim()) {
            newErrors.firstName = 'First name is required';
        }
        if (!formData.lastName.trim()) {
            newErrors.lastName = 'Last name is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const validateStepOne = () => {
        const newErrors: { [key: string]: string } = {};

        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        }
        if (!formData.password.trim()) {
            newErrors.password = 'Password is required';
        } else if (formData.password.length < 8) {
            newErrors.password = 'Password must be at least 8 characters';
        }
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

        if (!validateForm()) {
            return;
        }

        setLoading(true);
        try {
            const payload: CreateEmployeeData = {
                email: formData.email.trim(),
                password: formData.password,
                firstName: formData.firstName.trim(),
                lastName: formData.lastName.trim(),
            };

            if (formData.middleName.trim()) payload.middleName = formData.middleName.trim();
            if (formData.employeeCode.trim()) payload.employeeCode = formData.employeeCode.trim();
            if (formData.departmentId) payload.departmentId = formData.departmentId;
            if (formData.designationId) payload.designationId = formData.designationId;
            if (formData.workShiftId) payload.workShiftId = formData.workShiftId;
            if (formData.employmentType) payload.employmentType = formData.employmentType as CreateEmployeeData['employmentType'];
            if (formData.gender) payload.gender = formData.gender as CreateEmployeeData['gender'];
            if (formData.dateOfBirth) payload.dateOfBirth = formData.dateOfBirth;
            if (formData.joinDate) payload.joinDate = formData.joinDate;
            if (formData.probationEnd) payload.probationEnd = formData.probationEnd;
            if (formData.locationId.trim()) payload.locationId = formData.locationId.trim();
            if (formData.workEmail.trim()) payload.workEmail = formData.workEmail.trim();
            if (formData.personalEmail.trim()) payload.personalEmail = formData.personalEmail.trim();
            if (formData.phone.trim()) payload.phone = formData.phone.trim();
            if (formData.address.trim()) payload.address = formData.address.trim();
            if (formData.emergencyContactName.trim()) payload.emergencyContactName = formData.emergencyContactName.trim();
            if (formData.emergencyContactPhone.trim()) payload.emergencyContactPhone = formData.emergencyContactPhone.trim();
            if (formData.baseSalary) payload.baseSalary = Number(formData.baseSalary);
            if (formData.image) payload.image = formData.image;

            await employeeApi.createEmployee(payload);

            toast.success('Employee created successfully');
            onSuccess?.();
            handleClose();
        } catch (error: unknown) {
            console.error('Error creating employee:', error);
            const errorMessage =
                error instanceof Error ? error.message : 'Failed to create employee';
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (!loading) {
            setFormData({
                email: '',
                password: '',
                firstName: '',
                lastName: '',
                middleName: '',
                employeeCode: '',
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
                image: null,
            });
            if (imagePreview) {
                URL.revokeObjectURL(imagePreview);
            }
            setImagePreview(null);
            setErrors({});
            setStep(1);
            onClose();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent>
                <DialogHeader>
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <DialogTitle>Add Employee</DialogTitle>
                
                        </div>
                        <div className="text-xs text-gray-500">
                            Step {step} of 2
                        </div>
                    </div>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {step === 1 && (
                        <>
                    <div className="text-sm text-gray-600">
                        Personal Info
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                            <Label>
                                First Name <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                type="text"
                                name="firstName"
                                value={formData.firstName}
                                onChange={handleInputChange}
                                disabled={loading}
                                placeholder="John"
                            />
                            {errors.firstName && <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>}
                        </div>

                        <div>
                            <Label>
                                Middle Name
                            </Label>
                            <Input
                                type="text"
                                name="middleName"
                                value={formData.middleName}
                                onChange={handleInputChange}
                                disabled={loading}
                                placeholder="Michael"
                            />
                        </div>

                        <div>
                            <Label>
                                Last Name <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                type="text"
                                name="lastName"
                                value={formData.lastName}
                                onChange={handleInputChange}
                                disabled={loading}
                                placeholder="Doe"
                            />
                            {errors.lastName && <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <Label>
                                Email <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                disabled={loading}
                                placeholder="john.doe@example.com"
                            />
                            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                        </div>

                        <div>
                            <Label>
                                Password <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleInputChange}
                                disabled={loading}
                                placeholder="Minimum 8 characters"
                            />
                            {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <Label>Emergency Contact Name</Label>
                            <Input
                                type="text"
                                name="emergencyContactName"
                                value={formData.emergencyContactName}
                                onChange={handleInputChange}
                                disabled={loading}
                                placeholder="Jane Doe"
                            />
                        </div>
                        <div>
                            <Label>Emergency Contact Phone</Label>
                            <Input
                                type="text"
                                name="emergencyContactPhone"
                                value={formData.emergencyContactPhone}
                                onChange={handleInputChange}
                                disabled={loading}
                                placeholder="+1234567891"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <Label>Profile Image</Label>
                            <div className="flex items-center gap-4">
                                {imagePreview ? (
                                    <img
                                        src={imagePreview}
                                        alt="Profile preview"
                                        className="w-20 h-20 rounded-lg object-cover border border-gray-200"
                                    />
                                ) : (
                                    <div className="w-20 h-20 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 text-xs text-center leading-tight px-2">
                                        No image
                                    </div>
                                )}
                                <div className="flex-1">
                                    <Input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        disabled={loading}
                                    />
                                </div>
                            </div>
                            {errors.image && <p className="mt-1 text-sm text-red-600">{errors.image}</p>}
                        </div>
                    </div>
                        </>
                    )}

                    {step === 2 && (
                        <>
                    <div className="text-sm text-gray-600">
                        Company Info
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                            <Label>Employee Code</Label>
                            <Input
                                type="text"
                                name="employeeCode"
                                value={formData.employeeCode}
                                onChange={handleInputChange}
                                disabled={loading}
                                placeholder="EMP001"
                            />
                        </div>

                        <div>
                            <Label>Work Email</Label>
                            <Input
                                type="email"
                                name="workEmail"
                                value={formData.workEmail}
                                onChange={handleInputChange}
                                disabled={loading}
                                placeholder="john.doe@company.com"
                            />
                        </div>

                        <div>
                            <Label>Personal Email</Label>
                            <Input
                                type="email"
                                name="personalEmail"
                                value={formData.personalEmail}
                                onChange={handleInputChange}
                                disabled={loading}
                                placeholder="john.doe@gmail.com"
                            />
                        </div>
                    </div>
                    

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                            <Label>Phone</Label>
                            <Input
                                type="text"
                                name="phone"
                                value={formData.phone}
                                onChange={handleInputChange}
                                disabled={loading}
                                placeholder="+1234567890"
                            />
                        </div>
                        <div>
                            <Label>Address</Label>
                            <Input
                                type="text"
                                name="address"
                                value={formData.address}
                                onChange={handleInputChange}
                                disabled={loading}
                                placeholder="123 Main St"
                            />
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
                            <Label>Date of Birth</Label>
                            <Input
                                type="date"
                                name="dateOfBirth"
                                value={formData.dateOfBirth}
                                onChange={handleInputChange}
                                disabled={loading}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                            <Label>Join Date</Label>
                            <Input
                                type="date"
                                name="joinDate"
                                value={formData.joinDate}
                                onChange={handleInputChange}
                                disabled={loading}
                            />
                        </div>
                        <div>
                            <Label>Probation End</Label>
                            <Input
                                type="date"
                                name="probationEnd"
                                value={formData.probationEnd}
                                onChange={handleInputChange}
                                disabled={loading}
                            />
                        </div>
                        <div>
                            <Label>Location ID</Label>
                            <Input
                                type="text"
                                name="locationId"
                                value={formData.locationId}
                                onChange={handleInputChange}
                                disabled={loading}
                                placeholder="Location UUID"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <Label>Base Salary</Label>
                            <Input
                                type="number"
                                name="baseSalary"
                                value={formData.baseSalary}
                                onChange={handleInputChange}
                                disabled={loading}
                                placeholder="50000"
                            />
                        </div>
                    </div>
                        </>
                    )}

                    <div className="pt-6">
                        <DialogFooter>
                            <Button type="button" variant="cancel" onClick={handleClose} disabled={loading}>
                                Cancel
                            </Button>
                            {step === 1 ? (
                                <Button
                                    type="button"
                                    variant="blue"
                                    disabled={loading}
                                    onClick={() => {
                                        if (validateStepOne()) {
                                            setStep(2);
                                        }
                                    }}
                                >
                                    Next
                                </Button>
                            ) : (
                                <>
                                    <Button type="button" variant="outline" disabled={loading} onClick={() => setStep(1)}>
                                        Back
                                    </Button>
                                    <Button type="submit" variant="blue" disabled={loading}>
                                        {loading ? 'Creating...' : 'Create Employee'}
                                    </Button>
                                </>
                            )}
                        </DialogFooter>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
