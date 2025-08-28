import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Download, FileText } from 'lucide-react';

export default function ReportDataTable({ filters, data }) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Report Data</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <FileText className="w-12 h-12 mx-auto mb-4 text-slate-300" />
            <p className="text-slate-500">No data found for selected filters</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Different columns based on report type
  const renderTableHeaders = () => {
    if (filters?.reportType === 'detailed') {
      return (
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Employee</TableHead>
          <TableHead>Start Time</TableHead>
          <TableHead>End Time</TableHead>
          <TableHead>Hours</TableHead>
          <TableHead>Note</TableHead>
        </TableRow>
      );
    } else if (filters?.reportType === 'pto') {
      return (
        <TableRow>
          <TableHead>Employee</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Start Date</TableHead>
          <TableHead>End Date</TableHead>
          <TableHead>Hours</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      );
    } else {
      // Summary report
      return (
        <TableRow>
          <TableHead>Employee</TableHead>
          <TableHead>Department</TableHead>
          <TableHead>Regular Hours</TableHead>
          <TableHead>Overtime Hours</TableHead>
          <TableHead>Total Hours</TableHead>
        </TableRow>
      );
    }
  };

  const renderTableRows = () => {
    if (filters?.reportType === 'detailed') {
      return data.map((row) => (
        <TableRow key={row.id}>
          <TableCell>{new Date(row.date).toLocaleDateString()}</TableCell>
          <TableCell>{row.name || 'Unknown'}</TableCell>
          <TableCell>{new Date(row.startTime).toLocaleTimeString()}</TableCell>
          <TableCell>{row.endTime ? new Date(row.endTime).toLocaleTimeString() : 'Active'}</TableCell>
          <TableCell>{(row.hours || 0).toFixed(2)}</TableCell>
          <TableCell>{row.note || ''}</TableCell>
        </TableRow>
      ));
    } else if (filters?.reportType === 'pto') {
      return data.map((row) => (
        <TableRow key={row.id}>
          <TableCell>{row.name || 'Unknown'}</TableCell>
          <TableCell>{row.type || 'N/A'}</TableCell>
          <TableCell>{new Date(row.startDate).toLocaleDateString()}</TableCell>
          <TableCell>{new Date(row.endDate).toLocaleDateString()}</TableCell>
          <TableCell>{(row.hours || 0).toFixed(2)}</TableCell>
          <TableCell>{row.status || 'Unknown'}</TableCell>
        </TableRow>
      ));
    } else {
      // Summary report
      return data.map((row) => (
        <TableRow key={row.id}>
          <TableCell>{row.name || 'Unknown'}</TableCell>
          <TableCell>{row.department || 'None'}</TableCell>
          <TableCell>{(row.regularHours || 0).toFixed(2)}</TableCell>
          <TableCell>{(row.overtimeHours || 0).toFixed(2)}</TableCell>
          <TableCell>{(row.totalHours || 0).toFixed(2)}</TableCell>
        </TableRow>
      ));
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Report Data - {filters?.reportType || 'Summary'}</CardTitle>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {renderTableHeaders()}
            </TableHeader>
            <TableBody>
              {renderTableRows()}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}