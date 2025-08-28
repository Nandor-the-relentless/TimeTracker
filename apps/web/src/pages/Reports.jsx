import React, { useState, useEffect } from 'react';
import { useRoleAuth } from '../components/hooks/useRoleAuth';
import AccessDenied from './AccessDenied';
import { Button } from '@/components/ui/button';
import { Download, Save, Settings, BarChart2 } from 'lucide-react';
import { startOfWeek, endOfWeek } from 'date-fns';
import ReportFilters from '../components/reports/ReportFilters';
import ReportVisualizations from '../components/reports/ReportVisualizations';
import ReportDataTable from '../components/reports/ReportDataTable';
import { supabase } from '@/api/base44Client';

export default function Reports() {
  const { loading, isAuthorized } = useRoleAuth(['admin', 'manager']);
  const [filters, setFilters] = useState({
    startDate: null,
    endDate: null,
    groupBy: 'user',
    departmentId: null,
    userId: null,
    reportType: 'summary'
  });
  const [reportData, setReportData] = useState([]);
  const [reportLoading, setReportLoading] = useState(false);

  useEffect(() => {
    console.log('useEffect triggered, isAuthorized:', isAuthorized, 'filters:', filters);
    if (isAuthorized) {
      loadReportData();
    }
  }, [filters, isAuthorized]);

  const loadReportData = async () => {
    console.log('loadReportData called with filters:', filters);
    setReportLoading(true);
    
    try {
      // Build the query based on filters
      let query = supabase
        .from('time_entries')
        .select(`
          *,
          profiles!user_id (
            id,
            full_name,
            email,
            department
          )
        `);

      // Apply date filters
      if (filters.startDate) {
        query = query.gte('start_time', filters.startDate);
      }
      if (filters.endDate) {
        // Add one day to include the entire end date
        const endDate = new Date(filters.endDate);
        endDate.setDate(endDate.getDate() + 1);
        query = query.lt('start_time', endDate.toISOString());
      }

      // Apply user filter
      if (filters.userId) {
        query = query.eq('user_id', filters.userId);
      }

      // Execute query
      const { data: timeEntries, error } = await query.order('start_time', { ascending: false });

      if (error) throw error;

      // Process the data based on report type
      let processedData = [];
      
      if (filters.reportType === 'summary' || !filters.reportType) {
        // Group by user for summary report
        const userGroups = {};
        
        timeEntries.forEach(entry => {
          const userId = entry.user_id;
          if (!userGroups[userId]) {
            userGroups[userId] = {
              id: userId,
              name: entry.profiles?.full_name || 'Unknown',
              email: entry.profiles?.email || '',
              department: entry.profiles?.department || 'None',
              regularHours: 0,
              overtimeHours: 0,
              totalHours: 0,
              entries: []
            };
          }
          
          const hours = (entry.duration_minutes || 0) / 60;
          userGroups[userId].totalHours += hours;
          
          // Only process regular/overtime for positive hours
          if (hours > 0) {
            if (hours > 8) {
              userGroups[userId].overtimeHours += hours - 8;
              userGroups[userId].regularHours += 8;
            } else {
              userGroups[userId].regularHours += hours;
            }
          }
          
          userGroups[userId].entries.push(entry);
        });
        
        processedData = Object.values(userGroups);
        
      } else if (filters.reportType === 'detailed') {
        // Show individual entries for detailed report
        processedData = timeEntries.map(entry => ({
          id: entry.id,
          date: entry.start_time,
          name: entry.profiles?.full_name || 'Unknown',
          department: entry.profiles?.department || 'None',
          startTime: entry.start_time,
          endTime: entry.end_time,
          hours: (entry.duration_minutes || 0) / 60,
          note: entry.note || ''
        }));
        
      } else if (filters.reportType === 'pto') {
        // Fetch PTO requests instead
        let ptoQuery = supabase
          .from('pto_requests')
          .select(`
            *,
            profiles!user_id (
              full_name,
              email,
              department
            )
          `);
          
        if (filters.startDate) {
          ptoQuery = ptoQuery.gte('start_date', filters.startDate);
        }
        if (filters.endDate) {
          ptoQuery = ptoQuery.lte('end_date', filters.endDate);
        }
        if (filters.userId) {
          ptoQuery = ptoQuery.eq('user_id', filters.userId);
        }
        
        const { data: ptoData, error: ptoError } = await ptoQuery;
        
        if (ptoError) throw ptoError;
        
        processedData = ptoData.map(pto => ({
          id: pto.id,
          name: pto.profiles?.full_name || 'Unknown',
          department: pto.profiles?.department || 'None',
          type: pto.type || pto.request_type,
          startDate: pto.start_date,
          endDate: pto.end_date,
          hours: pto.total_hours,
          status: pto.status
        }));
      }
      
      console.log('Processed report data:', processedData);
      setReportData(processedData);
      
    } catch (error) {
      console.error('Error loading report data:', error);
      setReportData([]);
    } finally {
      setReportLoading(false);
    }
  };

  const handleExport = (format) => {
    // This would generate and download the report
    console.log(`Exporting as ${format}`, { filters, reportData });
    alert(`Exporting report as ${format.toUpperCase()}...`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthorized) {
    return <AccessDenied />;
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 bg-slate-50 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Analytics & Reports</h1>
          <p className="text-slate-600 mt-1">Generate and export reports on hours, overtime, and PTO usage.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleExport('csv')}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={() => handleExport('pdf')}>
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
          <Button>
            <Save className="w-4 h-4 mr-2" />
            Save Preset
          </Button>
        </div>
      </div>

      <ReportFilters filters={filters} onFilterChange={setFilters} />
      <ReportVisualizations data={reportData} loading={reportLoading} />
      <ReportDataTable data={reportData} loading={reportLoading} filters={filters} />
    </div>
  );
}