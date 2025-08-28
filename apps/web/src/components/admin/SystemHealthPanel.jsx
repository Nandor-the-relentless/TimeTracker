import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Activity, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import { NotificationQueue } from '@/api/entities';
import { AuditLog } from '@/api/entities';
import { format, subDays } from 'date-fns';

export default function SystemHealthPanel() {
  const [healthData, setHealthData] = useState({
    queueSize: 0,
    lastJobRun: null,
    errorCount24h: 0,
    lastScheduledReport: null
  });
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [recentErrors, setRecentErrors] = useState([]);

  useEffect(() => {
    loadHealthData();
    const interval = setInterval(loadHealthData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadHealthData = async () => {
    try {
      const [pendingNotifications, auditLogs] = await Promise.all([
        NotificationQueue.filter({ status: 'pending' }),
        AuditLog.list('-created_date', 50)
      ]);

      const yesterday = subDays(new Date(), 1);
      const errorLogs = auditLogs.filter(log => 
        log.action.includes('error') && new Date(log.created_date) >= yesterday
      );

      const jobLogs = auditLogs.filter(log => 
        log.action === 'notification.process' || log.action === 'report.schedule'
      );

      setHealthData({
        queueSize: pendingNotifications.length,
        lastJobRun: jobLogs.length > 0 ? jobLogs[0].created_date : null,
        errorCount24h: errorLogs.length,
        lastScheduledReport: jobLogs.find(log => log.action === 'report.schedule')?.created_date || null
      });

      setRecentErrors(errorLogs.slice(0, 25));
    } catch (error) {
      console.error('Error loading health data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRunNotificationProcessor = async () => {
    setProcessing(true);
    try {
      const pendingNotifications = await NotificationQueue.filter({ status: 'pending' });
      
      // Simulate processing notifications
      for (const notification of pendingNotifications.slice(0, 10)) {
        await NotificationQueue.update(notification.id, {
          status: 'sent',
          attempts: (notification.attempts || 0) + 1
        });
      }

      // Log the manual job run
      await AuditLog.create({
        actor_id: 'system',
        actor_name: 'System',
        action: 'notification.process',
        entity_type: 'NotificationQueue',
        entity_id: 'manual_run',
        details: `Manually processed ${Math.min(pendingNotifications.length, 10)} notifications`,
        metadata: { 
          processed_count: Math.min(pendingNotifications.length, 10),
          manual_trigger: true
        }
      });

      await loadHealthData();
      alert('Notification processor run completed!');
    } catch (error) {
      console.error('Error running notification processor:', error);
      alert('Error running notification processor.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-slate-200 rounded w-1/4"></div>
            <div className="space-y-2">
              {Array(3).fill(0).map((_, i) => (
                <div key={i} className="h-6 bg-slate-200 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          System Health
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Notification Queue</span>
              <Badge variant={healthData.queueSize > 0 ? "destructive" : "default"}>
                {healthData.queueSize} pending
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Last Job Run</span>
              <span className="text-sm font-mono">
                {healthData.lastJobRun ? format(new Date(healthData.lastJobRun), 'MMM d, h:mm a') : 'Never'}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Errors (24h)</span>
              <Badge variant={healthData.errorCount24h > 0 ? "destructive" : "default"}>
                {healthData.errorCount24h}
              </Badge>
            </div>
          </div>

          <div className="space-y-3">
            <Button 
              onClick={handleRunNotificationProcessor}
              disabled={processing}
              className="w-full"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${processing ? 'animate-spin' : ''}`} />
              {processing ? 'Processing...' : 'Run Notifications Now'}
            </Button>

            {healthData.errorCount24h > 0 && (
              <Button 
                variant="outline" 
                onClick={() => alert(`Recent errors:\n${recentErrors.map(e => e.details).join('\n')}`)}
                className="w-full text-red-600"
              >
                <AlertCircle className="w-4 h-4 mr-2" />
                View Error Details
              </Button>
            )}
          </div>
        </div>

        {healthData.queueSize === 0 && healthData.errorCount24h === 0 && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              All systems are running normally. No pending notifications or recent errors.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}