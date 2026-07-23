import React from 'react';

const StatCard = ({ title, value, icon: Icon, description, trendColor = 'navy' }) => {
  const iconColors = {
    navy: 'bg-navy-50 text-navy-900 border-navy-100',
    green: 'bg-schoolGreen-50 text-schoolGreen-800 border-schoolGreen-100'
  };

  return (
    <div className="rounded-card border border-gray-200 bg-white p-5 shadow-flat transition-transform hover:-translate-y-0.5 duration-200">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            {title}
          </p>
          <h3 className="text-2xl font-extrabold text-navy-900 md:text-3xl">
            {value}
          </h3>
        </div>

        {Icon && (
          <div className={`rounded-lg p-3 border shadow-xs ${iconColors[trendColor]}`}>
            <Icon className="h-6 w-6" />
          </div>
        )}
      </div>

      {description && (
        <p className="mt-3 text-xs text-gray-500 font-medium">
          {description}
        </p>
      )}
    </div>
  );
};

export default StatCard;
