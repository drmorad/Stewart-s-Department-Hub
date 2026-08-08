
import React from 'react';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center space-y-6 py-24 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm animate-fade-in">
        <div className="relative w-16 h-16">
            <div className="absolute inset-0 border-4 border-slate-100 dark:border-slate-800 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <div className="text-center space-y-1">
            <p className="text-lg font-bold text-slate-900 dark:text-white">
                Preparing cleaning protocols...
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
                AI matching engine in progress
            </p>
        </div>
    </div>
  );
};

export default LoadingSpinner;
