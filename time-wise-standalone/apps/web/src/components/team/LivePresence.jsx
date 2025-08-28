import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Radio, Square, Clock } from 'lucide-react';
import { TimeEntry } from '@/api/entities';
import { User } from '@/api/entities';
import { AuditLog } from '@/api/entities';
import { format } from 'date-fns';

export default function LivePresence() {
  const [activeEntries, setActiveEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    loadActiveEntries();
    const interval = setInterval(loadActiveEntries, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadActiveEntries = async () => {
    try {
      const [entries, currentUserData] = await Promise.all([
        TimeEntry.filter({ end_time: null }),
        User.me()
      ]);
      
      // Get user details for each entry
      const entriesWithUsers = await Promise.all(
        entries.map(async (entry) => {
          const user = await User.filter({ id: entry.user_id });
          return {
            ...entry,
            user: user[0] || { full_name: 'Unknown', department: 'N/A' }
          };
        })
      );

      setActiveEntries(entriesWithUsers);
      setCurrentUser(currentUserData);
    } catch (error) {
      console.error('Error loading active entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleForceClockOut = async (entry) => {
    const note = prompt('Please provide a reason for forcing clock out:');
    if (!note) return;

    try {
      const endTime = new Date();
      const startTime = new Date(entry.start_time);
      const durationMinutes = Math.round((endTime - startTime) / 1000 / 60);

      await TimeEntry.update(entry.id, {
        end_time: endTime.toISOString(),
        duration_minutes: durationMinutes,
        note: entry.note ? `${entry.note} | Force clock-out: ${note}` : `Force clock-out: ${note}`
      });

      await AuditLog.create({
        actor_id: currentUser.id,
        actor_name: currentUser.full_name,
        action: 'time_entry.force_clockout',
        entity_type: 'TimeEntry',
        entity_id: entry.id,
        details: `Force clocked out ${entry.user.full_name}`,
        metadata: { reason: note, duration_minutes: durationMinutes }
      });

      await loadActiveEntries();
    } catch (error) {
      console.error('Error forcing clock out:', error);
    }
  };

  const calculateElapsed = (startTime) => {
    const now = new Date();
    const start = new Date(startTime);
    const diffMs = now - start;
    const hours = Math.floor(diffMs / 1000 / 60 / 60);
    const minutes = Math.floor((diffMs / 1000 / 60) % 60);
    return `${hours}h ${minutes}m`;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-slate-200 rounded w-1/4"></div>
            <div className="space-y-2">
              {Array(3).fill(0).map((_, i) => (
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
        <CardTitle className="flex items-center gap-2">
          <Radio className="w-5 h-5 text-green-500 animate-pulse" />
          Who's On The Clock ({activeEntries.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activeEntries.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="w-12 h-12 mx-auto mb-4 text-slate-300" />
            <p className="text-slate-500">No one is currently clocked in</p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Started At</TableHead>
                  <TableHead>Elapsed Time</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead className="w-32">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        {entry.user.full_name}
                      </div>
                    </TableCell>
                    <TableCell>{entry.user.department || 'N/A'}</TableCell>
                    <TableCell>{format(new Date(entry.start_time), 'h:mm a')}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-green-50 text-green-700">
                        {calculateElapsed(entry.start_time)}
                      </Badge>
                    </TableCell>
                    <TableCell>{entry.project_code || '-'}</TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleForceClockOut(entry)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Square className="w-3 h-3 mr-1" />
                        Force Out
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}