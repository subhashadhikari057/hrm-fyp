'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

export interface QuickActionButtonProps {
  label: string;
  href?: string;
  onClick?: () => void;
  icon: React.ReactNode;
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'yellow' | 'indigo' | 'pink' | 'gray';
  variant?: 'solid' | 'outline' | 'gradient';
  className?: string;
}

const colorClasses = {
  blue: {
    solid: 'bg-blue-600 hover:bg-blue-700 text-white',
    outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50',
    gradient: 'bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white',
  },
  green: {
    solid: 'bg-green-600 hover:bg-green-700 text-white',
    outline: 'border-2 border-green-600 text-green-600 hover:bg-green-50',
    gradient: 'bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white',
  },
  purple: {
    solid: 'bg-purple-600 hover:bg-purple-700 text-white',
    outline: 'border-2 border-purple-600 text-purple-600 hover:bg-purple-50',
    gradient: 'bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white',
  },
  orange: {
    solid: 'bg-orange-600 hover:bg-orange-700 text-white',
    outline: 'border-2 border-orange-600 text-orange-600 hover:bg-orange-50',
    gradient: 'bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white',
  },
  red: {
    solid: 'bg-red-600 hover:bg-red-700 text-white',
    outline: 'border-2 border-red-600 text-red-600 hover:bg-red-50',
    gradient: 'bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white',
  },
  yellow: {
    solid: 'bg-yellow-500 hover:bg-yellow-600 text-white',
    outline: 'border-2 border-yellow-500 text-yellow-600 hover:bg-yellow-50',
    gradient: 'bg-gradient-to-br from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-white',
  },
  indigo: {
    solid: 'bg-indigo-600 hover:bg-indigo-700 text-white',
    outline: 'border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50',
    gradient: 'bg-gradient-to-br from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white',
  },
  pink: {
    solid: 'bg-pink-600 hover:bg-pink-700 text-white',
    outline: 'border-2 border-pink-600 text-pink-600 hover:bg-pink-50',
    gradient: 'bg-gradient-to-br from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white',
  },
  gray: {
    solid: 'bg-gray-600 hover:bg-gray-700 text-white',
    outline: 'border-2 border-gray-600 text-gray-600 hover:bg-gray-50',
    gradient: 'bg-gradient-to-br from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white',
  },
};

export function QuickActionButton({
  label,
  href,
  onClick,
  icon,
  color = 'blue',
  variant = 'gradient',
  className = '',
}: QuickActionButtonProps) {
  const router = useRouter();
  const colorClass = colorClasses[color][variant];
  const baseClasses = `group relative flex items-center justify-center gap-2 sm:gap-3 px-4 sm:px-5 py-3 sm:py-3.5 rounded-xl font-medium text-sm sm:text-base transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5 ${colorClass} ${className}`;

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (href) {
      router.push(href);
    }
  };

  const content = (
    <>
      <span className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 transition-transform group-hover:scale-110">
        {icon}
      </span>
      <span className="text-center font-semibold">{label}</span>
      <svg
        className="w-4 h-4 sm:w-5 sm:h-5 opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-1"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </>
  );

  if (href && !onClick) {
    return (
      <Link href={href} className={baseClasses}>
        {content}
      </Link>
    );
  }

  return (
    <button onClick={handleClick} className={baseClasses}>
      {content}
    </button>
  );
}

