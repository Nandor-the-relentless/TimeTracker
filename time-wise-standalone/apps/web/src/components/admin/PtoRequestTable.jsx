import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Check, X, Calendar, User, ListFilter } from 'lucide-react';
import { PTORequest } from '@/api/entities';
import { PTOBalance } from '@/api/entities';
import { AuditLog } from '@/api/entities';
import { NotificationQueue } from '@/api/entities';
import { format } from 'date-fns';
import PtoRequestActionDialog from './PtoRequestActionDialog';

export default function PtoRequestTable({ users, currentUser }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: 'pending', userId: 'all', from: '', to: '' });
  const [selection, setSelection] = useState([]);
  const [dialogState, setDialogState] = useState({ open: false, action: null, request: null });

  useEffect(() => {
    loadRequests();
  }, [filters]);

  const loadRequests = async () => {
    setLoading(true);
    try {
      let query = {};
      if (filters.status !== 'all') query.status = filters.status;
      if (filters.userId !== 'all') query.user_id = filters.userId;
      
      let allRequests = await PTORequest.filter(query, '-created_date', 50);
      
      const requestsWithUsers = allRequests.map(req => ({
        ...req,
        user: users.find(u => u.id === req.user_id)
      }));
      setRequests(requestsWithUsers);
    } catch (error) {
      console.error("Error loading PTO requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (action, request) => {
    setDialogState({ open: true, action, request: [request] });
  };
  
  const handleBulkAction = (action) => {
    const selectedRequests = requests.filter(r => selection.includes(r.id));
    setDialogState({ open: true, action, request: selectedRequests });
  };
  
  const processAction = async (action, requestsToProcess, note, allowNegative) => {
    setLoading(true);
    let successes = 0;
    let failures = 0;

    for (const req of requestsToProcess) {
      try {
        const newStatus = action === 'approve' ? 'approved' : 'denied';
        
        await PTORequest.update(req.id, {
          status: newStatus,
          approver_id: currentUser.id,
          approver_note: note,
          approved_at: new Date().toISOString()
        });

        if (action === 'approve') {
          const balances = await PTOBalance.filter({ user_id: req.user_id });
          if (balances.length > 0) {
            const balance = balances[0];
            const newBalance = balance.balance_hours - req.total_hours;
            if (newBalance < 0 && !allowNegative) {
              throw new Error("Insufficient balance.");
            }
            await PTOBalance.update(balance.id, {
              balance_hours: newBalance,
              used_hours: (balance.used_hours || 0) + req.total_hours
            });
          }
        }
        
        await AuditLog.create({
          actor_id: currentUser.id,
          actor_name: currentUser.full_name,
          action: `pto.${action}`,
          entity_type: 'PTORequest',
          entity_id: req.id,
          details: `${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)} PTO request for ${req.user.full_name}`,
          metadata: { note, allowNegative }
        });

        await NotificationQueue.create({
          recipient: req.user.email,
          subject: `Your PTO Request has been ${newStatus}`,
          message: `Hello ${req.user.full_name},\n\nYour PTO request from ${format(new Date(req.start_date), 'MMM d')} to ${format(new Date(req.end_date), 'MMM d')} has been ${newStatus}.\n\nManager note: ${note}`,
          metadata: { request_id: req.id, type: `pto_${newStatus}` }
        });

        successes++;
      } catch (error) {
        console.error(`Failed to ${action} request ${req.id}:`, error);
        failures++;
      }
    }
    
    setDialogState({ open: false, action: null, request: null });
    setSelection([]);
    await loadRequests();
    setLoading(false);
    // You can add a toast message here to show results
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-800",
      denied: "bg-red-100 text-red-800",
      cancelled: "bg-gray-100 text-gray-800"
    };
    return colors[status] || colors.pending;
  };

  const getTypeColor = (type) => {
    const colors = {
      vacation: "bg-blue-100 text-blue-800",
      sick: "bg-orange-100 text-orange-800",
      personal: "bg-purple-100 text-purple-800"
    };
    return colors[type] || colors.vacation;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>PTO Requests</CardTitle>
          <div className="flex items-center gap-2">
            {selection.length > 0 && (
              <>
                <Button variant="outline" size="sm" onClick={() => handleBulkAction('approve')}>Approve ({selection.length})</Button>
                <Button variant="outline" size="sm" onClick={() => handleBulkAction('deny')}>Deny ({selection.length})</Button>
              </>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm"><ListFilter className="w-4 h-4 mr-2"/>Filter</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="p-4 space-y-4 w-64" align="end">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <Select value={filters.status} onValueChange={v => setFilters(f => ({...f, status: v}))}>
                    <SelectTrigger><SelectValue/></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="denied">Denied</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Employee</label>
                   <Select value={filters.userId} onValueChange={v => setFilters(f => ({...f, userId: v}))}>
                    <SelectTrigger><SelectValue/></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Employees</SelectItem>
                      {users.map(u => <SelectItem key={u.id} value={u.id}>{u.full_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-slate-200 rounded animate-pulse"/>)}
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-10">
            <Calendar className="mx-auto h-12 w-12 text-slate-400" />
            <p className="mt-2 text-sm text-slate-500">No PTO requests match your filters.</p>
          </div>
        ) : (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"><Checkbox onCheckedChange={(checked) => {
                     if(checked) setSelection(requests.map(r => r.id));
                     else setSelection([]);
                  }}/></TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="w-12">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map(req => (
                  <TableRow key={req.id}>
                    <TableCell><Checkbox checked={selection.includes(req.id)} onCheckedChange={() => {
                      setSelection(s => s.includes(req.id) ? s.filter(id => id !== req.id) : [...s, req.id]);
                    }}/></TableCell>
                    <TableCell>
                      <div>{req.user?.full_name}</div>
                      <div className="text-xs text-slate-500">{req.user?.department}</div>
                    </TableCell>
                    <TableCell><Badge className={getTypeColor(req.type)}>{req.type}</Badge></TableCell>
                    <TableCell>{format(new Date(req.start_date), 'MMM d')} - {format(new Date(req.end_date), 'MMM d')}</TableCell>
                    <TableCell>{req.total_hours}h</TableCell>
                    <TableCell><Badge className={getStatusColor(req.status)}>{req.status}</Badge></TableCell>
                    <TableCell>{format(new Date(req.created_date), 'MMM d, yyyy')}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon"><MoreHorizontal className="w-4 h-4"/></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          {req.status === 'pending' && (
                            <>
                              <DropdownMenuItem onClick={() => handleAction('approve', req)}><Check className="w-4 h-4 mr-2"/>Approve</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleAction('deny', req)}><X className="w-4 h-4 mr-2"/>Deny</DropdownMenuItem>
                            </>
                          )}
                           <DropdownMenuItem><User className="w-4 h-4 mr-2"/>View Profile</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {dialogState.open && (
        <PtoRequestActionDialog
          action={dialogState.action}
          requests={dialogState.request}
          onClose={() => setDialogState({ open: false, action: null, request: null })}
          onConfirm={processAction}
        />
      )}
    </Card>
  );
}