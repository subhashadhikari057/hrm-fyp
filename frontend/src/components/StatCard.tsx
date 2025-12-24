'use client';

import React from 'react';
import { Card, CardContent } from './ui/card';

export interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  iconBgColor?:
    | 'blue'
    | 'green'
    | 'purple'
    | 'orange'
    | 'red'
    | 'yellow'
    | 'indigo'
    | 'pink'
    | 'gray';
  trend?: {
    value: number;
    isPositive: boolean;
  };
  onClick?: () => void;
}

const iconBgColors: Record<NonNullable<StatCardProps['iconBgColor']>, string> = {
  blue: 'bg-blue-100 text-blue-600',
  green: 'bg-green-100 text-green-600',
  purple: 'bg-purple-100 text-purple-600',
  orange: 'bg-orange-100 text-orange-600',
  red: 'bg-red-100 text-red-600',
  yellow: 'bg-yellow-100 text-yellow-600',
  indigo: 'bg-indigo-100 text-indigo-600',
  pink: 'bg-pink-100 text-pink-600',
  gray: 'bg-gray-100 text-gray-600',
};

export function StatCard({
  label,
  value,
  icon,
  iconBgColor = 'blue',
  trend,
  onClick,
}: StatCardProps) {
  const bgColorClass = iconBgColors[iconBgColor];
  const isClickable = !!onClick;

  return (
    <Card
      onClick={onClick}
      className={`h-full border border-slate-200 bg-white shadow-none ${
        isClickable ? 'cursor-pointer hover:border-slate-300 transition-colors' : ''
      }`}
    >
      <CardContent className="px-4 py-2 sm:px-5 sm:py-2.5">
        <div className="flex items-center gap-2">
          <div className={`rounded-md p-1.5 ${bgColorClass}`}>
            <div className="w-4 h-4 flex items-center justify-center [&>svg]:w-full [&>svg]:h-full">
              {icon}
            </div>
          </div>

          <div className="min-w-0">
            <div className="flex flex-col justify-center leading-none">
              <p className="text-sm text-slate-500 truncate">{label}</p>

              <div className="mt-1 flex items-center gap-1">
                <p className="text-xl font-semibold text-slate-900">{value}</p>

                {trend && (
                  <span
                    className={`text-xs font-semibold ${
                      trend.isPositive ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {trend.isPositive ? '+' : ''}
                    {trend.value}%
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}