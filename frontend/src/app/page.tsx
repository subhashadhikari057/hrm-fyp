'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LoginForm from '../components/LoginForm';
import { useAuth } from '../contexts/AuthContext';
import { getDashboardRoute } from '../lib/api/types';

export default function LoginPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Redirect to dashboard if already logged in
    if (!isLoading && user) {
      const dashboardRoute = getDashboardRoute(user.role);
      router.replace(dashboardRoute);
    }
  }, [user, isLoading, router]);

  // Show loading state or nothing while checking auth
  if (isLoading || user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-sky-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-sky-50 text-gray-900">
      <div className="relative isolate overflow-hidden">
        <div className="absolute -top-32 right-0 h-96 w-96 rounded-full bg-blue-200/60 blur-[120px]" />
        <div className="absolute -bottom-32 left-0 h-96 w-96 rounded-full bg-sky-200/60 blur-[120px]" />
        <div className="absolute inset-0 opacity-[0.25] [background-image:radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:20px_20px]" />

        <div className="relative mx-auto flex min-h-screen max-w-6xl items-center px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid w-full grid-cols-1 gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="flex items-center justify-center">
              <img
                src="/loginimage.jpg"
                alt="Login illustration"
                className="w-full max-w-2xl object-contain"
              />
            </div>

            <div className="flex items-center justify-center">
              <div className="w-full max-w-md rounded-3xl border border-white/70 bg-white p-8 text-gray-900 shadow-2xl sm:p-10">
                <LoginForm />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
