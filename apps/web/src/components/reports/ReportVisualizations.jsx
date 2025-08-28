import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { BarChart } from 'lucide-react';

export default function ReportVisualizations({ filters, data }) {
  // Handle null data case
  if (!data || !data.generated) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Report Visualizations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <BarChart className="w-12 h-12 mx-auto mb-4 text-slate-300" />
            <p className="text-slate-500">Select filters and click "Generate Report" to view charts</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Report Visualizations</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64 flex items-center justify-center bg-slate-50 rounded-lg">
          <p className="text-slate-500">Chart visualization would go here</p>
        </div>
      </CardContent>
    </Card>
  );
}