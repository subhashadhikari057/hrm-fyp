import React from 'react';
import { Card, CardDescription, CardHeader, CardTitle } from './ui/card';

export interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle className="text-2xl font-bold">{title}</CardTitle>
          {description && (
            <CardDescription className="text-base">{description}</CardDescription>
          )}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </CardHeader>
    </Card>
  );
}
