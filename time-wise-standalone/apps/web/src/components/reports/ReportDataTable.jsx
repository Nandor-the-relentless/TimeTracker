import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { FileText } from 'lucide-react';

export default function ReportDataTable({ data, loading, filters }) {
  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-slate-200 rounded w-1/4"></div>
            <div className="space-y-2">
              {Array(5).fill(0).map((_, i) => (
                <div key={i} className="h-12 bg-slate-200 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getTotalHours = (row) => {
    return row.regularHours + row.overtimeHours;
  };

  const getPTOTotal = (row) => {
    return row.ptoVacation + row.ptoSick + row.ptoPersonal;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-600" />
          Report Data ({data.length} records)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="w-12 h-12 mx-auto mb-4 text-slate-300" />
            <p className="text-slate-500">No data found for the selected filters</p>
          </div>
        ) : (
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead className="text-right">Regular Hours</TableHead>
                  <TableHead className="text-right">Overtime Hours</TableHead>
                  <TableHead className="text-right">PTO Vacation</TableHead>
                  <TableHead className="text-right">PTO Sick</TableHead>
                  <TableHead className="text-right">PTO Personal</TableHead>
                  <TableHead className="text-right">Total Work</TableHead>
                  <TableHead className="text-right">Total PTO</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell>{row.department}</TableCell>
                    <TableCell className="text-right">{row.regularHours.toFixed(1)}h</TableCell>
                    <TableCell className="text-right">
                      {row.overtimeHours > 0 ? (
                        <Badge variant="outline" className="bg-orange-50 text-orange-700">
                          {row.overtimeHours.toFixed(1)}h
                        </Badge>
                      ) : (
                        '0.0h'
                      )}
                    </TableCell>
                    <TableCell className="text-right">{row.ptoVacation.toFixed(1)}h</TableCell>
                    <TableCell className="text-right">{row.ptoSick.toFixed(1)}h</TableCell>
                    <TableCell className="text-right">{row.ptoPersonal.toFixed(1)}h</TableCell>
                    <TableCell className="text-right font-semibold">
                      {getTotalHours(row).toFixed(1)}h
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {getPTOTotal(row).toFixed(1)}h
                    </TableCell>
                  </TableRow>
                ))}
                
                {/* Summary Row */}
                <TableRow className="bg-slate-50 font-semibold">
                  <TableCell colSpan={2}>TOTALS</TableCell>
                  <TableCell className="text-right">
                    {data.reduce((sum, row) => sum + row.regularHours, 0).toFixed(1)}h
                  </TableCell>
                  <TableCell className="text-right">
                    {data.reduce((sum, row) => sum + row.overtimeHours, 0).toFixed(1)}h
                  </TableCell>
                  <TableCell className="text-right">
                    {data.reduce((sum, row) => sum + row.ptoVacation, 0).toFixed(1)}h
                  </TableCell>
                  <TableCell className="text-right">
                    {data.reduce((sum, row) => sum + row.ptoSick, 0).toFixed(1)}h
                  </TableCell>
                  <TableCell className="text-right">
                    {data.reduce((sum, row) => sum + row.ptoPersonal, 0).toFixed(1)}h
                  </TableCell>
                  <TableCell className="text-right">
                    {data.reduce((sum, row) => sum + getTotalHours(row), 0).toFixed(1)}h
                  </TableCell>
                  <TableCell className="text-right">
                    {data.reduce((sum, row) => sum + getPTOTotal(row), 0).toFixed(1)}h
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}