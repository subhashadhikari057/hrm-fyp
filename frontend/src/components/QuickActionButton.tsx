'use client';

import { useRouter } from 'next/navigation';
import { Button } from './ui/button';

export interface QuickActionButtonProps {
  label: string;
  href?: string;
  onClick?: () => void;
  icon: React.ReactNode;
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'yellow' | 'indigo' | 'pink' | 'gray';
}

export function QuickActionButton({
  label,
  href,
  onClick,
  icon,
  color = 'blue',
}: QuickActionButtonProps) {
  const router = useRouter();
  const baseClasses: Record<NonNullable<QuickActionButtonProps['color']>, string> = {
    blue: 'bg-blue-50 text-blue-900 hover:bg-blue-100 hover:text-blue-900',
    green: 'bg-green-50 text-green-900 hover:bg-green-100 hover:text-green-900',
    purple: 'bg-purple-50 text-purple-900 hover:bg-purple-100 hover:text-purple-900',
    orange: 'bg-orange-50 text-orange-900 hover:bg-orange-100 hover:text-orange-900',
    red: 'bg-red-50 text-red-900 hover:bg-red-100 hover:text-red-900',
    yellow: 'bg-yellow-50 text-yellow-900 hover:bg-yellow-100 hover:text-yellow-900',
    indigo: 'bg-indigo-50 text-indigo-900 hover:bg-indigo-100 hover:text-indigo-900',
    pink: 'bg-pink-50 text-pink-900 hover:bg-pink-100 hover:text-pink-900',
    gray: 'bg-gray-50 text-gray-900 hover:bg-gray-100 hover:text-gray-900',
  };
  const iconClasses: Record<NonNullable<QuickActionButtonProps['color']>, string> = {
    blue: 'bg-blue-100 text-blue-700',
    green: 'bg-green-100 text-green-700',
    purple: 'bg-purple-100 text-purple-700',
    orange: 'bg-orange-100 text-orange-700',
    red: 'bg-red-100 text-red-700',
    yellow: 'bg-yellow-100 text-yellow-700',
    indigo: 'bg-indigo-100 text-indigo-700',
    pink: 'bg-pink-100 text-pink-700',
    gray: 'bg-gray-100 text-gray-700',
  };

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (href) {
      router.push(href);
    }
  };

  const content = (
    <>
      <span className={`flex h-9 w-9 items-center justify-center rounded-full ${iconClasses[color]}`}>
        <span className="h-5 w-5">{icon}</span>
      </span>
      <span className="flex-1 text-left font-semibold">{label}</span>
    </>
  );

  return (
    <Button
      onClick={handleClick}
      variant={color}
      className={`w-full justify-between gap-3 rounded-xl border border-transparent px-4 py-3 shadow-sm ${baseClasses[color]}`}
    >
      {content}
    </Button>
  );
}
