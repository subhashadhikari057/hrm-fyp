# Backend Integration Guide

This guide explains how to integrate the frontend login system with your NestJS backend.

## Current Implementation

The login system currently uses **dummy authentication** for development purposes. Users can select their role and login without actual backend validation.

## Integration Steps

### 1. Update Environment Variables

Create a `.env.local` file in the `frontend` directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

Replace `3000` with your backend port if different.

### 2. Update AuthContext

In `src/contexts/AuthContext.tsx`, uncomment the backend integration code:

1. Uncomment the import:
```typescript
import { api } from '../lib/api';
```

2. Replace the `login` function with the commented backend integration code.

3. Update the `logout` function to call the backend API.

### 3. Update LoginForm (Optional)

Currently, the login form includes role selection for dummy login. When integrating with backend:

- Remove the role selection UI
- The role will be determined by the backend response
- Update the `login` function call to only pass `email` and `password`

### 4. Backend API Endpoints Expected

The frontend expects the following backend endpoints:

#### POST `/api/auth/login`
**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "role": "employee",
    "name": "User Name"
  },
  "token": "jwt-token-here"
}
```

#### POST `/api/auth/logout`
**Headers:**
```
Authorization: Bearer <token>
```

#### GET `/api/auth/me`
**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "id": "user-id",
  "email": "user@example.com",
  "role": "employee",
  "name": "User Name"
}
```

### 5. Role-Based Routing

The system automatically redirects users to their respective dashboards based on role:

- `superadmin` → `/dashboard/superadmin`
- `companyadmin` → `/dashboard/companyadmin`
- `hrmanager` → `/dashboard/hrmanager`
- `employee` → `/dashboard/employee`

### 6. Protected Routes

All dashboard routes are protected by the `DashboardLayout` component, which:
- Checks for authenticated user
- Redirects to login if not authenticated
- Shows loading state during authentication check

### 7. Token Management

After successful login:
- JWT token is stored in `localStorage` as `token`
- Token is automatically included in API requests via `getAuthHeaders()`
- Token is cleared on logout

## Testing

1. Start the frontend: `npm run dev`
2. Start your backend server
3. Test login with valid credentials
4. Verify role-based redirects work correctly
5. Test logout functionality

## Notes

- The dummy login system will continue to work until you uncomment the backend integration code
- All API calls are defined in `src/lib/api.ts` for easy modification
- Error handling should be added to the LoginForm component for production use

