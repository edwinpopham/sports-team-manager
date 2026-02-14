// Loading spinner and loading state components
'use client';

import { ButtonHTMLAttributes } from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'secondary' | 'white';
  className?: string;
}

export function LoadingSpinner({ size = 'md', color = 'primary', className = '' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  const colorClasses = {
    primary: 'text-blue-600',
    secondary: 'text-gray-600',
    white: 'text-white'
  };

  return (
    <svg
      className={`animate-spin ${sizeClasses[size]} ${colorClasses[color]} ${className}`}
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

interface LoadingStateProps {
  isLoading: boolean;
  children: React.ReactNode;
  loadingText?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingState({ 
  isLoading, 
  children, 
  loadingText = 'Loading...', 
  size = 'md',
  className = ''
}: LoadingStateProps) {
  if (!isLoading) return <>{children}</>;

  return (
    <div className={`flex items-center justify-center py-8 ${className}`}>
      <div className="flex flex-col items-center gap-3">
        <LoadingSpinner size={size} />
        <p className="text-gray-600 text-sm">{loadingText}</p>
      </div>
    </div>
  );
}

interface LoadingOverlayProps {
  isLoading: boolean;
  loadingText?: string;
  children: React.ReactNode;
}

export function LoadingOverlay({ 
  isLoading, 
  loadingText = 'Loading...', 
  children 
}: LoadingOverlayProps) {
  return (
    <div className="relative">
      {children}
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10 rounded-md">
          <div className="flex flex-col items-center gap-3">
            <LoadingSpinner />
            <p className="text-gray-600 text-sm">{loadingText}</p>
          </div>
        </div>
      )}
    </div>
  );
}

interface SkeletonProps {
  className?: string;
  width?: string;
  height?: string;
}

export function Skeleton({ className = '', width = 'w-full', height = 'h-4' }: SkeletonProps) {
  return (
    <div className={`animate-pulse bg-gray-200 rounded ${width} ${height} ${className}`} />
  );
}

interface SkeletonCardProps {
  showImage?: boolean;
  lines?: number;
}

export function SkeletonCard({ showImage = false, lines = 3 }: SkeletonCardProps) {
  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-white">
      <div className="animate-pulse">
        {showImage && <Skeleton className="mb-4" width="w-full" height="h-48" />}
        
        <div className="space-y-3">
          <Skeleton width="w-3/4" height="h-6" />
          
          {Array.from({ length: lines }).map((_, i) => (
            <Skeleton 
              key={i} 
              width={i === lines - 1 ? 'w-1/2' : 'w-full'} 
              height="h-4" 
            />
          ))}
          
          <div className="flex gap-2 pt-2">
            <Skeleton width="w-20" height="h-8" />
            <Skeleton width="w-24" height="h-8" />
          </div>
        </div>
      </div>
    </div>
  );
}

interface LoadingButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading: boolean;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export function LoadingButton({ 
  isLoading, 
  children, 
  disabled = false,
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}: LoadingButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500',
    secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-900 focus:ring-gray-500',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500'
  };
  
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  return (
    <button
      {...props}
      disabled={disabled || isLoading}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      {isLoading && (
        <LoadingSpinner 
          size="sm" 
          color={variant === 'secondary' ? 'secondary' : 'white'} 
          className="mr-2" 
        />
      )}
      {children}
    </button>
  );
}