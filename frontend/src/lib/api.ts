/**
 * @deprecated This file is kept for backward compatibility.
 * Please use the modular API imports instead:
 * - import { authApi } from '../lib/api/auth'
 * - import { superadminApi } from '../lib/api/superadmin'
 * - import { companyApi } from '../lib/api/company'
 * - import { ... } from '../lib/api/types'
 * 
 * Or use the index file:
 * - import { authApi, superadminApi, companyApi } from '../lib/api'
 */

// Re-export everything from the new modular structure
export * from './api/types';
export * from './api/auth';
export * from './api/superadmin';
export * from './api/company';

// Backward compatibility exports
import { authApi } from './api/auth';
import { superadminApi } from './api/superadmin';
import { companyApi } from './api/company';

export const api = authApi;
export const userApi = superadminApi;
