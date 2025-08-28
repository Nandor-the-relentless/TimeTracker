import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Clock } from "lucide-react";
import { format, eachDayOfInterval, startOfWeek, endOfWeek, isSameDay } from "date-fns";

export default function WeeklyTimesheet({ entries, currentWeek, canEdit, onEdit, loading }) {
  const weekDays = eachDayOfInterval({
    start: startOfWeek(currentWeek),
    end: endOfWeek(currentWeek)
  });

  const getEntriesForDay = (day) => {
    return entries.filter(entry => {
      const entryDate = new Date(entry.start_time);
      return isSameDay(entryDate, day);
    });
  };

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatTime = (dateString) => {
    return format(new Date(dateString), 'h:mm a');
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

  const getDayTotal = (day) => {
    const dayEntries = getEntriesForDay(day);
    return dayEntries.reduce((total, entry) => total + (entry.duration_minutes || 0), 0);
  };

  if (loading) {
    return (
      <Card className="bg-white shadow-lg">
        <CardHeader>
          <CardTitle>Weekly Timesheet</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {Array(7).fill(0).map((_, i) => (
              <div key={i} className="h-20 bg-slate-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-600" />
          Weekly Timesheet
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {weekDays.map((day) => {
            const dayEntries = getEntriesForDay(day);
            const dayTotal = getDayTotal(day);
            const isToday = isSameDay(day, new Date());

            return (
              <div
                key={day.toISOString()}
                className={`border rounded-xl p-4 ${isToday ? 'border-blue-200 bg-blue-50/30' : 'border-slate-200'}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div>
                      <h3 className="font-semibold text-slate-900">
                        {format(day, 'EEEE')}
                      </h3>
                      <p className="text-sm text-slate-600">
                        {format(day, 'MMM d, yyyy')}
                      </p>
                    </div>
                    {isToday && (
                      <Badge className="bg-blue-100 text-blue-800">Today</Badge>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-slate-900">
                      {formatDuration(dayTotal)}
                    </div>
                    <div className="text-sm text-slate-600">
                      {dayEntries.length} {dayEntries.length === 1 ? 'entry' : 'entries'}
                    </div>
                  </div>
                </div>

                {dayEntries.length === 0 ? (
                  <div className="text-center py-6 text-slate-400">
                    <Clock className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="text-sm">No time entries</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {dayEntries.map((entry) => (
                      <div
                        key={entry.id}
                        className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-slate-900">
                              {formatTime(entry.start_time)} - {entry.end_time ? formatTime(entry.end_time) : 'In progress'}
                            </span>
                            <Badge className={getStatusColor(entry.status)}>
                              {entry.status}
                            </Badge>
                          </div>
                          {entry.project_code && (
                            <div className="text-sm text-slate-600 mb-1">
                              Project: {entry.project_code}
                            </div>
                          )}
                          {entry.note && (
                            <div className="text-sm text-slate-500">
                              {entry.note}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="font-bold text-slate-900">
                              {formatDuration(entry.duration_minutes || 0)}
                            </div>
                          </div>
                          {canEdit && entry.status === 'draft' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onEdit(entry)}
                              className="text-slate-500 hover:text-slate-700"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}