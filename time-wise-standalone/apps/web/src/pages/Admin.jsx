
import React from 'react';
import { useRoleAuth } from '../components/hooks/useRoleAuth';
import AccessDenied from './AccessDenied';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Users, Briefcase, FileClock, Settings, ShieldCheck, Code } from 'lucide-react';
import UserManagement from '../components/admin/UserManagement';
import DepartmentManagement from '../components/admin/DepartmentManagement';
import PolicyManagement from '../components/admin/PolicyManagement';
import CompanySettings from '../components/admin/CompanySettings';
import AuditLogViewer from '../components/admin/AuditLogViewer';
import AdminDashboard from '../components/admin/AdminDashboard';
import DeveloperDocs from '../pages/DeveloperDocs';

export default function Admin() {
  const { loading, isAuthorized } = useRoleAuth(['admin']);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthorized) {
    return <AccessDenied />;
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 bg-slate-50 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Admin Panel</h1>
          <p className="text-slate-600 mt-1">Manage users, policies, and company settings.</p>
        </div>
      </div>
      
      <AdminDashboard />

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-3 md:grid-cols-6">
          <TabsTrigger value="users"><Users className="w-4 h-4 mr-2"/>Users</TabsTrigger>
          <TabsTrigger value="departments"><Briefcase className="w-4 h-4 mr-2"/>Departments</TabsTrigger>
          <TabsTrigger value="policies"><FileClock className="w-4 h-4 mr-2"/>PTO</TabsTrigger>
          <TabsTrigger value="settings"><Settings className="w-4 h-4 mr-2"/>Settings</TabsTrigger>
          <TabsTrigger value="audit"><ShieldCheck className="w-4 h-4 mr-2"/>Audit Log</TabsTrigger>
          <TabsTrigger value="docs"><Code className="w-4 h-4 mr-2"/>Dev Docs</TabsTrigger>
        </TabsList>
        <TabsContent value="users">
          <UserManagement />
        </TabsContent>
        <TabsContent value="departments">
          <DepartmentManagement />
        </TabsContent>
        <TabsContent value="policies">
          <PolicyManagement />
        </TabsContent>
        <TabsContent value="settings">
          <CompanySettings />
        </TabsContent>
        <TabsContent value="audit">
          <AuditLogViewer />
        </TabsContent>
        <TabsContent value="docs">
          <DeveloperDocs />
        </TabsContent>
      </Tabs>
    </div>
  );
}
