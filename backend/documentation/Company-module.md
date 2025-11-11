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
  [
    {
      "id": "uuid",
      "name": "Acme Corporation",
      "code": "ACME001",
      "logoUrl": "companies/logo-1234567890.jpg",
      "status": "active",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
  ```

#### 3. Get Company by ID

**GET** `/companies/:id`

- **Description**: Returns detailed information about a specific company
- **Access**: Super Admin only
- **Parameters**: `id` (UUID)
- **Response** (200 OK):
  ```json
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
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
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
    "company": {
      "id": "uuid",
      "name": "Acme Corporation",
      "status": "suspended",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  }
  ```
- **Errors**:
  - `400 Bad Request`: Invalid status value
  - `404 Not Found`: Company not found

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
    "company": {
      "id": "uuid",
      "name": "Acme Corporation Updated",
      "code": "ACME002",
      "logoUrl": "companies/new-logo-1234567890.jpg",
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
  - `404 Not Found`: Company not found
- **Note**:
  - Deletes company logo file from disk
  - Company users are not deleted (orphaned, can be reassigned)

### Company Status Values

- `active` - Company is operational
- `suspended` - Company temporarily disabled
- `archived` - Company permanently disabled

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

---

## Notes

- All timestamps are in ISO 8601 format (UTC)
- UUIDs are used for all entity IDs
- Passwords must be at least 8 characters long
- Company code can be used as a slug in frontend routing
- File uploads are stored locally (consider cloud storage for production)
- JWT tokens expire after 30 days (configurable)
