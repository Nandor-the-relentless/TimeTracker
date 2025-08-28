import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Calendar } from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";

export default function RecentActivity({ entries, user }) {
  const formatTime = (dateString) => {
    return format(new Date(dateString), 'h:mm a');
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMM d');
  };

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: "bg-slate-100 text-slate-800",
      submitted: "bg-blue-100 text-blue-800", 
      approved: "bg-green-100 text-green-800",
      locked: "bg-gray-100 text-gray-800"
    };
    return colors[status] || colors.draft;
  };

  return (
    <Card className="bg-white shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-green-600" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="w-12 h-12 mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500">No recent time entries</p>
            <p className="text-sm text-slate-400">Clock in to get started!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {entries.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-slate-900">
                      {formatDate(entry.start_time)}
                    </span>
                    <Badge className={getStatusColor(entry.status)}>
                      {entry.status}
                    </Badge>
                  </div>
                  <div className="text-sm text-slate-600">
                    {formatTime(entry.start_time)} - {entry.end_time ? formatTime(entry.end_time) : 'In progress'}
                  </div>
                  {entry.project_code && (
                    <div className="text-xs text-slate-500 mt-1">
                      Project: {entry.project_code}
                    </div>
                  )}
                  {entry.note && (
                    <div className="text-xs text-slate-500 mt-1">
                      {entry.note}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className="font-bold text-slate-900">
                    {entry.duration_minutes ? formatDuration(entry.duration_minutes) : '0h 0m'}
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