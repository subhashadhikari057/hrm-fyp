# Refresh Token Authentication (Access + Refresh Cookies)

This document explains the access/refresh token setup (no rotation), the database changes, environment variables, and how the frontend auto-refreshes access tokens.

## Summary

- Access token: short-lived JWT, stored in `access_token` HttpOnly cookie.
- Refresh token: long-lived JWT, stored in `refresh_token` HttpOnly cookie.
- Refresh token is hashed and stored in DB for revocation.
- When access expires, the frontend calls `/auth/refresh` and retries the request.

## Scope of Changes

Backend:
- Added `RefreshToken` model/table.
- `POST /auth/login` now issues access + refresh tokens and sets both cookies.
- `POST /auth/refresh` issues a new access token from refresh cookie.
- `POST /auth/logout` revokes refresh token and clears both cookies.
- JWT strategy uses `ACCESS_TOKEN_SECRET` when provided.

Frontend:
- All API calls go through `apiFetch` (401 -> refresh -> retry).
- Auth state relies on cookies (no access token stored in localStorage).
- `AuthContext` uses `/auth/me` to bootstrap user state.
- Login/Logout use cookie-based endpoints only.

## Data Model

New Prisma model:

```
model RefreshToken {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  tokenHash String
  expiresAt DateTime
  revokedAt DateTime?
  createdAt DateTime @default(now())
}
```

Storage rules:
- Raw refresh token lives only in the HttpOnly cookie.
- DB stores only a hash (for revocation + validation).

## Environment Variables

Backend (.env):

```
ACCESS_TOKEN_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=30d
ACCESS_TOKEN_SECRET=your_access_secret
REFRESH_TOKEN_SECRET=your_refresh_secret
AUTH_COOKIE_SECURE=false
AUTH_COOKIE_SAMESITE=lax
AUTH_COOKIE_DOMAIN=
```

Frontend (.env):

```
NEXT_PUBLIC_API_URL=http://localhost:8080
```

If frontend and backend are on different domains, set:

```
AUTH_COOKIE_SECURE=true
AUTH_COOKIE_SAMESITE=none
AUTH_COOKIE_DOMAIN=yourdomain.com
```

### Meaning

- `ACCESS_TOKEN_EXPIRES_IN`
  - Access token lifetime (examples: `15m`, `1h`, `1d`).
- `REFRESH_TOKEN_EXPIRES_IN`
  - Refresh token lifetime (examples: `30d`).
- `ACCESS_TOKEN_SECRET`
  - Secret used to sign access tokens.
- `REFRESH_TOKEN_SECRET`
  - Secret used to sign refresh tokens.
- `AUTH_COOKIE_SECURE`
  - `true` for HTTPS only (production); `false` for local.
- `AUTH_COOKIE_SAMESITE`
  - `lax` recommended for same-site; use `none` if frontend/backend are on different domains with HTTPS.
- `AUTH_COOKIE_DOMAIN`
  - Optional cookie domain if you need subdomain sharing.

## Cookie Behavior

On login:
- `access_token`: expires per `ACCESS_TOKEN_EXPIRES_IN`.
- `refresh_token`: expires per `REFRESH_TOKEN_EXPIRES_IN`.

On logout:
- Both cookies are cleared.

## Endpoints

- `POST /auth/login`
  - Sets both cookies, returns user info.
- `POST /auth/refresh`
  - Requires `refresh_token` cookie, sets new `access_token`.
- `POST /auth/logout`
  - Revokes refresh token and clears cookies.
- `GET /auth/me`
  - Uses `access_token` cookie to return current user.

## Refresh Flow

1) Login:
   - Access + refresh tokens issued.
   - Refresh token hash stored in DB.

2) Normal API request:
   - `access_token` authenticates request.

3) Access expires:
   - API returns 401.
   - Frontend `apiFetch` calls `/auth/refresh`.
   - New access token is set in cookie.
   - Original request is retried.

4) Logout:
   - Refresh token revoked and cookies cleared.

## Migration

Run migration after adding `RefreshToken`:

```
npx prisma migrate dev -n add_refresh_tokens
```

## Observability

Backend log:
- `/auth/refresh` logs: `Refresh token request received`

Browser check:
- Cookies update after refresh (`access_token` expiry changes).

## Frontend Integration Details

### 1) Shared API wrapper

Location:
- `frontend/src/lib/api/types.ts`

Behavior:
- `apiFetch` wraps `fetch` and retries once after a 401.
- It calls `/auth/refresh` in a single-flight manner (only one refresh runs at a time).
- Requests to `/auth/login`, `/auth/logout`, `/auth/refresh` are excluded from retry.

Pseudo-flow:

```
response = fetch(request)
if response.status !== 401 -> return response
if request is auth endpoint -> return response
call /auth/refresh
if refresh ok -> retry original request
else -> return 401
```

### 2) API modules use apiFetch

All API modules under `frontend/src/lib/api/` call `apiFetch` instead of `fetch`, so refresh happens automatically.

### 3) AuthContext

Location:
- `frontend/src/contexts/AuthContext.tsx`

Behavior:
- On mount, calls `authApi.getCurrentUser()` to hydrate user state.
- On login, calls `authApi.login()`.
- On logout, calls `authApi.logout()` and clears user state.
- No access token is stored in localStorage or memory; cookies are the source of truth.

### 4) Login flow

Locations:
- `frontend/src/components/LoginForm.tsx`
- `frontend/src/lib/api/auth.ts`

Flow:
1. Submit credentials to `/auth/login`.
2. Backend sets cookies.
3. Frontend receives user payload and updates state.

### 5) Logout flow

Locations:
- `frontend/src/contexts/AuthContext.tsx`
- `frontend/src/lib/api/auth.ts`

Flow:
1. Call `/auth/logout` (clears cookies).
2. Clear frontend user state.
3. Redirect to login page.

## Frontend Verification Checklist

- Login response returns user data and sets cookies.
- Expired access token triggers `/auth/refresh` automatically.
- API calls still succeed after refresh.
- Logout clears cookies and app redirects to login.

## Verification Checklist

- Login sets `access_token` and `refresh_token` cookies.
- `/auth/me` works with valid access cookie.
- Expire access token -> request triggers refresh -> request succeeds.
- Logout clears both cookies and revokes refresh token.
- Refresh after logout fails with 401.

## Notes / Best Practices

- Refresh token is stored in DB (hashed) for revocation.
- No rotation: refresh token stays valid until it expires or is revoked.
- Access token is stateless and not stored in DB.
