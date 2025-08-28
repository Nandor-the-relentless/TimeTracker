
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Code, FileText, Database, Zap, UserX } from 'lucide-react'; // Added UserX

export default function DeveloperDocs() {
  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 bg-slate-50 min-h-screen">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Developer Documentation</h1>
        <p className="text-slate-600 mt-1">API contracts, data models, and system architecture.</p>
      </div>

      <Tabs defaultValue="api" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="api"><Code className="w-4 h-4 mr-2"/>API Docs</TabsTrigger>
          <TabsTrigger value="data"><Database className="w-4 h-4 mr-2"/>Data Models</TabsTrigger>
          <TabsTrigger value="events"><Zap className="w-4 h-4 mr-2"/>Events</TabsTrigger>
          <TabsTrigger value="changelog"><FileText className="w-4 h-4 mr-2"/>Changelog</TabsTrigger>
        </TabsList>

        <TabsContent value="api">
          <Card>
            <CardHeader>
              <CardTitle>API Endpoints</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6 text-sm">
                {/* Added User Creation Warning */}
                <div className="flex items-center gap-3 bg-yellow-50 p-4 rounded-lg text-yellow-800 border border-yellow-200">
                    <UserX className="w-6 h-6" />
                    <div>
                        <h4 className="font-bold">User Invitation & Creation</h4>
                        <p>User creation is handled securely by the Base44 platform, not through a direct API endpoint. To add users, please use the invite functionality in the main Base44 dashboard.</p>
                    </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">Admin Endpoints</h3>
                  <div className="space-y-4 bg-slate-50 p-4 rounded-lg font-mono">
                    <div><strong>GET</strong> /admin/users?query=&role=&dept=&status=&page=&sort=</div>
                    {/* Removed: <div><strong>POST</strong> /admin/invite {`{ email, name?, role, primaryDepartmentId?, memberships?[] }`}</div> */}
                    <div><strong>PATCH</strong> /admin/users/:id {`{ role?, status?, primaryDepartmentId?, addMemberships?[], removeMemberships?[] }`}</div>
                    {/* Removed: <div><strong>POST</strong> /admin/users/import (CSV)</div> */}
                    <div><strong>GET</strong> /admin/departments</div>
                    <div><strong>POST</strong> /admin/departments {`{ name, managerId? }`}</div>
                    <div><strong>PATCH</strong> /admin/departments/:id</div>
                    <div><strong>DELETE</strong> /admin/departments/:id</div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">Team Endpoints</h3>
                  <div className="space-y-4 bg-slate-50 p-4 rounded-lg font-mono">
                    <div><strong>GET</strong> /team/active?departmentId=&page=</div>
                    <div><strong>POST</strong> /team/force-clockout {`{ userId, note }`}</div>
                    <div><strong>GET</strong> /team/timesheets?from=&to=&departmentId=&userId=&status=&page=</div>
                    <div><strong>PATCH</strong> /team/time-entries/:id {`{ startAt?, endAt?, note?, projectCode? }`}</div>
                    <div><strong>POST</strong> /team/weeks/approve {`{ userId, weekStart }`}</div>
                    <div><strong>POST</strong> /team/weeks/return {`{ userId, weekStart, note }`}</div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">Reports Endpoints</h3>
                  <div className="space-y-4 bg-slate-50 p-4 rounded-lg font-mono">
                    <div><strong>GET</strong> /reports/weekly-hours?from=&to=&departmentId=&userId=&groupBy=</div>
                    <div><strong>POST</strong> /reports/export {`{ format: 'csv'|'pdf', filterConfig }`}</div>
                    <div><strong>POST</strong> /reports/presets {`{ name, filterConfig }`}</div>
                    <div><strong>GET</strong> /reports/presets</div>
                    <div><strong>DELETE</strong> /reports/presets/:id</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data">
          <Card>
            <CardHeader>
              <CardTitle>Data Models (TypeScript Interfaces)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6 text-sm">
                <pre className="bg-slate-900 text-green-400 p-4 rounded-lg overflow-x-auto">
{`interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'manager' | 'user';
  department?: string;
  hourly_rate?: number;
  start_date?: string;
  status: 'active' | 'inactive';
  created_date: string;
  updated_date: string;
  created_by: string;
}

interface TimeEntry {
  id: string;
  user_id: string;
  start_time: string;
  end_time?: string;
  duration_minutes?: number;
  note?: string;
  project_code?: string;
  status: 'draft' | 'submitted' | 'approved' | 'locked';
  approved_by?: string;
  approved_at?: string;
  created_date: string;
  updated_date: string;
}

interface PTORequest {
  id: string;
  user_id: string;
  type: 'vacation' | 'sick' | 'personal';
  start_date: string;
  end_date: string;
  partial_day_hours?: number;
  total_hours: number;
  note?: string;
  status: 'pending' | 'approved' | 'denied' | 'cancelled';
  approver_id?: string;
  approver_note?: string;
  approved_at?: string;
  created_date: string;
}

interface Department {
  id: string;
  name: string;
  manager_id?: string;
  created_date: string;
}

interface PTOBalance {
  id: string;
  user_id: string;
  policy_id: string;
  balance_hours: number;
  accrued_hours: number;
  used_hours: number;
  updated_date: string;
}

interface AuditLog {
  id: string;
  actor_id: string;
  actor_name: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details: string;
  metadata?: object;
  created_date: string;
}`}
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events">
          <Card>
            <CardHeader>
              <CardTitle>Notification Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">PTO Events</h3>
                  <div className="bg-slate-50 p-4 rounded-lg space-y-2 text-sm">
                    <div><strong>pto.submitted:</strong> {`{ requestId, userId, type, dates, hours }`}</div>
                    <div><strong>pto.approved:</strong> {`{ requestId, userId, approverId, note }`}</div>
                    <div><strong>pto.denied:</strong> {`{ requestId, userId, approverId, reason }`}</div>
                    <div><strong>pto.cancelled:</strong> {`{ requestId, userId, reason }`}</div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Timesheet Events</h3>
                  <div className="bg-slate-50 p-4 rounded-lg space-y-2 text-sm">
                    <div><strong>week.submitted:</strong> {`{ userId, weekStart, totalHours }`}</div>
                    <div><strong>week.approved:</strong> {`{ userId, weekStart, approverId }`}</div>
                    <div><strong>week.returned:</strong> {`{ userId, weekStart, approverId, note }`}</div>
                    <div><strong>week.locked:</strong> {`{ userId, weekStart, lockedBy }`}</div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">User Events</h3>
                  <div className="bg-slate-50 p-4 rounded-lg space-y-2 text-sm">
                    <div><strong>user.invited:</strong> {`{ email, role, invitedBy }`}</div>
                    <div><strong>user.activated:</strong> {`{ userId, activatedBy }`}</div>
                    <div><strong>user.deactivated:</strong> {`{ userId, deactivatedBy, reason }`}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="changelog">
          <Card>
            <CardHeader>
              <CardTitle>Implementation Changelog</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-sm">
                <div>
                  <h3 className="font-semibold text-lg mb-2">Entities Created/Modified</h3>
                  <ul className="list-disc pl-6 space-y-1">
                    <li><strong>User.json:</strong> Added department, hourly_rate, start_date, status fields</li>
                    <li><strong>TimeEntry.json:</strong> Complete schema with approval workflow</li>
                    <li><strong>PTORequest.json:</strong> Full PTO request lifecycle</li>
                    <li><strong>PTOBalance.json:</strong> User PTO balance tracking</li>
                    <li><strong>PTOPolicy.json:</strong> Company PTO policies and holidays</li>
                    <li><strong>Department.json:</strong> Department structure with managers</li>
                    <li><strong>Settings.json:</strong> Company-wide configuration</li>
                    <li><strong>AuditLog.json:</strong> Complete audit trail</li>
                    <li><strong>NotificationQueue.json:</strong> Email notification system</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-2">Pages Created</h3>
                  <ul className="list-disc pl-6 space-y-1">
                    <li><strong>Admin.js:</strong> Full admin dashboard with user, department, PTO, and settings management</li>
                    <li><strong>Team.js:</strong> Manager dashboard with live presence and PTO inbox</li>
                    <li><strong>Reports.js:</strong> Analytics with filtering, visualization, and export</li>
                    <li><strong>AccessDenied.js:</strong> 403 error page for unauthorized access</li>
                    <li><strong>NotFound.js:</strong> 404 error page for invalid routes</li>
                    <li><strong>DeveloperDocs.js:</strong> This documentation page</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-2">Components Created</h3>
                  <ul className="list-disc pl-6 space-y-1">
                    <li><strong>hooks/useRoleAuth.js:</strong> Role-based authentication guard</li>
                    <li><strong>admin/UserManagement.js:</strong> User CRUD with role management</li>
                    <li><strong>admin/DepartmentManagement.js:</strong> Department CRUD</li>
                    <li><strong>admin/CompanySettings.js:</strong> System configuration</li>
                    <li><strong>admin/AdminDashboard.js:</strong> Overview statistics</li>
                    {/* Removed: <li><strong>admin/DemoModePanel.js:</strong> Demo data seeding</li> */}
                    <li><strong>admin/SystemHealthPanel.js:</strong> System monitoring</li>
                    <li><strong>team/LivePresence.js:</strong> Real-time clock status</li>
                    <li><strong>team/PTOInbox.js:</strong> PTO approval workflow</li>
                    <li><strong>reports/ReportFilters.js:</strong> Advanced filtering</li>
                    <li><strong>reports/ReportDataTable.js:</strong> Data visualization</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
