import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Check, X, Lock, Unlock, Edit, Clock } from 'lucide-react';
import { TimeEntry } from '@/api/entities';
import { User } from '@/api/entities';
import { AuditLog } from '@/api/entities';
import { NotificationQueue } from '@/api/entities';
import { format, startOfWeek, endOfWeek, isSameWeek } from 'date-fns';

export default function TeamTimesheets({ user }) {
  const [timesheets, setTimesheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    employee: 'all',
    status: 'all',
    week: format(new Date(), 'yyyy-MM-dd')
  });
  const [editingEntry, setEditingEntry] = useState(null);
  const [processingWeek, setProcessingWeek] = useState(null);
  const [weekAction, setWeekAction] = useState({ type: '', note: '' });

  useEffect(() => {
    loadTimesheets();
  }, [filters, user]);

  const loadTimesheets = async () => {
    setLoading(true);
    try {
      const allEntries = await TimeEntry.list('-start_time');
      const allUsers = await User.list();
      
      // Filter by manager's department if not admin
      let departmentUsers = allUsers;
      if (user.role === 'manager') {
        departmentUsers = allUsers.filter(u => u.department === user.department);
      }

      // Group entries by user and week
      const timesheetData = [];
      const weekStart = startOfWeek(new Date(filters.week));
      const weekEnd = endOfWeek(new Date(filters.week));

      for (const employee of departmentUsers) {
        const userEntries = allEntries.filter(entry => 
          entry.user_id === employee.id &&
          new Date(entry.start_time) >= weekStart &&
          new Date(entry.start_time) <= weekEnd
        );

        if (userEntries.length > 0 || filters.employee === employee.id || filters.employee === 'all') {
          const totalMinutes = userEntries.reduce((sum, entry) => sum + (entry.duration_minutes || 0), 0);
          const weekStatus = userEntries.length > 0 ? userEntries[0].status : 'draft';
          
          timesheetData.push({
            user: employee,
            entries: userEntries,
            totalHours: totalMinutes / 60,
            weekStatus,
            canEdit: weekStatus === 'draft' || weekStatus === 'submitted'
          });
        }
      }

      // Apply filters
      let filteredData = timesheetData;
      if (filters.employee !== 'all') {
        filteredData = filteredData.filter(ts => ts.user.id === filters.employee);
      }
      if (filters.status !== 'all') {
        filteredData = filteredData.filter(ts => ts.weekStatus === filters.status);
      }

      setTimesheets(filteredData);
    } catch (error) {
      console.error('Error loading timesheets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditEntry = async (entry, updates) => {
    try {
      await TimeEntry.update(entry.id, updates);
      
      await AuditLog.create({
        actor_id: user.id,
        actor_name: user.full_name,
        action: 'time_entry.edit',
        entity_type: 'TimeEntry',
        entity_id: entry.id,
        details: `Edited time entry for ${timesheets.find(ts => ts.entries.some(e => e.id === entry.id))?.user.full_name}`,
        metadata: { changes: updates, original: entry }
      });

      setEditingEntry(null);
      await loadTimesheets();
    } catch (error) {
      console.error('Error editing entry:', error);
    }
  };

  const handleWeekAction = async (timesheet, actionType) => {
    if ((actionType === 'return' || actionType === 'unlock') && !weekAction.note.trim()) {
      alert('Please provide a note for this action.');
      return;
    }

    setProcessingWeek(timesheet.user.id);
    try {
      const weekStart = startOfWeek(new Date(filters.week));
      let newStatus = timesheet.weekStatus;
      
      switch (actionType) {
        case 'approve':
          newStatus = 'approved';
          break;
        case 'return':
          newStatus = 'draft';
          break;
        case 'lock':
          newStatus = 'locked';
          break;
        case 'unlock':
          newStatus = 'approved';
          break;
      }

      // Update all entries for this user's week
      for (const entry of timesheet.entries) {
        await TimeEntry.update(entry.id, { status: newStatus });
      }

      // Log the action
      await AuditLog.create({
        actor_id: user.id,
        actor_name: user.full_name,
        action: `week.${actionType}`,
        entity_type: 'TimeEntry',
        entity_id: `week_${weekStart.toISOString().split('T')[0]}`,
        details: `${actionType.charAt(0).toUpperCase() + actionType.slice(1)} week for ${timesheet.user.full_name}`,
        metadata: { 
          week_start: weekStart.toISOString(),
          user_id: timesheet.user.id,
          note: weekAction.note || null
        }
      });

      // Queue notification
      await NotificationQueue.create({
        recipient: timesheet.user.email,
        subject: `Timesheet ${actionType.charAt(0).toUpperCase() + actionType.slice(1)}`,
        message: `Your timesheet for week of ${format(weekStart, 'MMM d, yyyy')} has been ${actionType}.${weekAction.note ? `\n\nNote: ${weekAction.note}` : ''}`,
        metadata: { 
          type: `week_${actionType}`,
          user_id: timesheet.user.id,
          week_start: weekStart.toISOString()
        }
      });

      setWeekAction({ type: '', note: '' });
      await loadTimesheets();
    } catch (error) {
      console.error(`Error ${actionType} week:`, error);
    } finally {
      setProcessingWeek(null);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: 'bg-slate-100 text-slate-800',
      submitted: 'bg-blue-100 text-blue-800',
      approved: 'bg-green-100 text-green-800',
      locked: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || colors.draft;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-slate-200 rounded w-1/4"></div>
            <div className="space-y-2">
              {Array(5).fill(0).map((_, i) => (
                <div key={i} className="h-12 bg-slate-200 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <CardTitle>Team Timesheets</CardTitle>
            <div className="flex gap-2 w-full md:w-auto">
              <Input
                type="week"
                value={filters.week}
                onChange={(e) => setFilters(prev => ({...prev, week: e.target.value}))}
                className="w-40"
              />
              <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({...prev, status: value}))}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="locked">Locked</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {timesheets.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="w-12 h-12 mx-auto mb-4 text-slate-300" />
              <p className="text-slate-500">No timesheets found for selected criteria</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Total Hours</TableHead>
                    <TableHead>Entries</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-40">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {timesheets.map((timesheet) => (
                    <TableRow key={timesheet.user.id}>
                      <TableCell className="font-medium">{timesheet.user.full_name}</TableCell>
                      <TableCell>{timesheet.user.department}</TableCell>
                      <TableCell>{timesheet.totalHours.toFixed(1)}h</TableCell>
                      <TableCell>{timesheet.entries.length}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(timesheet.weekStatus)}>
                          {timesheet.weekStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {timesheet.weekStatus === 'submitted' && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleWeekAction(timesheet, 'approve')}
                                disabled={processingWeek === timesheet.user.id}
                                title="Approve Week"
                              >
                                <Check className="w-4 h-4 text-green-600" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setWeekAction({ type: 'return', note: '' });
                                  setProcessingWeek(timesheet.user.id);
                                }}
                                title="Return Week"
                              >
                                <X className="w-4 h-4 text-red-600" />
                              </Button>
                            </>
                          )}
                          {timesheet.weekStatus === 'approved' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleWeekAction(timesheet, 'lock')}
                              disabled={processingWeek === timesheet.user.id}
                              title="Lock Week"
                            >
                              <Lock className="w-4 h-4" />
                            </Button>
                          )}
                          {timesheet.weekStatus === 'locked' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setWeekAction({ type: 'unlock', note: '' });
                                setProcessingWeek(timesheet.user.id);
                              }}
                              title="Unlock Week"
                            >
                              <Unlock className="w-4 h-4 text-orange-600" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Week Action Modal */}
      {processingWeek && (weekAction.type === 'return' || weekAction.type === 'unlock') && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>
                {weekAction.type === 'return' ? 'Return Week' : 'Unlock Week'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Note (Required)</Label>
                <Textarea
                  placeholder={`Please provide a reason for ${weekAction.type}ing this week...`}
                  value={weekAction.note}
                  onChange={(e) => setWeekAction(prev => ({...prev, note: e.target.value}))}
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setProcessingWeek(null);
                    setWeekAction({ type: '', note: '' });
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={() => {
                    const timesheet = timesheets.find(ts => ts.user.id === processingWeek);
                    handleWeekAction(timesheet, weekAction.type);
                  }}
                  disabled={!weekAction.note.trim()}
                >
                  {weekAction.type === 'return' ? 'Return Week' : 'Unlock Week'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}