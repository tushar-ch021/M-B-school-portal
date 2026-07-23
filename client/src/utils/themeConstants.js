// Shared Theme Color Tokens for Status Badges (No hardcoded hex codes inline in components)

export const FEE_STATUS_THEME = {
  'Not Set': {
    label: 'Not Set',
    badgeClass: 'bg-gray-100 text-gray-600 border-gray-300',
    borderClass: 'border-gray-200',
    dotClass: 'bg-gray-400',
    colorHex: '#9ca3af'
  },
  Due: {
    label: 'Due',
    badgeClass: 'bg-red-50 text-red-700 border-red-200',
    borderClass: 'border-red-300',
    dotClass: 'bg-red-600',
    colorHex: '#dc2626'
  },
  Partial: {
    label: 'Partially Paid',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
    borderClass: 'border-amber-300',
    dotClass: 'bg-amber-500',
    colorHex: '#d97706'
  },
  Paid: {
    label: 'Paid',
    badgeClass: 'bg-schoolGreen-50 text-schoolGreen-800 border-schoolGreen-200',
    borderClass: 'border-schoolGreen-300',
    dotClass: 'bg-schoolGreen-600',
    colorHex: '#16a34a'
  }
};
