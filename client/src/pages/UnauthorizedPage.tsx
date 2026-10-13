import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';

export const UnauthorizedPage: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6">
      <div className="w-16 h-16 rounded-3xl bg-rose-100 text-rose-600 flex items-center justify-center mb-4 border border-rose-200 shadow-xs">
        <ShieldAlert className="w-8 h-8" />
      </div>
      <h1 className="text-2xl font-black text-navy-900 tracking-tight">403 Forbidden Access</h1>
      <p className="text-xs text-slate-500 mt-2 max-w-sm">
        You do not possess the required academic security role to view this protected resource.
      </p>
      <div className="mt-6 flex space-x-3">
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
