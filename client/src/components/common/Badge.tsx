import React from 'react';

interface BadgeProps {
  status: string;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ status, className = '' }) => {
  const getBadgeStyle = (val: string) => {
    switch (val.toUpperCase()) {
      case 'PUBLISHED':
      case 'ACTIVE':
      case 'ONLINE':
      case 'PASSED':
      case 'SUCCESS':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'IN_PROGRESS':
      case 'ONGOING':
        return 'bg-blue-50 text-royal-600 border-royal-200 animate-pulse';
      case 'DRAFT':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'SCHEDULED':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'COMPLETED':
      case 'SUBMITTED':
      case 'AUTO_SUBMITTED':
        return 'bg-navy-50 text-navy-800 border-navy-200';
      case 'FAILED':
      case 'TERMINATED':
      case 'ERROR':
      case 'HIGH':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'MEDIUM':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'LOW':
        return 'bg-slate-100 text-slate-600 border-slate-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const formatText = (val: string) => {
    return val.replace(/_/g, ' ');
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize ${getBadgeStyle(
        status
      )} ${className}`}
    >
      {formatText(status)}
    </span>
  );
};
