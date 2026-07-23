import React from 'react';

const LoadingSpinner = ({ size = 'md', color = 'navy' }) => {
  const sizeClasses = {
    sm: 'h-5 w-5 border-2',
    md: 'h-8 w-8 border-3',
    lg: 'h-12 w-12 border-4'
  };

  const colorClasses = {
    navy: 'border-gray-250 border-t-navy-900',
    green: 'border-gray-250 border-t-schoolGreen-800',
    white: 'border-white/30 border-t-white'
  };

  return (
    <div className="flex items-center justify-center p-4">
      <div
        className={`animate-spin rounded-full ${sizeClasses[size]} ${colorClasses[color]}`}
        role="status"
      >
        <span className="sr-only">Loading...</span>
      </div>
    </div>
  );
};

export default LoadingSpinner;
