import React from 'react';
import { useRoleAuth } from '../components/hooks/useRoleAuth';
import AccessDenied from './AccessDenied';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Clock, Calendar, ListChecks } from 'lucide-react';
import LivePresence from '../components/team/LivePresence';
import TeamTimesheets from '../components/team/TeamTimesheets';
import PTOInbox from '../components/team/PTOInbox';

export default function Team() {
  const { loading, isAuthorized, user } = useRoleAuth(['admin', 'manager']);

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
      <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Team Dashboard</h1>
      <p className="text-slate-600 mt-1">Oversee your team's activity, timesheets, and time off requests.</p>
      
      <LivePresence />

      <Tabs defaultValue="timesheets" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="timesheets"><Clock className="w-4 h-4 mr-2"/>Timesheets</TabsTrigger>
          <TabsTrigger value="pto"><Calendar className="w-4 h-4 mr-2"/>PTO Inbox</TabsTrigger>
        </TabsList>
        <TabsContent value="timesheets">
          <TeamTimesheets user={user}/>
        </TabsContent>
        <TabsContent value="pto">
          <PTOInbox user={user}/>
        </TabsContent>
      </Tabs>
    </div>
  );
}