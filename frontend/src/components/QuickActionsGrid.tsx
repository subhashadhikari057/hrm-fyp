'use client';

import { QuickActionButton, QuickActionButtonProps } from './QuickActionButton';

export interface QuickActionsGridProps {
  title?: string;
  actions: QuickActionButtonProps[];
  columns?: 2 | 3 | 4;
  className?: string;
}

export function QuickActionsGrid({
  title = 'Quick Actions',
  actions,
  columns = 3,
  className = '',
}: QuickActionsGridProps) {
  const gridCols = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={`bg-white rounded-lg shadow border border-gray-200 p-4 sm:p-5 lg:p-6 ${className}`}>
      {title && (
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-5">{title}</h3>
      )}
      <div className={`grid ${gridCols[columns]} gap-3 sm:gap-4`}>
        {actions.map((action, index) => (
          <QuickActionButton key={index} {...action} />
        ))}
      </div>
    </div>
  );
}

