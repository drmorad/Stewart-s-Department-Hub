
import React from 'react';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center space-y-4 p-8 bg-white/50 dark:bg-gray-900/50 rounded-lg">
        <div className="w-16 h-16 border-4 border-blue-500 border-dashed rounded-full animate-spin"></div>
        <p className="text-lg font-semibold text-gray-700 dark:text-gray-200">Generating your comprehensive schedule...</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">This may take a moment.</p>
    </div>
  );
};

export default LoadingSpinner;