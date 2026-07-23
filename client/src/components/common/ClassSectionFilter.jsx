import React from 'react';

const ClassSectionFilter = ({ 
  selectedClass, 
  onClassChange, 
  selectedSection, 
  onSectionChange,
  showAllOption = true
}) => {
  const classes = [
    'Nursery', 'LKG', 'UKG',
    '1st', '2nd', '3rd', '4th', '5th',
    '6th', '7th', '8th', '9th', '10th',
    '11th', '12th'
  ];

  const sections = ['A', 'B', 'C', 'D'];

  return (
    <div className="flex flex-wrap items-center gap-3 sm:gap-4 no-print">
      {/* Class Dropdown Selector */}
      <div className="flex items-center gap-2">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Class:
        </label>
        <select
          value={selectedClass}
          onChange={(e) => onClassChange(e.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-xs outline-hidden focus:border-navy-900 focus:ring-1 focus:ring-navy-900"
        >
          {showAllOption && <option value="">All Classes</option>}
          {classes.map((cls) => (
            <option key={cls} value={cls}>{cls}</option>
          ))}
        </select>
      </div>

      {/* Section Dropdown Selector */}
      <div className="flex items-center gap-2">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Section:
        </label>
        <select
          value={selectedSection}
          onChange={(e) => onSectionChange(e.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-xs outline-hidden focus:border-navy-900 focus:ring-1 focus:ring-navy-900"
        >
          {showAllOption && <option value="">All Sections</option>}
          {sections.map((sec) => (
            <option key={sec} value={sec}>{sec}</option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default ClassSectionFilter;
