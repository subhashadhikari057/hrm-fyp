'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    
    // Basic validation
    if (!email.trim()) {
      setError('Email is required');
      setIsLoading(false);
      return;
    }

    if (!password.trim()) {
      setError('Password is required');
      setIsLoading(false);
      return;
    }

    try {
      const user = await login(email.trim(), password);
      // Show welcome toast with user's name
      const userName = user.name || user.email.split('@')[0];
      toast.success(`Welcome back, ${userName}!`);
      
      // Small delay to show toast before redirect
      setTimeout(() => {
        // Get dashboard route based on role
        const roleRoutes: Record<string, string> = {
          superadmin: '/dashboard/superadmin',
          companyadmin: '/dashboard/companyadmin',
          hrmanager: '/dashboard/hrmanager',
          employee: '/dashboard/employee',
        };
        const dashboardRoute = roleRoutes[user.role] || '/dashboard/employee';
        router.push(dashboardRoute);
      }, 800);
    } catch (error) {
      // Handle error from backend
      const errorMessage = error instanceof Error ? error.message : 'Login failed. Please check your credentials.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      <div className="space-y-4 text-left">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">
            K
          </span>
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-blue-600">
            Karyasetu
          </span>
        </div>
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-[34px]">
            Welcome back
          </h2>
          <p className="mt-2 text-sm text-gray-600 sm:text-base">
            Sign in to continue to your workspace
          </p>
        </div>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit}>
        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <Label htmlFor="email" className="text-xs font-medium text-gray-600">
              Email address
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError(null); // Clear error when user types
              }}
              placeholder="Enter your email"
              className="h-11"
              disabled={isLoading}
            />
          </div>

          <div>
            <Label htmlFor="password" className="text-xs font-medium text-gray-600">
              Password
            </Label>
            <div className="relative mt-1">
              <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(null); // Clear error when user types
                }}
                className="h-11 pr-12"
                placeholder="Enter your password"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                disabled={isLoading}
              >
                {showPassword ? (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 3l18 18M10.477 10.463a3 3 0 104.243 4.243M9.88 9.88A3 3 0 0112 9c1.657 0 3 1.343 3 3 0 .52-.132 1.01-.364 1.438M6.228 6.228C4.594 7.518 3.35 9.092 2.75 10c1.5 2.25 4.75 5.25 9.25 5.25 1.32 0 2.53-.246 3.61-.64M9.5 5.12A9.47 9.47 0 0112 4.75c4.5 0 7.75 3 9.25 5.25-.44.66-1.21 1.7-2.29 2.72"
                    />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.75 12c1.5-2.25 4.75-5.25 9.25-5.25s7.75 3 9.25 5.25c-1.5 2.25-4.75 5.25-9.25 5.25S4.25 14.25 2.75 12z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9a3 3 0 100 6 3 3 0 000-6z"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-gray-600">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            Remember me
          </label>
          <a href="/forgot-password" className="font-medium text-blue-600 hover:text-blue-700">
            Forgot password?
          </a>
        </div>

        <div>
          <Button
            type="submit"
            disabled={isLoading}
            variant="blue"
            size="lg"
            className="w-full h-12"
          >
            {isLoading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Signing in...
              </span>
            ) : (
              'Sign in'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
