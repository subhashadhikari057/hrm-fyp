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
    <Button onClick={handleClick} variant={color}>
      {content}
    </Button>
  );
}
