import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Clock, Play, Square, Timer } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function QuickClockActions({ 
  currentEntry, 
  onClockIn, 
  onClockOut, 
  loading,
  getCurrentDuration 
}) {
  const [showClockInForm, setShowClockInForm] = useState(false);
  const [projectCode, setProjectCode] = useState("");
  const [note, setNote] = useState("");

  const handleClockIn = async () => {
    await onClockIn(projectCode, note);
    setProjectCode("");
    setNote("");
    setShowClockInForm(false);
  };

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <Card className="bg-white shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-600" />
          Time Clock
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {currentEntry ? (
          <>
            <div className="text-center p-6 bg-green-50 rounded-xl">
              <div className="w-16 h-16 mx-auto mb-4 bg-green-600 rounded-full flex items-center justify-center">
                <Timer className="w-8 h-8 text-white animate-pulse" />
              </div>
              <Badge className="bg-green-100 text-green-800 mb-3">CLOCKED IN</Badge>
              <p className="text-2xl font-bold text-green-900 mb-1">
                {formatDuration(getCurrentDuration())}
              </p>
              <p className="text-sm text-green-700">
                Since {new Date(currentEntry.start_time).toLocaleTimeString()}
              </p>
              {currentEntry.project_code && (
                <p className="text-xs text-green-600 mt-2">
                  Project: {currentEntry.project_code}
                </p>
              )}
            </div>
            
            <Button 
              onClick={onClockOut}
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 text-white py-6 text-lg font-semibold rounded-xl"
            >
              <Square className="w-5 h-5 mr-2" />
              Clock Out
            </Button>
          </>
        ) : (
          <>
            <div className="text-center p-6 bg-slate-50 rounded-xl">
              <div className="w-16 h-16 mx-auto mb-4 bg-slate-200 rounded-full flex items-center justify-center">
                <Clock className="w-8 h-8 text-slate-500" />
              </div>
              <Badge variant="secondary" className="mb-3">CLOCKED OUT</Badge>
              <p className="text-slate-600">Ready to start your day?</p>
            </div>

            {!showClockInForm ? (
              <Button 
                onClick={() => setShowClockInForm(true)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 text-lg font-semibold rounded-xl"
              >
                <Play className="w-5 h-5 mr-2" />
                Clock In
              </Button>
            ) : (
              <div className="space-y-3">
                <Input
                  placeholder="Project code (optional)"
                  value={projectCode}
                  onChange={(e) => setProjectCode(e.target.value)}
                />
                <Textarea
                  placeholder="Note (optional)"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                />
                <div className="flex gap-2">
                  <Button
                    onClick={handleClockIn}
                    disabled={loading}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Start Timer
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowClockInForm(false);
                      setProjectCode("");
                      setNote("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}