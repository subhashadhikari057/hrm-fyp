/**
 * Main API export file
 * Re-exports all API modules for convenient importing
 * 
 * Usage:
 * import { authApi, superadminApi, companyApi } from '../lib/api';
 * import type { BackendUserRole, User } from '../lib/api';
 */

export * from './types';
export * from './auth';
export * from './superadmin';
export * from './company';
export { departmentApi } from './department';
export { designationApi } from './designation';
export { employeeApi } from './employee';
export { workShiftApi } from './workshift';
export { statsApi } from './stats';
export { attendanceApi } from './attendance';

// Backward compatibility aliases
export { authApi as api } from './auth';
export { superadminApi as userApi } from './superadmin';

