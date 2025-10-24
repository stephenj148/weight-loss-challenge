import React from 'react';

interface StatsCardProps {
  title: string;
  value: string;
  icon: string;
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'default';
  subtitle?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ 
  title, 
  value, 
  icon, 
  color = 'default',
  subtitle 
}) => {
  const colorClasses = {
    primary: 'bg-primary-50 border-primary-200',
    success: 'bg-success-50 border-success-200',
    warning: 'bg-warning-50 border-warning-200',
    danger: 'bg-danger-50 border-danger-200',
    default: 'bg-gray-50 border-gray-200',
  };

  const iconColorClasses = {
    primary: 'text-primary-600',
    success: 'text-success-600',
    warning: 'text-warning-600',
    danger: 'text-danger-600',
    default: 'text-gray-600',
  };

  return (
    <div className={`card border ${colorClasses[color]}`}>
      <div className="card-body">
        <div className="flex items-center">
          <div className={`flex-shrink-0 p-3 rounded-lg ${colorClasses[color]}`}>
            <span className={`text-2xl ${iconColorClasses[color]}`}>
              {icon}
            </span>
          </div>
          <div className="ml-4 flex-1">
            <h3 className="text-sm font-medium text-gray-500 truncate">
              {title}
            </h3>
            <p className={`text-2xl font-semibold ${iconColorClasses[color]}`}>
              {value}
            </p>
            {subtitle && (
              <p className="text-sm text-gray-500 mt-1">
                {subtitle}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsCard;
