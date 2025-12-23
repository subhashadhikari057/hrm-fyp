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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-amber-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50 text-gray-900">
      <div className="relative isolate overflow-hidden">
        <div className="absolute -top-32 right-0 h-96 w-96 rounded-full bg-emerald-200/60 blur-[120px]" />
        <div className="absolute -bottom-32 left-0 h-96 w-96 rounded-full bg-amber-200/60 blur-[120px]" />
        <div className="absolute inset-0 opacity-[0.25] [background-image:radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:20px_20px]" />

        <div className="relative mx-auto flex min-h-screen max-w-6xl items-center px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid w-full grid-cols-1 gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="flex flex-col justify-center gap-6">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
                Human Resource Management
              </div>
              <div className="space-y-4">
                <h1 className="text-4xl font-semibold leading-tight text-gray-900 sm:text-5xl">
                  Run your workforce with clarity and speed.
                </h1>
                <p className="max-w-xl text-base text-gray-600 sm:text-lg">
                  Centralize people data, automate workflows, and keep teams aligned with a secure, modern dashboard.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                <div className="rounded-2xl border border-emerald-100 bg-white/80 p-4 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.2em] text-emerald-700">Clarity</p>
                  <p className="mt-2 text-lg font-semibold text-gray-900">People-first insights</p>
                </div>
                <div className="rounded-2xl border border-amber-100 bg-white/80 p-4 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.2em] text-amber-700">Confidence</p>
                  <p className="mt-2 text-lg font-semibold text-gray-900">Streamlined workflows</p>
                </div>
              </div>
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
