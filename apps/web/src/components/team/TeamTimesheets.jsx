import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock } from 'lucide-react';
import { TimeEntry } from '@/api/entities';
import { supabase } from '@/api/base44Client';
import { format, startOfWeek, endOfWeek, subWeeks, addWeeks } from 'date-fns';
import { Button } from '@/components/ui/button';

export default function TeamTimesheets({ user }) {
  const [timesheets, setTimesheets] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedWeek, setSelectedWeek] = useState(new Date());
  const [selectedUser, setSelectedUser] = useState('all');

  useEffect(() => {
    loadTimesheets();
  }, [selectedWeek, selectedUser]);

  const loadTimesheets = async () => {
    setLoading(true);
    try {
      // Get users from profiles table
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('*')
        .eq('status', 'active')
        .order('full_name');
      
      if (userError) throw userError;
      
      // Filter by department if user is a manager
      let filteredUsers = userData || [];
      const userRole = user?.profile?.role || 'user';
      const userDepartment = user?.profile?.department;
      
      if (userRole === 'manager' && userDepartment) {
        filteredUsers = userData.filter(u => u.department === userDepartment);
      }
      
      setUsers(filteredUsers);

      // Get time entries for the selected week
      const weekStart = startOfWeek(selectedWeek);
      const weekEnd = endOfWeek(selectedWeek);
      
      let query = {};
      if (selectedUser !== 'all') {
        query.user_id = selectedUser;
      }
      
      const entries = await TimeEntry.filter(query, '-start_time');
      
      // Filter entries by week
      const weekEntries = entries.filter(entry => {
        const entryDate = new Date(entry.start_time);
        return entryDate >= weekStart && entryDate <= weekEnd;
      });

      // Group entries by user
      const groupedEntries = weekEntries.reduce((acc, entry) => {
        const userId = entry.user_id;
        if (!acc[userId]) {
          const userData = filteredUsers.find(u => u.id === userId);
          if (!userData && selectedUser === 'all') return acc; // Skip if user not in filtered list
          
          acc[userId] = {
            user: userData || { full_name: 'Unknown', email: 'unknown@example.com' },
            entries: [],
            totalHours: 0
          };
        }
        acc[userId].entries.push(entry);
        acc[userId].totalHours += (entry.duration_minutes || 0) / 60;
        return acc;
      }, {});

      setTimesheets(Object.values(groupedEntries));
    } catch (error) {
      console.error('Error loading timesheets:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
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
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Team Timesheets</CardTitle>
          <div className="flex gap-2">
            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Team Members</SelectItem>
                {users.map(u => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.full_name || u.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setSelectedWeek(subWeeks(selectedWeek, 1))}
              >
                ← Previous
              </Button>
              <span className="text-sm font-medium px-2">
                Week of {format(startOfWeek(selectedWeek), 'MMM d, yyyy')}
              </span>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setSelectedWeek(addWeeks(selectedWeek, 1))}
              >
                Next →
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {timesheets.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="w-12 h-12 mx-auto mb-4 text-slate-300" />
            <p className="text-slate-500">No timesheets found for this period</p>
          </div>
        ) : (
          <div className="space-y-6">
            {timesheets.map((timesheet, idx) => (
              <div key={idx} className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="font-semibold">{timesheet.user.full_name}</h3>
                    <p className="text-sm text-slate-500">{timesheet.user.email}</p>
                  </div>
                  <Badge variant="outline" className="text-lg px-3 py-1">
                    Total: {timesheet.totalHours.toFixed(1)}h
                  </Badge>
                </div>
                
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Start</TableHead>
                      <TableHead>End</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Note</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {timesheet.entries.map(entry => (
                      <TableRow key={entry.id}>
                        <TableCell>{format(new Date(entry.start_time), 'MMM d')}</TableCell>
                        <TableCell>{format(new Date(entry.start_time), 'h:mm a')}</TableCell>
                        <TableCell>
                          {entry.end_time ? format(new Date(entry.end_time), 'h:mm a') : 'Active'}
                        </TableCell>
                        <TableCell>{formatDuration(entry.duration_minutes || 0)}</TableCell>
                        <TableCell className="text-sm text-slate-600">{entry.note || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}