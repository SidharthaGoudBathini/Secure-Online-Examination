import React from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, Home } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6">
      <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-500 flex items-center justify-center mb-4 border border-slate-200 shadow-xs">
        <HelpCircle className="w-8 h-8" />
      </div>
      <h1 className="text-2xl font-black text-navy-900 tracking-tight">404 Page Not Found</h1>
      <p className="text-xs text-slate-500 mt-2 max-w-sm">
        The examination resource or page you requested could not be located in the system directory.
      </p>
      <div className="mt-6">
        <Link
          to="/"
          className="px-5 py-2.5 bg-navy-900 text-white rounded-xl text-xs font-semibold shadow-xs hover:bg-royal-600 transition flex items-center space-x-1.5"
        >
          <Home className="w-4 h-4" />
          <span>Return Home</span>
        </Link>
      </div>
    </div>
  );
};
