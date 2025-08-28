import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Clock, Save, X } from "lucide-react";

export default function TimeEntryForm({ entry, onSubmit, onCancel, title }) {
  const [formData, setFormData] = useState({
    start_time: entry?.start_time ? new Date(entry.start_time).toISOString().slice(0, 16) : '',
    end_time: entry?.end_time ? new Date(entry.end_time).toISOString().slice(0, 16) : '',
    project_code: entry?.project_code || '',
    note: entry?.note || ''
  });

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.start_time || !formData.end_time) return;

    setLoading(true);
    try {
      const startTime = new Date(formData.start_time);
      const endTime = new Date(formData.end_time);
      const durationMinutes = Math.round((endTime - startTime) / 1000 / 60);

      const submitData = {
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        duration_minutes: durationMinutes,
        project_code: formData.project_code || null,
        note: formData.note || null
      };

      await onSubmit(submitData);
    } catch (error) {
      console.error("Error submitting entry:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const calculateDuration = () => {
    if (!formData.start_time || !formData.end_time) return '';
    
    const start = new Date(formData.start_time);
    const end = new Date(formData.end_time);
    const diffMs = end - start;
    
    if (diffMs < 0) return 'Invalid time range';
    
    const hours = Math.floor(diffMs / 1000 / 60 / 60);
    const minutes = Math.floor((diffMs / 1000 / 60) % 60);
    
    return `${hours}h ${minutes}m`;
  };

  return (
    <Card className="bg-white shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-600" />
          {title}
        </CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_time">Start Time</Label>
              <Input
                id="start_time"
                type="datetime-local"
                value={formData.start_time}
                onChange={(e) => handleInputChange('start_time', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_time">End Time</Label>
              <Input
                id="end_time"
                type="datetime-local"
                value={formData.end_time}
                onChange={(e) => handleInputChange('end_time', e.target.value)}
                required
              />
            </div>
          </div>

          {formData.start_time && formData.end_time && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="text-sm text-blue-700">
                <strong>Duration:</strong> {calculateDuration()}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="project_code">Project Code (Optional)</Label>
            <Input
              id="project_code"
              value={formData.project_code}
              onChange={(e) => handleInputChange('project_code', e.target.value)}
              placeholder="Project or job code"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">Note (Optional)</Label>
            <Textarea
              id="note"
              value={formData.note}
              onChange={(e) => handleInputChange('note', e.target.value)}
              placeholder="Add any notes about this time entry"
              rows={3}
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading || !formData.start_time || !formData.end_time}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Saving...' : 'Save Entry'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}