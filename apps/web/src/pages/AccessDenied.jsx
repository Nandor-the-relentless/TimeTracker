import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { createPageUrl } from '@/utils';
import { ShieldAlert, Home } from 'lucide-react';

export default function AccessDenied() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6">
      <div className="text-center bg-white p-10 rounded-2xl shadow-xl max-w-lg w-full">
        <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-red-100 mb-6">
          <ShieldAlert className="h-10 w-10 text-red-600" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900">Access Denied</h1>
        <p className="mt-4 text-slate-600">
          You do not have the necessary permissions to view this page. Please contact your administrator if you believe this is an error.
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