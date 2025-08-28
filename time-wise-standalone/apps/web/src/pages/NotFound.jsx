import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { createPageUrl } from '@/utils';
import { SearchX, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6">
      <div className="text-center bg-white p-10 rounded-2xl shadow-xl max-w-lg w-full">
        <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-blue-100 mb-6">
          <SearchX className="h-10 w-10 text-blue-600" />
        </div>
        <h1 className="text-5xl font-bold text-slate-900">404</h1>
        <h2 className="mt-2 text-2xl font-semibold text-slate-800">Page Not Found</h2>
        <p className="mt-4 text-slate-600">
          The page you are looking for does not exist or has been moved. Let's get you back on track.
        </p>
        <Link to={createPageUrl('Dashboard')} className="mt-8 inline-block">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Home className="mr-2 h-4 w-4" />
            Return to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}