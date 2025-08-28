import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calendar, Save, X, AlertTriangle } from "lucide-react";
import { differenceInBusinessDays, parseISO } from "date-fns";

export default function PTORequestForm({ balance, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    type: '',
    start_date: '',
    end_date: '',
    partial_day_hours: '',
    note: ''
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const newErrors = {};
    
    if (!formData.type) newErrors.type = "Please select a PTO type";
    if (!formData.start_date) newErrors.start_date = "Please select a start date";
    if (!formData.end_date) newErrors.end_date = "Please select an end date";
    
    if (formData.start_date && formData.end_date) {
      const startDate = parseISO(formData.start_date);
      const endDate = parseISO(formData.end_date);
      
      if (endDate < startDate) {
        newErrors.end_date = "End date cannot be before start date";
      }
    }
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) return;

    setLoading(true);
    try {
      const totalHours = calculateTotalHours();
      
      const submitData = {
        type: formData.type,
        start_date: formData.start_date,
        end_date: formData.end_date,
        partial_day_hours: formData.partial_day_hours ? parseFloat(formData.partial_day_hours) : null,
        total_hours: totalHours,
        note: formData.note || null
      };

      await onSubmit(submitData);
    } catch (error) {
      console.error("Error submitting PTO request:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const calculateTotalHours = () => {
    if (!formData.start_date || !formData.end_date) return 0;
    
    if (formData.partial_day_hours) {
      return parseFloat(formData.partial_day_hours);
    }
    
    const startDate = parseISO(formData.start_date);
    const endDate = parseISO(formData.end_date);
    const businessDays = differenceInBusinessDays(endDate, startDate) + 1; // +1 to include both start and end dates
    
    return businessDays * 8; // Assuming 8 hours per day
  };

  const totalHours = calculateTotalHours();
  const availableBalance = balance?.balance_hours || 0;
  const insufficientBalance = totalHours > availableBalance;

  return (
    <Card className="bg-white shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-indigo-600" />
          Request Time Off
        </CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">PTO Type</Label>
              <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select PTO type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vacation">Vacation</SelectItem>
                  <SelectItem value="sick">Sick Leave</SelectItem>
                  <SelectItem value="personal">Personal Time</SelectItem>
                </SelectContent>
              </Select>
              {errors.type && <div className="text-sm text-red-600">{errors.type}</div>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="partial_day_hours">Partial Day Hours (Optional)</Label>
              <Input
                id="partial_day_hours"
                type="number"
                step="0.5"
                min="0.5"
                max="8"
                value={formData.partial_day_hours}
                onChange={(e) => handleInputChange('partial_day_hours', e.target.value)}
                placeholder="e.g., 4 for half day"
              />
              <div className="text-xs text-slate-500">
                Leave blank for full days
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Start Date</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => handleInputChange('start_date', e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
              {errors.start_date && <div className="text-sm text-red-600">{errors.start_date}</div>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_date">End Date</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => handleInputChange('end_date', e.target.value)}
                min={formData.start_date || new Date().toISOString().split('T')[0]}
              />
              {errors.end_date && <div className="text-sm text-red-600">{errors.end_date}</div>}
            </div>
          </div>

          {totalHours > 0 && (
            <div className={`p-4 rounded-lg ${insufficientBalance ? 'bg-red-50 border border-red-200' : 'bg-blue-50 border border-blue-200'}`}>
              <div className="flex items-center gap-2 mb-2">
                {insufficientBalance && <AlertTriangle className="w-4 h-4 text-red-600" />}
                <span className={`font-medium ${insufficientBalance ? 'text-red-900' : 'text-blue-900'}`}>
                  Request Summary
                </span>
              </div>
              <div className={`text-sm ${insufficientBalance ? 'text-red-700' : 'text-blue-700'}`}>
                <div>Total hours requested: <strong>{totalHours}h</strong></div>
                <div>Available balance: <strong>{availableBalance}h</strong></div>
                {insufficientBalance && (
                  <div className="mt-2 font-medium">
                    ⚠️ Insufficient balance (need {(totalHours - availableBalance).toFixed(1)}h more)
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="note">Reason/Note (Optional)</Label>
            <Textarea
              id="note"
              value={formData.note}
              onChange={(e) => handleInputChange('note', e.target.value)}
              placeholder="Add any additional details about your time off request"
              rows={3}
            />
          </div>

          {insufficientBalance && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                You don't have enough PTO balance for this request. Please adjust your dates or request partial days.
              </AlertDescription>
            </Alert>
          )}
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
            disabled={loading || insufficientBalance || totalHours === 0}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Submitting...' : 'Submit Request'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}