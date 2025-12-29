## Company Module

### Overview

The Company module manages multi-tenant company entities. It provides full CRUD operations for companies and handles transactional creation of companies with their first admin user. All endpoints require Super Admin authentication.

### Features

- ✅ Create company with first admin (transactional)
- ✅ List all companies
- ✅ Get company by ID
- ✅ Update company details
- ✅ Update company status
- ✅ Delete company
- ✅ Logo file upload (local storage)
- ✅ Automatic file cleanup on errors

### Endpoints

#### 1. Create Company with Admin

**POST** `/companies`

- **Description**: Creates a new company and its first company admin user in a single transaction
- **Access**: Super Admin only
- **Content-Type**: `multipart/form-data`
- **Request Body** (form data):
  ```
  companyName: "Acme Corporation" (required)
  companyCode: "ACME001" (optional, unique)
  adminEmail: "admin@acme.com" (required)
  adminPassword: "AdminPassword123!" (required, min 8 chars)
  adminFullName: "Jane Smith" (optional)
  industry: "Technology" (optional)
  address: "123 Main Street" (optional)
  city: "New York" (optional)
  country: "United States" (optional)
  planExpiresAt: "2025-12-31T23:59:59.000Z" (optional, ISO date)
  maxEmployees: 100 (optional, integer)
  logo: <file> (optional, image file)
  ```
- **Response** (201 Created):
  ```json
  {
    "message": "Company and admin created successfully",
    "data": {
      "company": {
        "id": "uuid",
        "name": "Acme Corporation",
        "code": "ACME001",
        "logoUrl": "companies/logo-1234567890.jpg",
        "industry": "Technology",
        "address": "123 Main Street",
        "city": "New York",
        "country": "United States",
        "planExpiresAt": "2025-12-31T23:59:59.000Z",
        "maxEmployees": 100,
        "status": "active",
        "createdAt": "2024-01-01T00:00:00.000Z"
      },
      "admin": {
        "id": "uuid",
        "email": "admin@acme.com",
        "fullName": "Jane Smith",
        "role": "company_admin",
        "companyId": "company-uuid",
        "isActive": true
      }
    }
  }
  ```
- **Errors**:
  - `400 Bad Request`: Validation failed
  - `401 Unauthorized`: Not authenticated
  - `403 Forbidden`: Not Super Admin
  - `409 Conflict`: Company name, code, or admin email already exists
- **File Upload**:
  - Allowed types: JPEG, JPG, PNG, GIF, WEBP
  - Max size: 5 MB
  - Stored in: `uploads/companies/`
  - Auto-deleted if transaction fails

#### 2. List All Companies

**GET** `/companies`

- **Description**: Returns a list of all companies
- **Access**: Super Admin only
- **Response** (200 OK):
  ```json
  {
    "message": "Companies retrieved successfully",
    "data": [
      {
        "id": "uuid",
        "name": "Acme Corporation",
        "code": "ACME001",
        "logoUrl": "companies/logo-1234567890.jpg",
        "industry": "Technology",
        "address": "123 Main Street",
        "city": "New York",
        "country": "United States",
        "planExpiresAt": "2025-12-31T23:59:59.000Z",
        "maxEmployees": 100,
        "status": "active",
        "userCount": 5,
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    ]
  }
  ```

#### 3. Get Company by ID

**GET** `/companies/:id`

- **Description**: Returns detailed information about a specific company
- **Access**: Super Admin only
- **Parameters**: `id` (UUID)
- **Response** (200 OK):
  ```json
  {
    "message": "Company retrieved successfully",
    "data": {
      "id": "uuid",
      "name": "Acme Corporation",
      "code": "ACME001",
      "logoUrl": "companies/logo-1234567890.jpg",
      "industry": "Technology",
      "address": "123 Main Street",
      "city": "New York",
      "country": "United States",
      "planExpiresAt": "2025-12-31T23:59:59.000Z",
      "maxEmployees": 100,
      "status": "active",
      "userCount": 5,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  }
  ```
- **Errors**:
  - `404 Not Found`: Company not found

#### 4. Update Company Status

**PATCH** `/companies/:id/status`

- **Description**: Updates only the status of a company
- **Access**: Super Admin only
- **Parameters**: `id` (UUID)
- **Request Body**:
  ```json
  {
    "status": "suspended" // "active" | "suspended" | "archived"
  }
  ```
- **Response** (200 OK):
  ```json
  {
    "message": "Company status updated successfully",
    "data": {
      "id": "uuid",
      "name": "Acme Corporation",
      "code": "ACME001",
      "status": "suspended",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  }
  ```
- **Errors**:
  - `400 Bad Request`: Invalid status value
  - `404 Not Found`: Company not found
- **Status Impact**:
  - Changing status to `suspended` or `archived` immediately blocks all company users from:
    - Logging in (new login attempts)
    - Accessing protected endpoints (existing sessions blocked on next request)
    - Changing passwords
  - Changing status back to `active` restores access for all company users

#### 5. Update Company Details

**PATCH** `/companies/:id`

- **Description**: Updates company information (all fields optional)
- **Access**: Super Admin only
- **Content-Type**: `multipart/form-data`
- **Parameters**: `id` (UUID)
- **Request Body** (form data, all optional):
  ```
  name: "Acme Corporation Updated"
  code: "ACME002"
  industry: "Technology"
  address: "456 New Street"
  city: "Los Angeles"
  country: "United States"
  planExpiresAt: "2026-12-31T23:59:59.000Z"
  maxEmployees: 200
  logo: <file> (optional, replaces existing logo)
  ```
- **Response** (200 OK):
  ```json
  {
    "message": "Company updated successfully",
    "data": {
      "id": "uuid",
      "name": "Acme Corporation Updated",
      "code": "ACME002",
      "logoUrl": "companies/new-logo-1234567890.jpg",
      "industry": "Technology",
      "address": "456 New Street",
      "city": "Los Angeles",
      "country": "United States",
      "planExpiresAt": "2026-12-31T23:59:59.000Z",
      "maxEmployees": 200,
      "status": "active",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  }
  ```
- **File Upload**:
  - If new logo provided, old logo is automatically deleted
  - Same validation rules as create endpoint
- **Errors**:
  - `400 Bad Request`: Validation failed
  - `404 Not Found`: Company not found
  - `409 Conflict`: Company code already exists

#### 6. Delete Company

**DELETE** `/companies/:id`

- **Description**: Deletes a company and its associated logo file
- **Access**: Super Admin only
- **Parameters**: `id` (UUID)
- **Response** (200 OK):
  ```json
  {
    "message": "Company deleted successfully"
  }
  ```
- **Errors**:
  - `400 Bad Request`: Company has users associated (cannot delete)
  - `404 Not Found`: Company not found
- **Note**:
  - Deletes company logo file from disk
  - **Data Integrity**: Company can only be deleted if it has no associated users
  - If users exist, the API returns a `400 Bad Request` with a message indicating the number of users
  - To delete a company with users, first remove all users or archive the company instead

### Company Status Values

- `active` - Company is operational
  - Users can log in and access the system normally
  - All company-level users have full access
- `suspended` - Company temporarily disabled
  - **Access Control**: Users from this company **cannot log in**
  - **Existing Sessions**: Blocked on next API request
  - **Password Changes**: Blocked for all company users
  - **Error Message**: "Your company account has been suspended. Please contact support."
  - **Reactivation**: Can be changed back to `active` by Super Admin
  - **Use Case**: Payment issues, temporary violations, maintenance
- `archived` - Company permanently disabled
  - **Access Control**: Users from this company **cannot log in**
  - **Existing Sessions**: Blocked on next API request
  - **Password Changes**: Blocked for all company users
  - **Error Message**: "Your company account has been archived."
  - **Reactivation**: Can be changed back to `active` by Super Admin (if needed)
  - **Use Case**: Company closure, permanent termination

**Important Notes**:

- Super Admin users are **not affected** by company status (they have no `companyId`)
- Status changes take effect immediately for login attempts
- Existing JWT tokens are invalidated on next API request when company status changes
- Super Admin can change company status to any value (`active`, `suspended`, `archived`)

### File Upload Details

**Storage Location**: `uploads/companies/`
**Access URL**: `http://localhost:8080/uploads/companies/{filename}`

**Validation Rules**:

- **Allowed MIME Types**: `image/jpeg`, `image/jpg`, `image/png`, `image/gif`, `image/webp`
- **Max File Size**: 5 MB
- **File Naming**: `logo-{timestamp}-{random}.{ext}`

**Error Handling**:

- Files are automatically deleted if:
  - Validation fails (duplicate name/email/code)
  - Transaction fails
  - Update operation fails

### Transactional Operations

The `createCompanyWithAdmin` endpoint uses Prisma transactions to ensure:

- Company and admin user are created atomically
- If either creation fails, both are rolled back
- File uploads are cleaned up on failure

### Data Models

**Company Model**:

```typescript
{
  id: string (UUID)
  name: string (max 150 chars, required)
  code: string? (unique, optional) // Can be used as slug
  logoUrl: string? (optional)
  industry: string? (optional)
  address: string? (optional)
  city: string? (optional)
  country: string? (optional)
  planExpiresAt: Date? (optional)
  maxEmployees: number? (optional)
  status: 'active' | 'suspended' | 'archived' (default: 'active')
  createdAt: Date
  updatedAt: Date
}
```

### Access Control

All company endpoints require:

1. **Authentication**: Valid JWT token in cookie
2. **Authorization**: `super_admin` role only

**Example Request**:

```bash
curl -X GET http://localhost:8080/companies \
  -H "Cookie: access_token=your-jwt-token"
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

### 404 Not Found

```json
{
  "statusCode": 404,
  "message": "Company not found",
  "error": "Not Found"
}
```

### 409 Conflict

```json
{
  "statusCode": 409,
  "message": "Company with name \"Acme Corporation\" already exists",
  "error": "Conflict"
}
```

### 400 Bad Request (Delete with Users)

```json
{
  "statusCode": 400,
  "message": "Cannot delete company. It has 5 user(s) associated. Please remove all users first or archive the company instead.",
  "error": "Bad Request"
}
```

### 401 Unauthorized (Company Suspended)

```json
{
  "statusCode": 401,
  "message": "Your company account has been suspended. Please contact support.",
  "error": "Unauthorized"
}
```

### 401 Unauthorized (Company Archived)

```json
{
  "statusCode": 401,
  "message": "Your company account has been archived.",
  "error": "Unauthorized"
}
```

**Note**: These errors occur when:

- User attempts to log in from a suspended/archived company
- User with existing session tries to access API (company status changed after login)
- User attempts to change password from a suspended/archived company

---

## Environment Variables

Required environment variables in `.env`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/hrmfyp"
PORT=8080
JWT_SECRET="your-secret-key-change-in-production"
JWT_EXPIRES_IN="30d"
NODE_ENV="development" # or "production"
```

---

## Swagger Documentation

Interactive API documentation is available at:

- **URL**: `http://localhost:8080/api`
- **Features**:
  - Test endpoints directly
  - View request/response schemas
  - Authentication via cookie
  - DTO classes referenced for better maintainability
  - Multipart/form-data endpoints include both DTO type reference and inline schema

---

## Response Format

All endpoints follow a consistent response envelope:

```json
{
  "message": "Operation message",
  "data": {
    /* response data */
  }
}
```

- **Success responses**: Always include `message` and `data` fields
- **Error responses**: Follow NestJS standard format with `statusCode`, `message`, and `error` fields
- **List endpoints**: `data` is an array
- **Single resource endpoints**: `data` is an object
- **Delete endpoints**: Only return `message` (no `data` field)

## Company Status Enforcement

When a company's status is changed to `suspended` or `archived`, the following access restrictions are automatically enforced:

### Login Restrictions

- Users from suspended/archived companies **cannot log in**
- Login attempts return `401 Unauthorized` with appropriate error message
- Only applies to company-level users (not `super_admin`)

### Session Invalidation

- Existing JWT tokens are validated on each API request
- If company status changes to `suspended` or `archived`, existing sessions are blocked
- Users receive `401 Unauthorized` on their next API call

### Password Changes

- Users from suspended/archived companies **cannot change their password**
- Password change attempts return `401 Unauthorized` with company status error

### Implementation Details

- Status checks occur in:
  - `POST /auth/login` - Blocks login for suspended/archived companies
  - JWT Strategy validation - Blocks API access for existing sessions
  - `PATCH /auth/change-password` - Blocks password changes
- Super Admin users are exempt (no `companyId` association)
- Status changes take effect immediately

## Notes

- All timestamps are in ISO 8601 format (UTC)
- UUIDs are used for all entity IDs
- Passwords must be at least 8 characters long
- Company code can be used as a slug in frontend routing
- File uploads are stored locally (consider cloud storage for production)
- JWT tokens expire after 30 days (configurable)
- **Data Integrity**: Companies with associated users cannot be deleted
- All responses use consistent `{ message, data }` format for better API predictability
- **Company Status**: Suspended and archived companies block all user access automatically
