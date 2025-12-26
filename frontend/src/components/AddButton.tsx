'use client';

import React from 'react';
import { Button } from './ui/button';

export interface AddButtonProps {
  label: string;
  onClick?: () => void;
  variant?: 'blue' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  disabled?: boolean;
}

export function AddButton({
  label,
  onClick,
  variant = 'blue',
  size = 'md',
  icon,
  disabled = false,
}: AddButtonProps) {
  const iconSize = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const defaultIcon = (
    <svg className={iconSize[size]} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 4v16m8-8H4"
      />
    </svg>
  );

  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      variant={variant}
      size={size === 'md' ? 'default' : size}
    >
      {icon || defaultIcon}
      {label}
    </Button>
  );
}
