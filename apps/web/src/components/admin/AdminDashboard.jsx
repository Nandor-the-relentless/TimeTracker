import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Users, UserPlus, CalendarCheck, Hourglass } from 'lucide-react';
import { supabase } from '@/api/base44Client';
import { PTORequest, TimeEntry } from '@/api/entities';
import { startOfWeek } from 'date-fns';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    activeUsers: 0,
    pendingInvites: 0,
    openPTORequests: 0,
    hoursThisWeek: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      // Active users - query profiles directly
      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('*')
        .eq('status', 'active');
      
      if (usersError) throw usersError;
      
      // Pending PTO requests
      const pendingPTO = await PTORequest.filter({ status: 'pending' });
      
      // Hours this week
      const weekStart = startOfWeek(new Date());
      const allEntries = await TimeEntry.list('-start_time');
      const weekEntries = allEntries.filter(entry => {
        const entryDate = new Date(entry.start_time);
        return entryDate >= weekStart;
      });
      
      const totalMinutes = weekEntries.reduce((sum, entry) => 
        sum + (entry.duration_minutes || 0), 0
      );

      setStats({
        activeUsers: users?.length || 0,
        pendingInvites: 0,
        openPTORequests: pendingPTO.length,
        hoursThisWeek: totalMinutes / 60
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  // Rest of component remains the same...
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array(4).fill(0).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-8 bg-slate-200 rounded mb-2"></div>
              <div className="h-4 bg-slate-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Users</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.activeUsers}</div>
          <p className="text-xs text-muted-foreground">Currently active</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pending Invites</CardTitle>
          <UserPlus className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.pendingInvites}</div>
          <p className="text-xs text-muted-foreground">Waiting for acceptance</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Open PTO Requests</CardTitle>
          <CalendarCheck className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.openPTORequests}</div>
          <p className="text-xs text-muted-foreground">Awaiting approval</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Hours Logged (Week)</CardTitle>
          <Hourglass className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.hoursThisWeek.toFixed(1)}</div>
          <p className="text-xs text-muted-foreground">This week total</p>
        </CardContent>
      </Card>
    </div>
  );
}