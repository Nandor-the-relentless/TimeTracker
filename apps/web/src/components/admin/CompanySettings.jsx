
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, Settings } from 'lucide-react';
import { Settings as SettingsEntity } from '@/api/entities';
import { AuditLog } from '@/api/entities';
import { User } from '@/api/entities';
import SystemHealthPanel from './SystemHealthPanel';

export default function CompanySettings() {
  const [settings, setSettings] = useState({
    overtime_threshold_hours: 40,
    pto_daily_hours: 8,
    week_start_day: 'sunday',
    time_rounding_minutes: 0
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const [settingsData, currentUserData] = await Promise.all([
        SettingsEntity.list(),
        User.me()
      ]);
      
      if (settingsData.length > 0) {
        setSettings(settingsData[0]);
      }
      setCurrentUser(currentUserData);
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const existingSettings = await SettingsEntity.list();
      let savedSettingsId;

      if (existingSettings.length > 0) {
        await SettingsEntity.update(existingSettings[0].id, settings);
        savedSettingsId = existingSettings[0].id;
      } else {
        const newSettings = await SettingsEntity.create(settings);
        savedSettingsId = newSettings.id;
      }

      await AuditLog.create({
        actor_id: currentUser.id,
        actor_name: currentUser.full_name,
        action: 'settings.update',
        entity_type: 'Settings',
        entity_id: savedSettingsId,
        details: 'Updated company settings',
        metadata: { settings }
      });

      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Error saving settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {Array(3).fill(0).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-8 bg-slate-200 rounded w-1/4"></div>
                <div className="space-y-4">
                  {Array(2).fill(0).map((_, j) => (
                    <div key={j} className="space-y-2">
                      <div className="h-4 bg-slate-200 rounded w-1/3"></div>
                      <div className="h-10 bg-slate-200 rounded"></div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Company Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Company Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="overtime_threshold">Overtime Threshold (hours/week)</Label>
                <Input
                  id="overtime_threshold"
                  type="number"
                  min="1"
                  max="168"
                  value={settings.overtime_threshold_hours}
                  onChange={(e) => handleInputChange('overtime_threshold_hours', parseFloat(e.target.value))}
                />
                <p className="text-sm text-slate-500">
                  Hours per week before overtime kicks in
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pto_daily_hours">PTO Daily Hours</Label>
                <Input
                  id="pto_daily_hours"
                  type="number"
                  min="1"
                  max="24"
                  value={settings.pto_daily_hours}
                  onChange={(e) => handleInputChange('pto_daily_hours', parseFloat(e.target.value))}
                />
                <p className="text-sm text-slate-500">
                  Standard hours for a full day of PTO
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="week_start">Week Start Day</Label>
                <Select 
                  value={settings.week_start_day} 
                  onValueChange={(value) => handleInputChange('week_start_day', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sunday">Sunday</SelectItem>
                    <SelectItem value="monday">Monday</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-slate-500">
                  First day of the work week for reports
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="time_rounding">Time Rounding</Label>
                <Select 
                  value={settings.time_rounding_minutes.toString()} 
                  onValueChange={(value) => handleInputChange('time_rounding_minutes', parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">No rounding</SelectItem>
                    <SelectItem value="5">Round to nearest 5 minutes</SelectItem>
                    <SelectItem value="10">Round to nearest 10 minutes</SelectItem>
                    <SelectItem value="15">Round to nearest 15 minutes</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-slate-500">
                  Round clock in/out times for payroll
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-6 border-t">
              <Button type="submit" disabled={saving}>
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save Settings'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* System Health */}
      <SystemHealthPanel />
    </div>
  );
}
