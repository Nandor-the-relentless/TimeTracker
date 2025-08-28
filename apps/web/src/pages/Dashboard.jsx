import React, { useState, useEffect } from "react";
import { User, PTORequest } from "@/api/entities";
import { clockIn, clockOut, getOpenEntry, listWeekEntries } from '@/api/timeClock';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Play, Square, Timer, Calendar, Users, FileText } from "lucide-react";
import { format, startOfWeek, endOfWeek, isToday } from "date-fns";
import { Alert, AlertDescription } from "@/components/ui/alert";

import QuickClockActions from "../components/dashboard/QuickClockActions";
import WeeklyOverview from "../components/dashboard/WeeklyOverview";
import RecentActivity from "../components/dashboard/RecentActivity";
import PTOSummary from "../components/dashboard/PTOSummary";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [currentEntry, setCurrentEntry] = useState(null);
  const [todayHours, setTodayHours] = useState(0);
  const [weekHours, setWeekHours] = useState(0);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [recentEntries, setRecentEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clockingIn, setClockingin] = useState(false);

  useEffect(() => {
    loadDashboardData();
    // Refresh every minute to update timer
    const interval = setInterval(loadDashboardData, 60000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);

      // Use the shared timeClock API instead of direct database calls
      const activeEntry = await getOpenEntry();
      setCurrentEntry(activeEntry);

      // Get week entries using the shared API
      const weekStart = startOfWeek(new Date());
      const weekEnd = endOfWeek(new Date());
      const weekEntries = await listWeekEntries(weekStart.toISOString(), weekEnd.toISOString());

      // Calculate today's hours
      const todayFiltered = weekEntries.filter(entry => isToday(new Date(entry.start_time)));
      const todayTotal = todayFiltered.reduce((sum, entry) => sum + (entry.duration_minutes || 0), 0);
      setTodayHours(todayTotal / 60);

      // Calculate week hours
      const weekTotal = weekEntries.reduce((sum, entry) => sum + (entry.duration_minutes || 0), 0);
      setWeekHours(weekTotal / 60);

      // Set recent entries
      setRecentEntries(weekEntries.slice(0, 5));

      // Load pending PTO requests (for managers/admins)
      if (currentUser.role === 'admin' || currentUser.role === 'manager') {
        const pending = await PTORequest.filter({
          status: "pending"
        });
        setPendingRequests(pending);
      }

    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClockIn = async (projectCode, note) => {
    setClockingin(true);
    try {
      // Use the shared timeClock API
      await clockIn({ project_code: projectCode, note });
      await loadDashboardData();
    } catch (error) {
      console.error("Error clocking in:", error);
    } finally {
      setClockingin(false);
    }
  };

  const handleClockOut = async () => {
    if (!currentEntry) return;
    
    setClockingin(true);
    try {
      // Use the shared timeClock API
      await clockOut(currentEntry.id);
      await loadDashboardData();
    } catch (error) {
      console.error("Error clocking out:", error);
    } finally {
      setClockingin(false);
    }
  };

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getCurrentDuration = () => {
    if (!currentEntry) return 0;
    const now = new Date();
    const start = new Date(currentEntry.start_time);
    return Math.round((now - start) / 1000 / 60);
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array(4).fill(0).map((_, i) => (
              <div key={i} className="h-32 bg-slate-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 bg-slate-50 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {user?.full_name}
          </h1>
          <p className="text-slate-600 mt-1">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
        </div>
        
        {currentEntry && (
          <Alert className="bg-green-50 border-green-200">
            <Timer className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              You've been clocked in for {formatDuration(getCurrentDuration())}
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Today</p>
                <p className="text-lg font-bold text-slate-900">{todayHours.toFixed(1)}h</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">This Week</p>
                <p className="text-lg font-bold text-slate-900">{weekHours.toFixed(1)}h</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {(user?.role === 'admin' || user?.role === 'manager') && (
          <>
            <Card className="bg-white">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Pending PTO</p>
                    <p className="text-lg font-bold text-slate-900">{pendingRequests.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Reports</p>
                    <p className="text-lg font-bold text-slate-900">Ready</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Clock Actions */}
        <div className="lg:col-span-1">
          <QuickClockActions 
            currentEntry={currentEntry}
            onClockIn={handleClockIn}
            onClockOut={handleClockOut}
            loading={clockingIn}
            getCurrentDuration={getCurrentDuration}
          />
        </div>

        {/* Weekly Overview & Recent Activity */}
        <div className="lg:col-span-2 space-y-6">
          <WeeklyOverview 
            weekHours={weekHours}
            recentEntries={recentEntries}
          />
          
          <RecentActivity 
            entries={recentEntries}
            user={user}
          />
        </div>
      </div>

      {/* PTO Summary for all users */}
      <PTOSummary user={user} />
    </div>
  );
}