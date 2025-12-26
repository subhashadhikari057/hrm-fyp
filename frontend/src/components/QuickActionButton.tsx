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
  const hoverClasses: Record<NonNullable<QuickActionButtonProps['color']>, string> = {
    blue: 'hover:bg-blue-200 hover:text-blue-900',
    green: 'hover:bg-green-200 hover:text-green-900',
    purple: 'hover:bg-purple-200 hover:text-purple-900',
    orange: 'hover:bg-orange-200 hover:text-orange-900',
    red: 'hover:bg-red-200 hover:text-red-900',
    yellow: 'hover:bg-yellow-200 hover:text-yellow-900',
    indigo: 'hover:bg-indigo-200 hover:text-indigo-900',
    pink: 'hover:bg-pink-200 hover:text-pink-900',
    gray: 'hover:bg-gray-200 hover:text-gray-900',
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
      <span className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6">
        {icon}
      </span>
      <span className="text-center font-semibold">{label}</span>
      <svg
        className="w-4 h-4 sm:w-5 sm:h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </>
  );

  return (
    <Button onClick={handleClick} variant={color} className={hoverClasses[color]}>
      {content}
    </Button>
  );
}
