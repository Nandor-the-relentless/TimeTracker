// apps/web/src/pages/TimeSheet.jsx
import React, { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Clock, Save } from "lucide-react"
import {
  format,
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
  isSameWeek,
  differenceInMinutes,
} from "date-fns"

import WeeklyTimesheet from "../components/timesheet/WeeklyTimesheet"
import TimeEntryForm from "../components/timesheet/TimeEntryForm"
import WeekNavigator from "../components/timesheet/WeekNavigator"

import { clockIn, clockOut, getOpenEntry, listWeekEntries } from "@/api/timeClock"
import { supabase } from "@/api/entities" // only for auth guard in this file

// tiny toast shim
let toast = ({ title, description }) => window.alert(`${title}${description ? "\n" + description : ""}`)
try {
  const { useToast } = require("@/components/ui/use-toast")
  toast = useToast().toast
} catch {}

/* live ticking clock */
function useLiveTimer(isOn, startISO) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!isOn || !startISO) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [isOn, startISO])
  return useMemo(() => {
    if (!isOn || !startISO) return { minutes: 0, hhmm: "00:00" }
    const ms = now - new Date(startISO).getTime()
    const mins = Math.max(0, Math.floor(ms / 60000))
    const h = Math.floor(mins / 60).toString().padStart(2, "0")
    const m = (mins % 60).toString().padStart(2, "0")
    return { minutes: mins, hhmm: `${h}:${m}` }
  }, [isOn, startISO, now])
}

export default function TimeSheet() {
  const [authed, setAuthed] = useState(false)
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingEntry, setEditingEntry] = useState(null)
  const [showAddForm, setShowAddForm] = useState(false)

  const [openEntry, setOpenEntry] = useState(null)
  const isClockedIn = !!openEntry
  const live = useLiveTimer(isClockedIn, openEntry?.start_time)

  // auth guard
  useEffect(() => {
    let unsub
    ;(async () => {
      const { data } = await supabase.auth.getSession()
      setAuthed(!!data.session)
      unsub = supabase.auth.onAuthStateChange((_e, s) => setAuthed(!!s)).data.subscription
    })()
    return () => unsub?.unsubscribe()
  }, [])

  useEffect(() => {
    if (!authed) return
    loadAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed, currentWeek])

  async function loadAll() {
    setLoading(true)
    try {
      // open entry
      const open = await getOpenEntry()
      setOpenEntry(open)

      // week entries
      const ws = startOfWeek(currentWeek)
      const we = endOfWeek(currentWeek)
      const rows = await listWeekEntries(ws.toISOString(), we.toISOString())
      // compute duration if DB trigger not set
      const normalized = rows.map(r => {
        let duration = r.duration_minutes
        if (duration == null && r.start_time && r.end_time) {
          try { duration = differenceInMinutes(new Date(r.end_time), new Date(r.start_time)) } catch { duration = 0 }
        }
        return { ...r, duration_minutes: duration ?? 0 }
      })
      setEntries(normalized)
    } catch (e) {
      console.error(e)
      toast({ title: "Load failed", description: e.message })
    } finally {
      setLoading(false)
    }
  }

  function handlePreviousWeek() { setCurrentWeek(prev => subWeeks(prev, 1)) }
  function handleNextWeek() { setCurrentWeek(prev => addWeeks(prev, 1)) }
  function handleCurrentWeek() { setCurrentWeek(new Date()) }

  async function handleClockIn() {
    try {
      const row = await clockIn()
      setOpenEntry(row)                   // start ticking immediately
      await loadAll()                     // refresh weekly list
      toast({ title: "Clocked in" })
    } catch (e) {
      console.error(e)
      toast({ title: "Clock in failed", description: e.message })
    }
  }

  async function handleClockOut() {
    try {
      if (!openEntry) return
      await clockOut(openEntry.id)
      setOpenEntry(null)                  // stop ticking & reset
      await loadAll()                     // refresh list with completed row
      toast({ title: "Clocked out" })
    } catch (e) {
      console.error(e)
      toast({ title: "Clock out failed", description: e.message })
    }
  }

  async function handleAddEntry(entryData) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('time_entries')
        .insert({
          user_id: user.id,
          ...entryData
        });
      
      if (error) throw error;
      
      toast({ title: "Entry added successfully" });
      await loadAll(); // Reload entries
      setShowAddForm(false);
    } catch (e) {
      toast({ title: "Add failed", description: e.message });
    }
  }

  const weekHours = (entries.reduce((t, e) => t + (e.duration_minutes || 0), 0) / 60)
  const isCurrentWeek = isSameWeek(currentWeek, new Date())
  const canEdit = isCurrentWeek // or add role logic if needed
  const hasSubmittedEntries = entries.some(e => e.status && e.status !== "draft")
  const canSubmit = entries.length > 0 && !hasSubmittedEntries && isCurrentWeek

  if (!authed) return null
  if (loading && entries.length === 0) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-200 rounded w-1/4"></div>
          <div className="h-96 bg-slate-200 rounded-xl"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 bg-slate-50 min-h-screen">
      {/* Header + actions */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Timesheet</h1>
          <p className="text-slate-600 mt-1">
            Week of {format(startOfWeek(currentWeek), "MMM d")} - {format(endOfWeek(currentWeek), "MMM d, yyyy")}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {canSubmit && (
            <Button onClick={() => toast({ title: "Submit not wired here" })} className="bg-green-600 hover:bg-green-700">
              <Save className="w-4 h-4 mr-2" />
              Submit Week
            </Button>
          )}
          {canEdit && (
            <Button onClick={() => setShowAddForm(true)} className="bg-blue-600 hover:bg-blue-700">
              <Clock className="w-4 h-4 mr-2" />
              Add Entry
            </Button>
          )}
        </div>
      </div>

      {/* Live Clock card */}
      <Card className="bg-white shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${isClockedIn ? "bg-green-500" : "bg-slate-300"}`} />
              <div>
                <div className="text-sm text-slate-500">Status</div>
                <div className="text-base font-medium text-slate-900">
                  {isClockedIn ? "Clocked In" : "Clocked Out"}
                </div>
                {isClockedIn && openEntry?.start_time ? (
                  <div className="text-xs text-slate-500 mt-1">
                    Since {new Date(openEntry.start_time).toLocaleString()}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-3xl font-mono tabular-nums">{live.hhmm}</div>
              <div className="flex gap-3">
                <Button
                  disabled={isClockedIn}
                  onClick={handleClockIn}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
                >
                  Clock In
                </Button>
                <Button
                  disabled={!isClockedIn}
                  onClick={handleClockOut}
                  className="bg-rose-600 hover:bg-rose-700 disabled:opacity-50"
                >
                  Clock Out
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

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
          onSubmit={async (updatedData) => {
            try {
              // Update the entry in the database
              const { error } = await supabase
                .from('time_entries')
                .update({
                  start_time: updatedData.start_time,
                  end_time: updatedData.end_time,
                  duration_minutes: updatedData.duration_minutes,
                  project_code: updatedData.project_code,
                  note: updatedData.note
                })
                .eq('id', editingEntry.id);
              
              if (error) throw error;
              
              toast({ title: "Entry updated successfully" });
              await loadAll(); // Reload entries
              setEditingEntry(null);
            } catch (error) {
              console.error("Error updating entry:", error);
              toast({ title: "Update failed", description: error.message });
            }
          }}
          onCancel={() => setEditingEntry(null)}
          title="Edit Time Entry"
        />
      )}
    </div>
  )
}