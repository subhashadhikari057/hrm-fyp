'use client';

import React from 'react';
import { StatCard, StatCardProps } from './StatCard';

export interface StatsGridProps {
  stats: StatCardProps[];
  columns?: 2 | 3 | 4 | 5;
}

export function StatsGrid({ stats, columns = 4 }: StatsGridProps) {
  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-2 md:grid-cols-3 xl:grid-cols-5',
  };

  return (
    <div className={`grid ${gridCols[columns]} gap-3 sm:gap-4 lg:gap-6`}>
      {stats.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  );
}
