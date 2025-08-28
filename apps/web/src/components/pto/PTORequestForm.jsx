import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calendar, Save, X, AlertTriangle, Info } from "lucide-react";
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
    const businessDays = differenceInBusinessDays(endDate, startDate) + 1;
    
    return businessDays * 8; // Assuming 8 hours per day
  };

  const totalHours = calculateTotalHours();
  const availableBalance = balance?.balance_hours || 0;
  const isUnpaidRequest = formData.type === 'unpaid';
  const insufficientBalance = !isUnpaidRequest && totalHours > availableBalance;
  const willUseUnpaidTime = !isUnpaidRequest && totalHours > availableBalance && availableBalance > 0;

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
              <Label htmlFor="type">Time Off Type</Label>
              <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select time off type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vacation">Paid Vacation</SelectItem>
                  <SelectItem value="sick">Paid Sick Leave</SelectItem>
                  <SelectItem value="personal">Paid Personal Time</SelectItem>
                  <SelectItem value="unpaid">Unpaid Time Off</SelectItem>
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
            <div className={`p-4 rounded-lg border ${
              isUnpaidRequest ? 'bg-blue-50 border-blue-200' :
              insufficientBalance ? 'bg-red-50 border-red-200' :
              willUseUnpaidTime ? 'bg-yellow-50 border-yellow-200' :
              'bg-green-50 border-green-200'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                {(insufficientBalance || willUseUnpaidTime) && !isUnpaidRequest && <AlertTriangle className="w-4 h-4 text-yellow-600" />}
                {isUnpaidRequest && <Info className="w-4 h-4 text-blue-600" />}
                <span className={`font-medium ${
                  isUnpaidRequest ? 'text-blue-900' :
                  insufficientBalance ? 'text-red-900' :
                  willUseUnpaidTime ? 'text-yellow-900' :
                  'text-green-900'
                }`}>
                  Request Summary
                </span>
              </div>
              <div className={`text-sm ${
                isUnpaidRequest ? 'text-blue-700' :
                insufficientBalance ? 'text-red-700' :
                willUseUnpaidTime ? 'text-yellow-700' :
                'text-green-700'
              }`}>
                <div>Total hours requested: <strong>{totalHours}h</strong></div>
                {!isUnpaidRequest && (
                  <>
                    <div>Available paid balance: <strong>{availableBalance}h</strong></div>
                    {willUseUnpaidTime && (
                      <div className="mt-2 font-medium">
                        This request will use {availableBalance}h of paid time and {(totalHours - availableBalance).toFixed(1)}h of unpaid time.
                      </div>
                    )}
                  </>
                )}
                {isUnpaidRequest && (
                  <div className="mt-2 font-medium">
                    This is an unpaid time off request - no paid balance will be used.
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="note">Reason/Note</Label>
            <Textarea
              id="note"
              value={formData.note}
              onChange={(e) => handleInputChange('note', e.target.value)}
              placeholder="Add details about your time off request..."
              rows={3}
              required={isUnpaidRequest}
            />
            {isUnpaidRequest && (
              <div className="text-xs text-slate-500">
                Note is required for unpaid time off requests
              </div>
            )}
          </div>

          {insufficientBalance && !isUnpaidRequest && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                You don't have enough paid balance for this request. Consider selecting "Unpaid Time Off" or reducing the requested hours.
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
            disabled={loading || (insufficientBalance && !isUnpaidRequest) || totalHours === 0 || (isUnpaidRequest && !formData.note)}
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