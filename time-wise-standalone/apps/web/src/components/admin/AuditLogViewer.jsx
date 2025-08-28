import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Shield, Filter } from 'lucide-react';
import { AuditLog } from '@/api/entities';
import { format } from 'date-fns';

export default function AuditLogViewer() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    actor: '',
    entity_type: 'all',
    action: '',
    from_date: '',
    to_date: ''
  });
  const [selectedLog, setSelectedLog] = useState(null);

  useEffect(() => {
    loadLogs();
  }, [filters]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      let allLogs = await AuditLog.list('-created_date', 100);
      
      // Apply filters
      let filteredLogs = allLogs;
      
      if (filters.actor) {
        filteredLogs = filteredLogs.filter(log => 
          log.actor_name.toLowerCase().includes(filters.actor.toLowerCase())
        );
      }
      
      if (filters.entity_type !== 'all') {
        filteredLogs = filteredLogs.filter(log => log.entity_type === filters.entity_type);
      }
      
      if (filters.action) {
        filteredLogs = filteredLogs.filter(log => 
          log.action.toLowerCase().includes(filters.action.toLowerCase())
        );
      }
      
      if (filters.from_date) {
        filteredLogs = filteredLogs.filter(log => 
          new Date(log.created_date) >= new Date(filters.from_date)
        );
      }
      
      if (filters.to_date) {
        filteredLogs = filteredLogs.filter(log => 
          new Date(log.created_date) <= new Date(filters.to_date + 'T23:59:59')
        );
      }

      setLogs(filteredLogs);
    } catch (error) {
      console.error('Error loading audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (action) => {
    if (action.includes('create') || action.includes('invite')) return 'bg-green-100 text-green-800';
    if (action.includes('update') || action.includes('approve')) return 'bg-blue-100 text-blue-800';
    if (action.includes('delete') || action.includes('deny')) return 'bg-red-100 text-red-800';
    if (action.includes('force')) return 'bg-orange-100 text-orange-800';
    return 'bg-gray-100 text-gray-800';
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
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Audit Log ({logs.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
            <Input
              placeholder="Filter by actor..."
              value={filters.actor}
              onChange={(e) => setFilters(prev => ({...prev, actor: e.target.value}))}
            />
            <Select 
              value={filters.entity_type} 
              onValueChange={(value) => setFilters(prev => ({...prev, entity_type: value}))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Entities</SelectItem>
                <SelectItem value="User">Users</SelectItem>
                <SelectItem value="TimeEntry">Time Entries</SelectItem>
                <SelectItem value="PTORequest">PTO Requests</SelectItem>
                <SelectItem value="Department">Departments</SelectItem>
                <SelectItem value="Settings">Settings</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder="Filter by action..."
              value={filters.action}
              onChange={(e) => setFilters(prev => ({...prev, action: e.target.value}))}
            />
            <Input
              type="date"
              value={filters.from_date}
              onChange={(e) => setFilters(prev => ({...prev, from_date: e.target.value}))}
            />
            <Input
              type="date"
              value={filters.to_date}
              onChange={(e) => setFilters(prev => ({...prev, to_date: e.target.value}))}
            />
          </div>

          {logs.length === 0 ? (
            <div className="text-center py-8">
              <Shield className="w-12 h-12 mx-auto mb-4 text-slate-300" />
              <p className="text-slate-500">No audit logs found matching your criteria</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Actor</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead className="w-20">View</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-xs">
                        {format(new Date(log.created_date), 'MMM d, h:mm a')}
                      </TableCell>
                      <TableCell>{log.actor_name}</TableCell>
                      <TableCell>
                        <Badge className={getActionColor(log.action)}>
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell>{log.entity_type}</TableCell>
                      <TableCell className="max-w-xs truncate">{log.details}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedLog(log)}
                        >
                          <Eye className="w-4 h-4" />
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

      {/* Log Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Audit Log Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-medium">Actor</Label>
                  <p>{selectedLog.actor_name}</p>
                </div>
                <div>
                  <Label className="font-medium">Timestamp</Label>
                  <p>{format(new Date(selectedLog.created_date), 'MMM d, yyyy \'at\' h:mm a')}</p>
                </div>
                <div>
                  <Label className="font-medium">Action</Label>
                  <Badge className={getActionColor(selectedLog.action)}>
                    {selectedLog.action}
                  </Badge>
                </div>
                <div>
                  <Label className="font-medium">Entity</Label>
                  <p>{selectedLog.entity_type}</p>
                </div>
              </div>
              
              <div>
                <Label className="font-medium">Details</Label>
                <p className="text-slate-600">{selectedLog.details}</p>
              </div>
              
              {selectedLog.metadata && (
                <div>
                  <Label className="font-medium">Metadata</Label>
                  <pre className="bg-slate-100 p-3 rounded text-xs overflow-x-auto">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}
              
              <div className="flex justify-end">
                <Button onClick={() => setSelectedLog(null)}>
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}