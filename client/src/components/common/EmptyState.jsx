import React from 'react';
import { Inbox } from 'lucide-react';

const EmptyState = ({ 
  title = 'No Records Found', 
  message = 'Try modifying your search queries or adding new records.',
  icon: Icon = Inbox
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="rounded-full bg-navy-50 p-4 text-navy-900 border border-navy-100/50">
        <Icon className="h-8 w-8 text-navy-900" />
      </div>
      <h3 className="mt-4 text-base font-bold text-navy-900">{title}</h3>
      <p className="mt-1 text-sm text-gray-500 max-w-sm">{message}</p>
    </div>
  );
};

export default EmptyState;
