# Department Module

## Overview

The Department module provides company-scoped department management functionality. Departments are organizational units within a company (e.g., "Human Resources", "Engineering", "Sales"). All endpoints require Company Admin or HR Manager authentication and are automatically scoped to the authenticated user's company.

### Features

- ✅ Create departments under your company
- ✅ List departments with filters and pagination
- ✅ Get department by ID
- ✅ Update department details
- ✅ Delete department
- ✅ Company-scoped access control
- ✅ Unique name and code per company

---

## Endpoints

All endpoints are prefixed with `/company/departments` and require `company_admin` or `hr_manager` role.

### 1. Create Department

**POST** `/company/departments`

- **Description**: Creates a new department under your company (companyId auto-assigned from JWT token)
- **Access**: Company Admin / HR Manager only
- **Request Body**:
  ```json
  {
    "name": "Human Resources",
    "code": "HR",
    "description": "Handles recruitment and employee relations",
    "isActive": true
  }
  ```
- **Response** (201 Created):
  ```json
  {
    "message": "Department created successfully",
    "data": {
      "id": "uuid",
      "name": "Human Resources",
      "code": "HR",
      "description": "Handles recruitment and employee relations",
      "isActive": true,
      "companyId": "company-uuid",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  }
  ```
- **Restrictions**:
  - `companyId` is automatically assigned from authenticated user's token
  - Department name must be unique within your company
  - Department code must be unique within your company (if provided)
  - Cannot create departments if company is suspended or archived
- **Errors**:
  - `400 Bad Request`: Validation failed or company is suspended/archived
  - `401 Unauthorized`: Not authenticated
  - `403 Forbidden`: Not Company Admin or HR Manager
  - `409 Conflict`: Department name or code already exists in your company

### 2. List Departments

**GET** `/company/departments`

- **Description**: Returns a paginated list of departments from your company (auto-filtered by companyId)
- **Access**: Company Admin / HR Manager only
- **Query Parameters**:
  - `isActive` (optional): Filter by active status (`true`/`false`)
  - `page` (optional): Page number (default: 1, minimum: 1)
  - `limit` (optional): Items per page (default: 10, minimum: 1, maximum: 100)
  - `sortBy` (optional): Sort field (`createdAt`, `name`, `code`, `updatedAt`, default: `createdAt`)
  - `sortOrder` (optional): Sort order (`asc`/`desc`, default: `desc`)
- **Response** (200 OK):
  ```json
  {
    "message": "Departments retrieved successfully",
    "data": [
      {
        "id": "uuid",
        "name": "Human Resources",
        "code": "HR",
        "description": "Handles recruitment and employee relations",
        "isActive": true,
        "companyId": "company-uuid",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "meta": {
      "total": 10,
      "page": 1,
      "limit": 10,
      "totalPages": 1,
      "hasNextPage": false,
      "hasPreviousPage": false
    }
  }
  ```
- **Features**:
  - Automatically filters by authenticated user's `companyId`
  - Only shows departments from your company
  - Supports pagination and sorting

### 3. Get Department by ID

**GET** `/company/departments/:id`

- **Description**: Returns detailed information about a specific department
- **Access**: Company Admin / HR Manager only
- **Parameters**: `id` (UUID)
- **Response** (200 OK):
  ```json
  {
    "message": "Department retrieved successfully",
    "data": {
      "id": "uuid",
      "name": "Human Resources",
      "code": "HR",
      "description": "Handles recruitment and employee relations",
      "isActive": true,
      "companyId": "company-uuid",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  }
  ```
- **Errors**:
  - `403 Forbidden`: Department does not belong to your company
  - `404 Not Found`: Department not found

### 4. Update Department

**PATCH** `/company/departments/:id`

- **Description**: Updates department information
- **Access**: Company Admin / HR Manager only
- **Parameters**: `id` (UUID)
- **Request Body** (all fields optional):
  ```json
  {
    "name": "Human Resources Updated",
    "code": "HR",
    "description": "Updated description",
    "isActive": false
  }
  ```
- **Response** (200 OK):
  ```json
  {
    "message": "Department updated successfully",
    "data": {
      "id": "uuid",
      "name": "Human Resources Updated",
      "code": "HR",
      "description": "Updated description",
      "isActive": false,
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  }
  ```
- **Restrictions**:
  - Can only update departments from your own company (verified automatically)
  - New name must be unique within your company (if changed)
  - New code must be unique within your company (if changed)
- **Errors**:
  - `400 Bad Request`: Validation failed
  - `403 Forbidden`: Department does not belong to your company
  - `404 Not Found`: Department not found
  - `409 Conflict`: Department name or code already exists in your company

### 5. Delete Department

**DELETE** `/company/departments/:id`

- **Description**: Deletes a department from your company
- **Access**: Company Admin / HR Manager only
- **Parameters**: `id` (UUID)
- **Response** (200 OK):
  ```json
  {
    "message": "Department deleted successfully"
  }
  ```
- **Restrictions**:
  - Can only delete departments from your own company (verified automatically)
- **Errors**:
  - `403 Forbidden`: Department does not belong to your company
  - `404 Not Found`: Department not found

---

## Access Control

### Authorization

- **Required Roles**: `company_admin` or `hr_manager`
- **Route Prefix**: `/company/departments`
- **Scope**: Company-scoped (only departments from your company)

### Company Scoping

- All operations automatically filter by `companyId` from JWT token
- Users can only access/modify departments from their own company
- Verification happens on every operation (create, read, update, delete)

---

## Data Model

### Department Model

```typescript
{
  id: string (UUID)
  companyId: string (required, foreign key to Company)
  name: string (required, max 100 chars, unique per company)
  code: string? (optional, max 20 chars, unique per company, uppercase alphanumeric)
  description: string? (optional)
  isActive: boolean (default: true)
  createdAt: Date
  updatedAt: Date
}
```

### Constraints

- **Unique Name**: Each company can only have one department with a given name
- **Unique Code**: Each company can only have one department with a given code (if provided)
- **Code Format**: Must be 2-20 uppercase alphanumeric characters (e.g., "HR", "DEV", "SALES01")

---

## Filtering and Pagination

### Available Filters

- `isActive`: Filter by active status (`true`/`false`)
- `companyId`: Automatically filtered (cannot be changed)

### Pagination

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

- **`sortBy`**: Field to sort by (`createdAt`, `name`, `code`, `updatedAt`)
- **`sortOrder`**: Sort direction (`asc` or `desc`, default: `desc`)

---

## Response Format

All endpoints follow a consistent response envelope:

### Success Response
```json
{
  "message": "Operation message",
  "data": { /* response data */ }
}
```

- **List endpoints**: `data` is an array, includes `meta` for pagination
- **Single resource endpoints**: `data` is an object
- **Delete endpoints**: Only return `message` (no `data` field)

### Error Response
```json
{
  "statusCode": 400,
  "message": "Error message",
  "error": "Error type"
}
```

---

## Common Error Responses

### 400 Bad Request

```json
{
  "statusCode": 400,
  "message": ["field must be a valid format"],
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
  "message": "You can only access departments from your own company",
  "error": "Forbidden"
}
```

### 404 Not Found

```json
{
  "statusCode": 404,
  "message": "Department with ID \"uuid\" not found",
  "error": "Not Found"
}
```

### 409 Conflict

```json
{
  "statusCode": 409,
  "message": "Department with name \"Human Resources\" already exists in your company",
  "error": "Conflict"
}
```

---

## Example Requests

### Create Department

```bash
curl -X POST http://localhost:8080/company/departments \
  -H "Cookie: access_token=your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Human Resources",
    "code": "HR",
    "description": "Handles recruitment and employee relations",
    "isActive": true
  }'
```

### List Departments with Filters

```bash
curl -X GET "http://localhost:8080/company/departments?isActive=true&page=1&limit=20&sortBy=name&sortOrder=asc" \
  -H "Cookie: access_token=your-jwt-token"
```

### Update Department

```bash
curl -X PATCH http://localhost:8080/company/departments/department-uuid \
  -H "Cookie: access_token=your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Human Resources Updated",
    "description": "Updated description"
  }'
```

### Delete Department

```bash
curl -X DELETE http://localhost:8080/company/departments/department-uuid \
  -H "Cookie: access_token=your-jwt-token"
```

---

## Notes

- All timestamps are in ISO 8601 format (UTC)
- UUIDs are used for all entity IDs
- Department name must be unique within your company
- Department code must be unique within your company (if provided)
- Code must be 2-20 uppercase alphanumeric characters
- Company Admin and HR Manager have the same access level
- All operations are automatically scoped to your company
- Cannot create departments if company is suspended or archived
- All responses use consistent `{ message, data }` format

---

## Swagger Documentation

Interactive API documentation is available at:

- **URL**: `http://localhost:8080/api`
- **Tag**: `Company Admin - Departments`
- **Features**:
  - Test endpoints directly
  - View request/response schemas
  - Authentication via cookie
  - Filter and pagination examples

