
import React from 'react';

export const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-full w-full">
    <div className="flex flex-col items-center space-y-4">
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-sky-500"></div>
      <p className="text-slate-500">Analyzing... this may take a moment.</p>
    </div>
  </div>
);
