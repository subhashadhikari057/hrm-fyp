'use client';

import React from 'react';

export interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  iconBgColor?: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'yellow' | 'indigo' | 'pink' | 'gray';
  trend?: {
    value: number;
    isPositive: boolean;
  };
  onClick?: () => void;
}

const iconBgColors = {
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
    <div
      onClick={onClick}
      className={`bg-white rounded-lg shadow p-4 sm:p-5 lg:p-6 border border-gray-200 h-full ${
        isClickable ? 'cursor-pointer hover:shadow-md transition-shadow' : ''
      }`}
    >
      <div className="flex items-center h-full gap-3 sm:gap-4">
        <div className={`p-2 sm:p-2.5 lg:p-3 rounded-lg flex-shrink-0 ${bgColorClass}`}>
          <div className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center [&>svg]:w-full [&>svg]:h-full">
            {icon}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-medium text-gray-600 truncate mb-0.5 sm:mb-1">{label}</p>
          <div className="flex items-baseline flex-wrap gap-1.5 sm:gap-2">
            <p className="text-xl sm:text-2xl lg:text-3xl font-semibold text-gray-900 truncate">{value}</p>
            {trend && (
              <span
                className={`text-xs sm:text-sm font-medium flex-shrink-0 whitespace-nowrap ${
                  trend.isPositive ? 'text-green-600' : 'text-red-600'
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
  );
}

