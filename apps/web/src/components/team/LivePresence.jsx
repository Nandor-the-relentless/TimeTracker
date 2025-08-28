import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, User, UserCheck, UserX } from 'lucide-react';
import { TimeEntry } from '@/api/entities';
import { supabase } from '@/api/base44Client';
import { formatDistanceToNow } from 'date-fns';

export default function LivePresence() {
  const [activeEntries, setActiveEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActiveEntries();
    const interval = setInterval(loadActiveEntries, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

const loadActiveEntries = async () => {
  try {
    // Get ALL recent entries since filter isn't working properly
    const entries = await TimeEntry.list('-start_time', 100);
    console.log('All entries:', entries);
    
    // Manually filter for entries with no end_time
    const activeEntries = entries.filter(e => !e.end_time || e.end_time === null);
    console.log('Actually active entries:', activeEntries);
    
    // If no active entries, clear the display
    if (!activeEntries || activeEntries.length === 0) {
      console.log('No active entries found - clearing display');
      setActiveEntries([]);
      setLoading(false);
      return;
    }
    
    // Get user details for active entries
    const userIds = [...new Set(activeEntries.map(e => e.user_id))];
    
    if (userIds.length > 0) {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .in('id', userIds);
      
      if (error) throw error;
      
      // Map users to entries
      const entriesWithUsers = activeEntries.map(entry => {
        const user = profiles.find(p => p.id === entry.user_id) || {
          full_name: 'Unknown User',
          email: 'unknown@example.com',
          department: null
        };
        return {
          ...entry,
          user
        };
      });
      
      setActiveEntries(entriesWithUsers);
    } else {
      setActiveEntries([]);
    }
  } catch (error) {
    console.error('Error loading active entries:', error);
  } finally {
    setLoading(false);
  }
};

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-slate-200 rounded w-1/4 mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array(3).fill(0).map((_, i) => (
                <div key={i} className="h-24 bg-slate-200 rounded"></div>
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
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-green-600 animate-pulse" />
          Live Team Status ({activeEntries.length} active)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activeEntries.length === 0 ? (
          <div className="text-center py-8">
            <UserX className="w-12 h-12 mx-auto mb-4 text-slate-300" />
            <p className="text-slate-500">No team members currently clocked in</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeEntries.map((entry) => (
              <div key={entry.id} className="border rounded-lg p-4 bg-green-50 border-green-200">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-green-600" />
                    <span className="font-semibold">{entry.user.full_name}</span>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Active</Badge>
                </div>
                
                <div className="text-sm text-slate-600 space-y-1">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>Started {formatDistanceToNow(new Date(entry.start_time), { addSuffix: true })}</span>
                  </div>
                  
                  {entry.user.department && (
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      <span>{entry.user.department}</span>
                    </div>
                  )}
                  
                  {entry.note && (
                    <div className="mt-2 p-2 bg-white rounded text-xs">
                      {entry.note}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}