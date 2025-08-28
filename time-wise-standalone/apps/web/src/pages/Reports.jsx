import React, { useState, useEffect } from 'react';
import { useRoleAuth } from '../components/hooks/useRoleAuth';
import AccessDenied from './AccessDenied';
import { Button } from '@/components/ui/button';
import { Download, Save, Settings, BarChart2 } from 'lucide-react';
import { startOfWeek, endOfWeek } from 'date-fns';
import ReportFilters from '../components/reports/ReportFilters';
import ReportVisualizations from '../components/reports/ReportVisualizations';
import ReportDataTable from '../components/reports/ReportDataTable';

export default function Reports() {
  const { loading, isAuthorized } = useRoleAuth(['admin', 'manager']);
  const [filters, setFilters] = useState({
    startDate: startOfWeek(new Date()).toISOString().split('T')[0],
    endDate: endOfWeek(new Date()).toISOString().split('T')[0],
    groupBy: 'user',
    departmentId: null,
    userId: null
  });
  const [reportData, setReportData] = useState([]);
  const [reportLoading, setReportLoading] = useState(false);

  useEffect(() => {
    if (isAuthorized) {
      loadReportData();
    }
  }, [filters, isAuthorized]);

  const loadReportData = async () => {
    setReportLoading(true);
    try {
      // This would typically call an API endpoint
      // For now, we'll simulate loading data
      setTimeout(() => {
        setReportData([
          {
            id: 1,
            name: 'John Doe',
            department: 'Engineering',
            regularHours: 32.5,
            overtimeHours: 2.5,
            ptoVacation: 8,
            ptoSick: 0,
            ptoPersonal: 0,
            totalHours: 43
          },
          {
            id: 2,
            name: 'Jane Smith',
            department: 'Sales',
            regularHours: 40,
            overtimeHours: 0,
            ptoVacation: 0,
            ptoSick: 8,
            ptoPersonal: 0,
            totalHours: 48
          }
        ]);
        setReportLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error loading report data:', error);
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

      <ReportFilters filters={filters} onFiltersChange={setFilters} />
      <ReportVisualizations data={reportData} loading={reportLoading} />
      <ReportDataTable data={reportData} loading={reportLoading} filters={filters} />
    </div>
  );
}