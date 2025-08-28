import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, XCircle, Calendar, MessageSquare } from 'lucide-react';
import { PTORequest, PTOBalance, AuditLog, NotificationQueue } from '@/api/entities';
import { supabase } from '@/api/base44Client'; // KEEP THIS ONE
// DELETE THE DUPLICATE IMPORT ON LINE 9
import { format } from 'date-fns';

export default function PTOInbox({ user }) {
  console.log('PTOInbox mounted with user:', user);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingRequest, setProcessingRequest] = useState(null);
  const [responseNotes, setResponseNotes] = useState({});

  useEffect(() => {
    console.log('PTOInbox useEffect triggered, user:', user);
    if (user) {
      loadPendingRequests();
    }
  }, [user]);

  const loadPendingRequests = async () => {
    console.log('loadPendingRequests starting');
    try {
      // Use Supabase directly instead of PTORequest.filter
      const { data: pendingRequests, error } = await supabase
        .from('pto_requests')
        .select('*')
        .eq('status', 'pending');
      
      console.log('Direct Supabase query results:', pendingRequests);
      console.log('Direct Supabase query error:', error);
      
      if (error) {
        console.error('Error fetching pending requests:', error);
        setRequests([]);
        setLoading(false);
        return;
      }
      
      if (!pendingRequests || pendingRequests.length === 0) {
        console.log('No pending requests found');
        setRequests([]);
        setLoading(false);
        return;
      }
      
      // Get user details for each request
      const userIds = [...new Set(pendingRequests.map(r => r.user_id || r.employee_id))];
      console.log('User IDs to fetch:', userIds);
      
      if (userIds.length > 0) {
        const { data: profiles, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .in('id', userIds);
        
        if (profileError) {
          console.error('Error fetching profiles:', profileError);
        }
        
        console.log('Profiles fetched:', profiles);
        
        // Map users to requests
        const requestsWithUsers = pendingRequests.map(request => {
          const user = profiles?.find(p => p.id === request.user_id || p.id === request.employee_id);
          return {
            ...request,
            user: user || { full_name: 'Unknown User', email: 'unknown@example.com' }
          };
        });
        
        console.log('Final requests with users:', requestsWithUsers);
        setRequests(requestsWithUsers);
      }
    } catch (error) {
      console.error('Error in loadPendingRequests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (request) => {
    const note = responseNotes[request.id] || '';
    if (!note.trim()) {
      alert('Please provide a note for your decision.');
      return;
    }

    setProcessingRequest(request.id);
    try {
      const userId = user.user?.id || user.id;
      const userName = user.profile?.full_name || user.user?.email || 'Manager';
      
      // Update request status - using correct column names
      await PTORequest.update(request.id, {
        status: 'approved',
        approved_by: userId,  // Changed from approver_id
        note: note,           // Changed from approver_note
        approved_at: new Date().toISOString()
      });

      // Update PTO balance
      const balances = await PTOBalance.filter({ 
        user_id: request.user_id || request.employee_id 
      });
      
      if (balances.length > 0) {
        const balance = balances[0];
        const newBalanceHours = Math.max(0, balance.balance_hours - (request.total_hours || 0));
        await PTOBalance.update(balance.id, {
          balance_hours: newBalanceHours,
          used_hours: (balance.used_hours || 0) + (request.total_hours || 0)
        });
      }

      // Create audit log entry
      await AuditLog.create({
        actor_id: userId,
        actor_name: userName,
        action: 'pto.approve',
        entity_type: 'PTORequest',
        entity_id: request.id,
        details: `Approved PTO request for ${request.user.full_name}`,
        metadata: { 
          hours: request.total_hours,
          dates: `${request.start_date} to ${request.end_date}`,
          note: note
        }
      });

      // Queue notification
      await NotificationQueue.create({
        recipient_id: request.user.id,
        type: 'pto_approved',
        title: 'PTO Request Approved',
        message: `Your PTO request from ${format(new Date(request.start_date), 'MMM d')} to ${format(new Date(request.end_date), 'MMM d')} has been approved.\n\nManager note: ${note}`,
        metadata: { request_id: request.id }
      });

      // Clear the note and reload
      setResponseNotes(prev => ({ ...prev, [request.id]: '' }));
      await loadPendingRequests();
    } catch (error) {
      console.error('Error approving request:', error);
      alert('Failed to approve request. Please try again.');
    } finally {
      setProcessingRequest(null);
    }
  };

  const handleDeny = async (request) => {
    const note = responseNotes[request.id] || '';
    if (!note.trim()) {
      alert('Please provide a reason for denying this request.');
      return;
    }

    setProcessingRequest(request.id);
    try {
      const userId = user.user?.id || user.id;
      const userName = user.profile?.full_name || user.user?.email || 'Manager';
      
      // Update request status
      await PTORequest.update(request.id, {
        status: 'denied',
        approved_by: userId,
        note: note,
        approved_at: new Date().toISOString()
      });

      // Create audit log entry
      await AuditLog.create({
        actor_id: userId,
        actor_name: userName,
        action: 'pto.deny',
        entity_type: 'PTORequest',
        entity_id: request.id,
        details: `Denied PTO request for ${request.user.full_name}`,
        metadata: { 
          hours: request.total_hours,
          dates: `${request.start_date} to ${request.end_date}`,
          reason: note
        }
      });

      // Queue notification
      await NotificationQueue.create({
        recipient_id: request.user.id,
        type: 'pto_denied',
        title: 'PTO Request Denied',
        message: `Your PTO request from ${format(new Date(request.start_date), 'MMM d')} to ${format(new Date(request.end_date), 'MMM d')} has been denied.\n\nReason: ${note}`,
        metadata: { request_id: request.id }
      });

      // Clear the note and reload
      setResponseNotes(prev => ({ ...prev, [request.id]: '' }));
      await loadPendingRequests();
    } catch (error) {
      console.error('Error denying request:', error);
      alert('Failed to deny request. Please try again.');
    } finally {
      setProcessingRequest(null);
    }
  };

  const getTypeColor = (type) => {
    const colors = {
      vacation: 'bg-blue-100 text-blue-800',
      sick: 'bg-red-100 text-red-800',
      personal: 'bg-purple-100 text-purple-800',
      unpaid: 'bg-gray-100 text-gray-800'
    };
    return colors[type] || colors.vacation;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-slate-200 rounded w-1/4"></div>
            <div className="space-y-2">
              {Array(3).fill(0).map((_, i) => (
                <div key={i} className="h-16 bg-slate-200 rounded"></div>
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
          <Calendar className="w-5 h-5 text-indigo-600" />
          Pending PTO Requests ({requests.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {requests.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-slate-300" />
            <p className="text-slate-500">No pending PTO requests</p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <div key={request.id} className="border rounded-lg p-4 bg-slate-50">
                <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-semibold">{request.user.full_name || 'Unknown'}</span>
                      <Badge className={getTypeColor(request.type || request.request_type)}>
                        {(request.type || request.request_type || 'vacation').charAt(0).toUpperCase() + (request.type || request.request_type || 'vacation').slice(1)}
                      </Badge>
                      <Badge variant="outline">{request.total_hours || 0}h</Badge>
                    </div>
                    
                    <div className="text-sm text-slate-600 mb-2">
                      <strong>Dates:</strong> {format(new Date(request.start_date), 'MMM d, yyyy')} - {format(new Date(request.end_date), 'MMM d, yyyy')}
                    </div>

                    {(request.reason || request.note) && (
                      <div className="text-sm text-slate-600 mb-3">
                        <div className="flex items-start gap-1">
                          <MessageSquare className="w-3 h-3 mt-0.5" />
                          <span><strong>Note:</strong> {request.reason || request.note}</span>
                        </div>
                      </div>
                    )}

                    <div className="text-xs text-slate-500">
                      Requested {format(new Date(request.created_at || request.created_date), 'MMM d, yyyy \'at\' h:mm a')}
                    </div>
                  </div>

                  <div className="w-full md:w-96 space-y-3">
                    <Textarea
                      placeholder="Add a note about your decision..."
                      value={responseNotes[request.id] || ''}
                      onChange={(e) => setResponseNotes(prev => ({
                        ...prev,
                        [request.id]: e.target.value
                      }))}
                      rows={2}
                    />
                    
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleApprove(request)}
                        disabled={processingRequest === request.id}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approve
                      </Button>
                      <Button
                        onClick={() => handleDeny(request)}
                        disabled={processingRequest === request.id}
                        variant="outline"
                        className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Deny
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}