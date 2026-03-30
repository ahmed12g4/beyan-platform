'use client';

import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: string;
  action?: React.ReactNode;
}

export default function PageHeader({ title, subtitle, icon, action }: PageHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 animate-fadeIn">
      <div className="flex items-center gap-5">
        <div className="flex flex-col justify-center">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight leading-none mb-2">
            {title}
          </h1>
          {subtitle && (
            <p className="text-gray-500 text-sm font-medium tracking-wide">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {action && (
        <div className="flex-shrink-0">
          {action}
        </div>
      )}
    </div>
  );
}
