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

// Backward compatibility aliases
export { authApi as api } from './auth';
export { superadminApi as userApi } from './superadmin';

