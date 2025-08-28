import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { TimeEntry } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, Edit, Save, X } from "lucide-react";
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, isSameWeek, isToday } from "date-fns";

import WeeklyTimesheet from "../components/timesheet/WeeklyTimesheet";
import TimeEntryForm from "../components/timesheet/TimeEntryForm";
import WeekNavigator from "../components/timesheet/WeekNavigator";

export default function TimeSheet() {
  const [user, setUser] = useState(null);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingEntry, setEditingEntry] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (user) {
      loadWeekEntries();
    }
  }, [user, currentWeek]);

  const loadUser = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);
    } catch (error) {
      console.error("Error loading user:", error);
    }
  };

  const loadWeekEntries = async () => {
    setLoading(true);
    try {
      const weekStart = startOfWeek(currentWeek);
      const weekEnd = endOfWeek(currentWeek);

      const allEntries = await TimeEntry.filter({
        user_id: user.id
      }, "-start_time");

      const weekEntries = allEntries.filter(entry => {
        const entryDate = new Date(entry.start_time);
        return entryDate >= weekStart && entryDate <= weekEnd;
      });

      setEntries(weekEntries);
    } catch (error) {
      console.error("Error loading entries:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePreviousWeek = () => {
    setCurrentWeek(prev => subWeeks(prev, 1));
  };

  const handleNextWeek = () => {
    setCurrentWeek(prev => addWeeks(prev, 1));
  };

  const handleCurrentWeek = () => {
    setCurrentWeek(new Date());
  };

  const handleAddEntry = async (entryData) => {
    try {
      await TimeEntry.create({
        ...entryData,
        user_id: user.id,
        status: "draft"
      });
      
      await loadWeekEntries();
      setShowAddForm(false);
    } catch (error) {
      console.error("Error adding entry:", error);
    }
  };

  const handleEditEntry = async (entryId, entryData) => {
    try {
      await TimeEntry.update(entryId, entryData);
      await loadWeekEntries();
      setEditingEntry(null);
    } catch (error) {
      console.error("Error updating entry:", error);
    }
  };

  const handleSubmitWeek = async () => {
    try {
      const promises = entries
        .filter(entry => entry.status === "draft")
        .map(entry => TimeEntry.update(entry.id, { status: "submitted" }));
      
      await Promise.all(promises);
      await loadWeekEntries();
    } catch (error) {
      console.error("Error submitting week:", error);
    }
  };

  const calculateWeekHours = () => {
    return entries.reduce((total, entry) => {
      return total + (entry.duration_minutes || 0);
    }, 0) / 60;
  };

  const weekHours = calculateWeekHours();
  const isCurrentWeek = isSameWeek(currentWeek, new Date());
  const canEdit = isCurrentWeek || user?.role === 'admin';
  const hasSubmittedEntries = entries.some(entry => entry.status !== "draft");
  const canSubmit = entries.length > 0 && !hasSubmittedEntries && isCurrentWeek;

  if (loading && !entries.length) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-200 rounded w-1/4"></div>
          <div className="h-96 bg-slate-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 bg-slate-50 min-h-screen">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Timesheet</h1>
          <p className="text-slate-600 mt-1">
            Week of {format(startOfWeek(currentWeek), 'MMM d')} - {format(endOfWeek(currentWeek), 'MMM d, yyyy')}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {canSubmit && (
            <Button 
              onClick={handleSubmitWeek}
              className="bg-green-600 hover:bg-green-700"
            >
              <Save className="w-4 h-4 mr-2" />
              Submit Week
            </Button>
          )}
          
          {canEdit && (
            <Button 
              onClick={() => setShowAddForm(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Clock className="w-4 h-4 mr-2" />
              Add Entry
            </Button>
          )}
        </div>
      </div>

      {/* Week Summary */}
      <Card className="bg-white shadow-lg">
        <CardContent className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-900">{weekHours.toFixed(1)}h</div>
              <div className="text-sm text-slate-600">Total Hours</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-900">{Math.min(weekHours, 40).toFixed(1)}h</div>
              <div className="text-sm text-slate-600">Regular</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{Math.max(0, weekHours - 40).toFixed(1)}h</div>
              <div className="text-sm text-slate-600">Overtime</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-900">{entries.length}</div>
              <div className="text-sm text-slate-600">Entries</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Week Navigator */}
      <WeekNavigator
        currentWeek={currentWeek}
        onPrevious={handlePreviousWeek}
        onNext={handleNextWeek}
        onCurrent={handleCurrentWeek}
        isCurrentWeek={isCurrentWeek}
      />

      {/* Weekly Timesheet */}
      <WeeklyTimesheet
        entries={entries}
        currentWeek={currentWeek}
        canEdit={canEdit}
        onEdit={setEditingEntry}
        loading={loading}
      />

      {/* Add Entry Form */}
      {showAddForm && (
        <TimeEntryForm
          onSubmit={handleAddEntry}
          onCancel={() => setShowAddForm(false)}
          title="Add Time Entry"
        />
      )}

      {/* Edit Entry Form */}
      {editingEntry && (
        <TimeEntryForm
          entry={editingEntry}
          onSubmit={(data) => handleEditEntry(editingEntry.id, data)}
          onCancel={() => setEditingEntry(null)}
          title="Edit Time Entry"
        />
      )}
    </div>
  );
}