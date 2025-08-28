import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, XCircle, Calendar, MessageSquare } from 'lucide-react';
import { PTORequest } from '@/api/entities';
import { PTOBalance } from '@/api/entities';
import { User } from '@/api/entities';
import { AuditLog } from '@/api/entities';
import { NotificationQueue } from '@/api/entities';
import { format } from 'date-fns';

export default function PTOInbox({ user }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingRequest, setProcessingRequest] = useState(null);
  const [responseNote, setResponseNote] = useState('');

  useEffect(() => {
    loadPendingRequests();
  }, [user]);

  const loadPendingRequests = async () => {
    try {
      const pendingRequests = await PTORequest.filter({ status: 'pending' });
      
      // Get user details for each request
      const requestsWithUsers = await Promise.all(
        pendingRequests.map(async (request) => {
          const requestUser = await User.filter({ id: request.user_id });
          return {
            ...request,
            user: requestUser[0] || { full_name: 'Unknown', email: 'unknown@example.com' }
          };
        })
      );

      // Filter by user's department if they're a manager
      let filteredRequests = requestsWithUsers;
      if (user.role === 'manager') {
        filteredRequests = requestsWithUsers.filter(req => 
          req.user.department === user.department
        );
      }

      setRequests(filteredRequests);
    } catch (error) {
      console.error('Error loading pending requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (request) => {
    if (!responseNote.trim()) {
      alert('Please provide a note for your decision.');
      return;
    }

    setProcessingRequest(request.id);
    try {
      // Update request status
      await PTORequest.update(request.id, {
        status: 'approved',
        approver_id: user.id,
        approver_note: responseNote,
        approved_at: new Date().toISOString()
      });

      // Deduct PTO balance
      const balances = await PTOBalance.filter({ user_id: request.user_id });
      if (balances.length > 0) {
        const balance = balances[0];
        await PTOBalance.update(balance.id, {
          balance_hours: balance.balance_hours - request.total_hours,
          used_hours: (balance.used_hours || 0) + request.total_hours
        });
      }

      // Create audit log entry
      await AuditLog.create({
        actor_id: user.id,
        actor_name: user.full_name,
        action: 'pto.approve',
        entity_type: 'PTORequest',
        entity_id: request.id,
        details: `Approved PTO request for ${request.user.full_name}`,
        metadata: { 
          hours: request.total_hours,
          dates: `${request.start_date} to ${request.end_date}`,
          note: responseNote
        }
      });

      // Queue notification
      await NotificationQueue.create({
        recipient: request.user.email,
        subject: 'PTO Request Approved',
        message: `Your PTO request for ${request.total_hours} hours from ${format(new Date(request.start_date), 'MMM d')} to ${format(new Date(request.end_date), 'MMM d')} has been approved.\n\nManager note: ${responseNote}`,
        metadata: { request_id: request.id, type: 'pto_approved' }
      });

      setResponseNote('');
      await loadPendingRequests();
    } catch (error) {
      console.error('Error approving request:', error);
    } finally {
      setProcessingRequest(null);
    }
  };

  const handleDeny = async (request) => {
    if (!responseNote.trim()) {
      alert('Please provide a reason for denying this request.');
      return;
    }

    setProcessingRequest(request.id);
    try {
      // Update request status
      await PTORequest.update(request.id, {
        status: 'denied',
        approver_id: user.id,
        approver_note: responseNote,
        approved_at: new Date().toISOString()
      });

      // Create audit log entry
      await AuditLog.create({
        actor_id: user.id,
        actor_name: user.full_name,
        action: 'pto.deny',
        entity_type: 'PTORequest',
        entity_id: request.id,
        details: `Denied PTO request for ${request.user.full_name}`,
        metadata: { 
          hours: request.total_hours,
          dates: `${request.start_date} to ${request.end_date}`,
          reason: responseNote
        }
      });

      // Queue notification
      await NotificationQueue.create({
        recipient: request.user.email,
        subject: 'PTO Request Denied',
        message: `Your PTO request for ${request.total_hours} hours from ${format(new Date(request.start_date), 'MMM d')} to ${format(new Date(request.end_date), 'MMM d')} has been denied.\n\nReason: ${responseNote}`,
        metadata: { request_id: request.id, type: 'pto_denied' }
      });

      setResponseNote('');
      await loadPendingRequests();
    } catch (error) {
      console.error('Error denying request:', error);
    } finally {
      setProcessingRequest(null);
    }
  };

  const getTypeColor = (type) => {
    const colors = {
      vacation: 'bg-blue-100 text-blue-800',
      sick: 'bg-red-100 text-red-800',
      personal: 'bg-purple-100 text-purple-800'
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
                      <span className="font-semibold">{request.user.full_name}</span>
                      <Badge className={getTypeColor(request.type)}>
                        {request.type.charAt(0).toUpperCase() + request.type.slice(1)}
                      </Badge>
                      <Badge variant="outline">{request.total_hours}h</Badge>
                    </div>
                    
                    <div className="text-sm text-slate-600 mb-2">
                      <strong>Dates:</strong> {format(new Date(request.start_date), 'MMM d, yyyy')} - {format(new Date(request.end_date), 'MMM d, yyyy')}
                    </div>

                    {request.note && (
                      <div className="text-sm text-slate-600 mb-3">
                        <div className="flex items-start gap-1">
                          <MessageSquare className="w-3 h-3 mt-0.5" />
                          <span><strong>Note:</strong> {request.note}</span>
                        </div>
                      </div>
                    )}

                    <div className="text-xs text-slate-500">
                      Requested {format(new Date(request.created_date), 'MMM d, yyyy \'at\' h:mm a')}
                    </div>
                  </div>

                  <div className="w-full md:w-96 space-y-3">
                    <Textarea
                      placeholder="Add a note about your decision..."
                      value={responseNote}
                      onChange={(e) => setResponseNote(e.target.value)}
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