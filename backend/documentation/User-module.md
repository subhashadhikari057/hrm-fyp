# User Module

## Overview

The User module provides comprehensive user management functionality with role-based access control. It supports two distinct sets of endpoints: one for Super Admin (global access) and one for Company Admin (company-scoped access). All endpoints require authentication and proper authorization.

### Features

- ✅ Super Admin: Full user management across all companies
- ✅ Company Admin: Company-scoped user management
- ✅ User creation with role assignment
- ✅ User listing with filters and pagination
- ✅ User profile updates
- ✅ Password reset functionality
- ✅ Company-scoped access control
- ✅ Role-based restrictions

---

## Super Admin Endpoints

All Super Admin endpoints are prefixed with `/superadmin-users` and require `super_admin` role.

### 1. Create User

**POST** `/superadmin-users`

- **Description**: Creates a new user (can be assigned to any company or no company)
- **Access**: Super Admin only
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "SecurePassword123!",
    "fullName": "John Doe",
    "phone": "+1234567890",
    "role": "employee",
    "companyId": "company-uuid",
    "avatarUrl": "https://example.com/avatar.jpg",
    "isActive": true
  }
  ```
- **Response** (201 Created):
  ```json
  {
    "message": "User created successfully",
    "data": {
      "id": "uuid",
      "email": "user@example.com",
      "fullName": "John Doe",
      "phone": "+1234567890",
      "role": "employee",
      "companyId": "company-uuid",
      "avatarUrl": "https://example.com/avatar.jpg",
      "isActive": true,
      "lastLoginAt": null,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "company": {
        "id": "company-uuid",
        "name": "Acme Corporation",
        "code": "ACME001",
        "status": "active"
      }
    }
  }
  ```
- **Errors**:
  - `400 Bad Request`: Validation failed
  - `401 Unauthorized`: Not authenticated
  - `403 Forbidden`: Not Super Admin
  - `404 Not Found`: Company not found (if companyId provided)
  - `409 Conflict`: Email already exists

### 2. List All Users

**GET** `/superadmin-users`

- **Description**: Returns a paginated list of all users with optional filters
- **Access**: Super Admin only
- **Query Parameters**:
  - `role` (optional): Filter by user role (`super_admin`, `company_admin`, `hr_manager`, `manager`, `employee`)
  - `companyId` (optional): Filter by company ID
  - `isActive` (optional): Filter by active status (`true`/`false`)
  - `page` (optional): Page number (default: 1, minimum: 1)
  - `limit` (optional): Items per page (default: 10, minimum: 1, maximum: 100)
  - `sortBy` (optional): Sort field (`createdAt`, `email`, `fullName`, `lastLoginAt`, `updatedAt`, default: `createdAt`)
  - `sortOrder` (optional): Sort order (`asc`/`desc`, default: `desc`)
- **Response** (200 OK):
  ```json
  {
    "message": "Users retrieved successfully",
    "data": [
      {
        "id": "uuid",
        "email": "user@example.com",
        "fullName": "John Doe",
        "role": "employee",
        "companyId": "company-uuid",
        "isActive": true,
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "meta": {
      "total": 100,
      "page": 1,
      "limit": 10,
      "totalPages": 10,
      "hasNextPage": true,
      "hasPreviousPage": false
    }
  }
  ```
- **Example Request**:
  ```
  GET /superadmin-users?role=employee&isActive=true&page=1&limit=20&sortBy=createdAt&sortOrder=desc
  ```

### 3. Get User by ID

**GET** `/superadmin-users/:id`

- **Description**: Returns detailed information about a specific user
- **Access**: Super Admin only
- **Parameters**: `id` (UUID)
- **Response** (200 OK):
  ```json
  {
    "message": "User retrieved successfully",
    "data": {
      "id": "uuid",
      "email": "user@example.com",
      "fullName": "John Doe",
      "phone": "+1234567890",
      "role": "employee",
      "companyId": "company-uuid",
      "avatarUrl": "https://example.com/avatar.jpg",
      "isActive": true,
      "lastLoginAt": "2024-01-01T00:00:00.000Z",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "company": {
        "id": "company-uuid",
        "name": "Acme Corporation",
        "code": "ACME001",
        "status": "active"
      }
    }
  }
  ```
- **Errors**:
  - `404 Not Found`: User not found

### 4. Update User

**PATCH** `/superadmin-users/:id`

- **Description**: Updates user information (all fields except `companyId`)
- **Access**: Super Admin only
- **Parameters**: `id` (UUID)
- **Request Body** (all fields optional):
  ```json
  {
    "email": "newemail@example.com",
    "fullName": "John Doe Updated",
    "phone": "+9876543210",
    "role": "manager",
    "avatarUrl": "https://example.com/new-avatar.jpg",
    "isActive": false
  }
  ```
- **Response** (200 OK):
  ```json
  {
    "message": "User updated successfully",
    "data": {
      "id": "uuid",
      "email": "newemail@example.com",
      "fullName": "John Doe Updated",
      "role": "manager",
      "isActive": false,
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  }
  ```
- **Restrictions**:
  - Cannot update `companyId` (use company assignment separately if needed)
  - Cannot change role or deactivate the last super admin
- **Errors**:
  - `400 Bad Request`: Validation failed
  - `403 Forbidden`: Attempting to modify last super admin
  - `404 Not Found`: User not found
  - `409 Conflict`: Email already exists

### 5. Reset User Password

**POST** `/superadmin-users/:id/reset-password`

- **Description**: Generates a new random password for the user
- **Access**: Super Admin only
- **Parameters**: `id` (UUID)
- **Response** (200 OK):
  ```json
  {
    "message": "Password reset successfully",
    "newPassword": "Xk9#mP2$vL7@nQ4",
    "userId": "uuid",
    "email": "user@example.com"
  }
  ```
- **Features**:
  - Generates a secure 12-character random password
  - Password includes uppercase, lowercase, numbers, and symbols
  - New password is logged to backend terminal
  - User should change password on first login
- **Errors**:
  - `404 Not Found`: User not found

---

## Company Admin Endpoints

All Company Admin endpoints are prefixed with `/company/users` and require `company_admin` role. All operations are automatically scoped to the authenticated user's company.

### 1. Create Company User

**POST** `/company/users`

- **Description**: Creates a new user under your company (companyId auto-assigned from JWT token)
- **Access**: Company Admin only
- **Request Body**:
  ```json
  {
    "email": "employee@company.com",
    "password": "SecurePassword123!",
    "fullName": "Jane Smith",
    "phone": "+1234567890",
    "role": "employee",
    "avatarUrl": "https://example.com/avatar.jpg",
    "isActive": true
  }
  ```
- **Response** (201 Created):
  ```json
  {
    "message": "User created successfully",
    "data": {
      "id": "uuid",
      "email": "employee@company.com",
      "fullName": "Jane Smith",
      "phone": "+1234567890",
      "role": "employee",
      "companyId": "company-uuid",
      "avatarUrl": "https://example.com/avatar.jpg",
      "isActive": true,
      "lastLoginAt": null,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  }
  ```
- **Restrictions**:
  - `companyId` is automatically assigned from authenticated user's token (cannot be specified)
  - Only company-level roles allowed: `hr_manager`, `manager`, `employee` (cannot create `company_admin` or `super_admin`)
  - Cannot create users if company is suspended or archived
- **Errors**:
  - `400 Bad Request`: Validation failed or company is suspended/archived
  - `401 Unauthorized`: Not authenticated
  - `403 Forbidden`: Not Company Admin or company ID not found in token
  - `409 Conflict`: Email already exists

### 2. List Company Users

**GET** `/company/users`

- **Description**: Returns a paginated list of users from your company (auto-filtered by companyId)
- **Access**: Company Admin only
- **Query Parameters**:
  - `role` (optional): Filter by user role (`hr_manager`, `manager`, `employee`)
  - `isActive` (optional): Filter by active status (`true`/`false`)
  - `page` (optional): Page number (default: 1, minimum: 1)
  - `limit` (optional): Items per page (default: 10, minimum: 1, maximum: 100)
  - `sortBy` (optional): Sort field (`createdAt`, `email`, `fullName`, `lastLoginAt`, `updatedAt`, default: `createdAt`)
  - `sortOrder` (optional): Sort order (`asc`/`desc`, default: `desc`)
- **Response** (200 OK):
  ```json
  {
    "message": "Company users retrieved successfully",
    "data": [
      {
        "id": "uuid",
        "email": "employee@company.com",
        "fullName": "Jane Smith",
        "role": "employee",
        "companyId": "company-uuid",
        "isActive": true,
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "meta": {
      "total": 50,
      "page": 1,
      "limit": 10,
      "totalPages": 5,
      "hasNextPage": true,
      "hasPreviousPage": false
    }
  }
  ```
- **Features**:
  - Automatically filters by authenticated user's `companyId`
  - Only shows users from your company
  - Supports pagination and sorting

### 3. Update Company User

**PATCH** `/company/users/:id`

- **Description**: Updates user information in your company
- **Access**: Company Admin only
- **Parameters**: `id` (UUID)
- **Request Body** (all fields optional):
  ```json
  {
    "fullName": "Jane Smith Updated",
    "phone": "+9876543210",
    "role": "manager",
    "avatarUrl": "https://example.com/new-avatar.jpg",
    "isActive": false
  }
  ```
- **Response** (200 OK):
  ```json
  {
    "message": "User updated successfully",
    "data": {
      "id": "uuid",
      "email": "employee@company.com",
      "fullName": "Jane Smith Updated",
      "role": "manager",
      "isActive": false,
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  }
  ```
- **Restrictions**:
  - Cannot update `email` (email changes require Super Admin)
  - Cannot update `companyId` (user cannot be reassigned to another company)
  - Can only assign company-level roles: `hr_manager`, `manager`, `employee`
  - Can only update users from your own company (verified automatically)
- **Errors**:
  - `400 Bad Request`: Validation failed or invalid role
  - `403 Forbidden`: User does not belong to your company
  - `404 Not Found`: User not found

### 4. Reset Company User Password

**POST** `/company/users/:id/reset-password`

- **Description**: Generates a new random password for a user in your company
- **Access**: Company Admin only
- **Parameters**: `id` (UUID)
- **Response** (200 OK):
  ```json
  {
    "message": "Password reset successfully",
    "newPassword": "Xk9#mP2$vL7@nQ4",
    "userId": "uuid",
    "email": "employee@company.com"
  }
  ```
- **Features**:
  - Generates a secure 12-character random password
  - Password includes uppercase, lowercase, numbers, and symbols
  - New password is logged to backend terminal with company ID
  - User should change password on first login
  - Can only reset passwords for users from your own company
- **Errors**:
  - `403 Forbidden`: User does not belong to your company
  - `404 Not Found`: User not found

---

## User Roles

The system supports the following user roles:

### Platform-Level Roles

- **`super_admin`**: Platform administrator with global access (no company association)
  - Can manage all companies and users
  - Can access all Super Admin endpoints
  - `companyId` is `null`

### Company-Level Roles

- **`company_admin`**: Company administrator
  - Can manage users within their company
  - Can access Company Admin endpoints
  - Has `companyId` assigned

- **`hr_manager`**: HR Manager
  - Company-level user (can be managed by Company Admin)
  - Has `companyId` assigned

- **`manager`**: Department Manager
  - Company-level user (can be managed by Company Admin)
  - Has `companyId` assigned

- **`employee`**: Regular Employee
  - Company-level user (can be managed by Company Admin)
  - Has `companyId` assigned
  - Default role for new users

---

## Access Control

### Super Admin Endpoints

- **Route Prefix**: `/superadmin-users`
- **Required Role**: `super_admin`
- **Scope**: Global (all companies)
- **Features**:
  - Can create users for any company or no company
  - Can view and manage all users
  - Can update any user (except `companyId`)
  - Can reset any user's password
  - Protected from modifying last super admin

### Company Admin Endpoints

- **Route Prefix**: `/company/users`
- **Required Role**: `company_admin`
- **Scope**: Company-scoped (only their company)
- **Features**:
  - Can only create users for their own company
  - Can only view users from their company
  - Can only update users from their company
  - Can only reset passwords for users from their company
  - Cannot update user email or companyId
  - Cannot create `company_admin` or `super_admin` roles

---

## Password Reset

### How It Works

1. **Random Password Generation**:
   - Generates a 12-character secure password
   - Includes: uppercase, lowercase, numbers, symbols
   - Ensures at least one of each character type
   - Password is shuffled for randomness

2. **Password Storage**:
   - Password is hashed using bcrypt (10 salt rounds)
   - Original password is never stored

3. **Password Return**:
   - New password is returned in API response
   - Password is logged to backend terminal
   - User should change password on first login

### Security Notes

- Passwords are generated server-side (never client-side)
- Passwords are hashed before storage
- Original password is only shown once (in response and terminal log)
- Users should change password immediately after reset

---

## Filtering and Pagination

### Available Filters

**Super Admin Endpoints**:

- `role`: Filter by user role
- `companyId`: Filter by company
- `isActive`: Filter by active status

**Company Admin Endpoints**:

- `role`: Filter by user role (company-level roles only)
- `isActive`: Filter by active status
- `companyId`: Automatically filtered (cannot be changed)

### Pagination

All list endpoints support pagination:

- **`page`**: Page number (starts from 1, default: 1)
- **`limit`**: Items per page (default: 10, max: 100)
- **Response includes `meta`**:
  - `total`: Total number of items
  - `page`: Current page number
  - `limit`: Items per page
  - `totalPages`: Total number of pages
  - `hasNextPage`: Boolean indicating if next page exists
  - `hasPreviousPage`: Boolean indicating if previous page exists

### Sorting

- **`sortBy`**: Field to sort by (`createdAt`, `email`, `fullName`, `lastLoginAt`, `updatedAt`)
- **`sortOrder`**: Sort direction (`asc` or `desc`, default: `desc`)

---

## Response Format

All endpoints follow a consistent response envelope:

### Success Response

```json
{
  "message": "Operation message",
  "data": {
    /* response data */
  }
}
```

- **List endpoints**: `data` is an array, includes `meta` for pagination
- **Single resource endpoints**: `data` is an object
- **Password reset**: Returns `newPassword` in addition to `message`

### Error Response

```json
{
  "statusCode": 400,
  "message": "Error message",
  "error": "Error type"
}
```

---

## Data Models

### User Model

```typescript
{
  id: string (UUID)
  email: string (unique, required)
  password: string (hashed with bcrypt)
  fullName: string? (optional)
  phone: string? (optional, max 20 chars)
  avatarUrl: string? (optional)
  role: UserRole (required, default: 'employee')
  companyId: string? (optional, null for super_admin)
  isActive: boolean (default: true)
  lastLoginAt: Date? (optional)
  createdAt: Date
  updatedAt: Date
}
```

### UserRole Enum

```typescript
enum UserRole {
  super_admin      // Platform administrator
  company_admin    // Company administrator
  hr_manager       // HR Manager
  manager          // Department Manager
  employee         // Regular Employee
}
```

---

## Common Error Responses

### 400 Bad Request

```json
{
  "statusCode": 400,
  "message": ["field must be a valid email"],
  "error": "Bad Request"
}
```

### 401 Unauthorized

```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

### 403 Forbidden

```json
{
  "statusCode": 403,
  "message": "Forbidden resource",
  "error": "Forbidden"
}
```

**Common scenarios**:

- Not the required role (Super Admin or Company Admin)
- Attempting to access user from different company
- Attempting to modify last super admin

### 404 Not Found

```json
{
  "statusCode": 404,
  "message": "User with ID \"uuid\" not found",
  "error": "Not Found"
}
```

### 409 Conflict

```json
{
  "statusCode": 409,
  "message": "User with email \"user@example.com\" already exists",
  "error": "Conflict"
}
```

---

## Security Features

### Authentication

- All endpoints require JWT authentication
- Token stored in HttpOnly cookie
- Token includes user ID, email, role, and companyId

### Authorization

- Role-based access control (RBAC)
- Super Admin: Global access
- Company Admin: Company-scoped access

### Company Scoping

- Company Admin endpoints automatically filter by `companyId` from JWT
- Users can only access/modify users from their own company
- Verification happens on every operation

### Password Security

- Passwords hashed with bcrypt (10 salt rounds)
- Random password generation for resets
- Passwords never returned in user data

### Last Super Admin Protection

- Cannot change role of last super admin
- Cannot deactivate last super admin
- Ensures at least one active super admin exists

---

## Example Requests

### Super Admin - Create User

```bash
curl -X POST http://localhost:8080/superadmin-users \
  -H "Cookie: access_token=your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123!",
    "fullName": "John Doe",
    "role": "employee",
    "companyId": "company-uuid"
  }'
```

### Super Admin - List Users with Filters

```bash
curl -X GET "http://localhost:8080/superadmin-users?role=employee&isActive=true&page=1&limit=20" \
  -H "Cookie: access_token=your-jwt-token"
```

### Company Admin - Create User

```bash
curl -X POST http://localhost:8080/company/users \
  -H "Cookie: access_token=your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "employee@company.com",
    "password": "SecurePassword123!",
    "fullName": "Jane Smith",
    "role": "employee"
  }'
```

### Company Admin - Reset Password

```bash
curl -X POST http://localhost:8080/company/users/user-uuid/reset-password \
  -H "Cookie: access_token=your-jwt-token"
```

---

## Notes

- All timestamps are in ISO 8601 format (UTC)
- UUIDs are used for all entity IDs
- Passwords must be at least 8 characters long
- Email addresses must be unique across the system
- Company Admin cannot see or modify users from other companies
- Super Admin can manage users across all companies
- Password resets generate secure random passwords
- All responses use consistent `{ message, data }` format
- Pagination defaults: page 1, limit 10
- Sorting defaults: `createdAt` descending

---

## Swagger Documentation

Interactive API documentation is available at:

- **URL**: `http://localhost:8080/api`
- **Tags**:
  - `Super Admin - Users` (for Super Admin endpoints)
  - `Company Admin - Users` (for Company Admin endpoints)
- **Features**:
  - Test endpoints directly
  - View request/response schemas
  - Authentication via cookie
  - Filter and pagination examples
