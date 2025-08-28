import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, X, MessageSquare } from "lucide-react";
import { format } from "date-fns";

export default function PTORequestList({ requests, onCancel, canCancel = false }) {
  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      approved: "bg-green-100 text-green-800 border-green-200",
      denied: "bg-red-100 text-red-800 border-red-200",
      cancelled: "bg-gray-100 text-gray-800 border-gray-200"
    };
    return colors[status] || colors.pending;
  };

  const getTypeColor = (type) => {
    const colors = {
      vacation: "bg-blue-100 text-blue-800",
      sick: "bg-red-100 text-red-800",
      personal: "bg-purple-100 text-purple-800"
    };
    return colors[type] || colors.vacation;
  };

  if (requests.length === 0) {
    return (
      <Card className="bg-white shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-slate-600" />
            PTO Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Clock className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No PTO Requests</h3>
            <p className="text-slate-600">You haven't submitted any time off requests yet.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-slate-600" />
          PTO Requests ({requests.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {requests.map((request) => (
            <div key={request.id} className="border rounded-xl p-4 bg-slate-50">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Badge className={getTypeColor(request.type)}>
                    {request.type.charAt(0).toUpperCase() + request.type.slice(1)}
                  </Badge>
                  <Badge className={`${getStatusColor(request.status)} border`}>
                    {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                  </Badge>
                </div>
                <div className="text-right">
                  <div className="font-bold text-slate-900">{request.total_hours}h</div>
                  <div className="text-xs text-slate-500">
                    {(request.total_hours / 8).toFixed(1)} days
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                <div>
                  <div className="text-sm text-slate-600">Dates</div>
                  <div className="font-medium text-slate-900">
                    {format(new Date(request.start_date), 'MMM d, yyyy')} - {format(new Date(request.end_date), 'MMM d, yyyy')}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-slate-600">Requested</div>
                  <div className="font-medium text-slate-900">
                    {format(new Date(request.created_date), 'MMM d, yyyy')}
                  </div>
                </div>
              </div>

              {request.partial_day_hours && (
                <div className="mb-3">
                  <div className="text-sm text-slate-600">Partial Day</div>
                  <div className="font-medium text-slate-900">{request.partial_day_hours} hours</div>
                </div>
              )}

              {request.note && (
                <div className="mb-3">
                  <div className="text-sm text-slate-600 flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" />
                    Note
                  </div>
                  <div className="text-slate-900">{request.note}</div>
                </div>
              )}

              {request.approver_note && (
                <div className="mb-3 p-3 bg-slate-100 rounded-lg">
                  <div className="text-sm text-slate-600">Manager Response</div>
                  <div className="text-slate-900">{request.approver_note}</div>
                  {request.approved_at && (
                    <div className="text-xs text-slate-500 mt-1">
                      {format(new Date(request.approved_at), 'MMM d, yyyy \'at\' h:mm a')}
                    </div>
                  )}
                </div>
              )}

              {canCancel && request.status === 'pending' && (
                <div className="flex justify-end pt-3 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onCancel(request.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel Request
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}