'use client';

import { QuickActionButton, QuickActionButtonProps } from './QuickActionButton';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

export interface QuickActionsGridProps {
  title?: string;
  actions: QuickActionButtonProps[];
  columns?: 2 | 3 | 4;
}

export function QuickActionsGrid({
  title = 'Quick Actions',
  actions,
  columns = 3,
}: QuickActionsGridProps) {
  const gridCols = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <Card>
      {title && (
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent>
        <div className={`grid ${gridCols[columns]} gap-3 sm:gap-4`}>
          {actions.map((action, index) => (
            <QuickActionButton key={index} {...action} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
