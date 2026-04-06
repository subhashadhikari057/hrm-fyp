'use client';

import { useEffect, useState } from 'react';
import { BadgeDollarSign, Layers3, ShieldCheck, Users } from 'lucide-react';
import DashboardLayout from '../../../../components/DashboardLayout';
import { PageHeader } from '../../../../components/PageHeader';
import { Button } from '../../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import toast from 'react-hot-toast';
import { subscriptionApi, type SubscriptionPlan } from '../../../../lib/api/subscription';
import { CreateSubscriptionPlanModal } from '../../../../components/subscription/CreateSubscriptionPlanModal';

export default function SubscriptionPlansPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const loadPlans = async () => {
    setLoading(true);
    try {
      const response = await subscriptionApi.getPlans();
      setPlans(response.data || []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load plans');
      setPlans([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPlans();
  }, []);

  const stats = {
    totalPlans: plans.length,
    activePlans: plans.filter((plan) => plan.isActive).length,
    payrollEnabled: plans.filter((plan) => (plan.features || []).includes('payroll')).length,
    totalAssignments: plans.reduce((sum, plan) => sum + (plan._count?.companies || 0), 0),
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Subscription Plans"
          description="Define platform plans, company limits, and module access for each tenant."
          actions={<Button variant="blue" onClick={() => setCreateModalOpen(true)}>Create Plan</Button>}
        />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Total Plans</p>
                  <p className="mt-2 text-3xl font-semibold text-gray-900">{loading ? '...' : stats.totalPlans}</p>
                </div>
                <div className="rounded-xl bg-blue-50 p-3 text-blue-700">
                  <Layers3 className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Active Plans</p>
                  <p className="mt-2 text-3xl font-semibold text-gray-900">{loading ? '...' : stats.activePlans}</p>
                </div>
                <div className="rounded-xl bg-emerald-50 p-3 text-emerald-700">
                  <ShieldCheck className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Payroll Enabled</p>
                  <p className="mt-2 text-3xl font-semibold text-gray-900">{loading ? '...' : stats.payrollEnabled}</p>
                </div>
                <div className="rounded-xl bg-purple-50 p-3 text-purple-700">
                  <BadgeDollarSign className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Company Assignments</p>
                  <p className="mt-2 text-3xl font-semibold text-gray-900">{loading ? '...' : stats.totalAssignments}</p>
                </div>
                <div className="rounded-xl bg-amber-50 p-3 text-amber-700">
                  <Users className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Plan Definitions</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-8 text-sm text-gray-600">
                Loading plans...
              </div>
            ) : plans.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-sm text-gray-600">
                No subscription plans created yet.
              </div>
            ) : (
              <div className="grid gap-4 xl:grid-cols-2">
                {plans.map((plan) => (
                  <div key={plan.id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-base font-semibold text-gray-900">{plan.name}</h3>
                        <p className="mt-1 text-sm text-gray-600">{plan.code}</p>
                        {plan.description ? <p className="mt-2 text-sm text-gray-500">{plan.description}</p> : null}
                      </div>
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-medium ${plan.isActive ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-gray-300 bg-gray-100 text-gray-700'}`}>
                        {plan.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3 text-sm">
                      <div className="rounded-lg bg-gray-50 px-3 py-2">
                        <p className="text-xs text-gray-500">Monthly</p>
                        <p className="mt-1 font-semibold text-gray-900">NPR {plan.monthlyPrice}</p>
                      </div>
                      <div className="rounded-lg bg-gray-50 px-3 py-2">
                        <p className="text-xs text-gray-500">Yearly</p>
                        <p className="mt-1 font-semibold text-gray-900">NPR {plan.yearlyPrice ?? 0}</p>
                      </div>
                      <div className="rounded-lg bg-gray-50 px-3 py-2">
                        <p className="text-xs text-gray-500">Employee Limit</p>
                        <p className="mt-1 font-semibold text-gray-900">{plan.maxEmployees ?? 'Unlimited'}</p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2 text-xs text-gray-600">
                      {(plan.features || []).map((feature) => (
                        <span key={feature} className="rounded-full bg-blue-50 px-2.5 py-1 text-blue-700">
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <CreateSubscriptionPlanModal
          open={createModalOpen}
          onOpenChange={setCreateModalOpen}
          onSuccess={loadPlans}
        />
      </div>
    </DashboardLayout>
  );
}
