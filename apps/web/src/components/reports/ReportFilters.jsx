import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Department } from '@/api/entities';
import { supabase } from '@/api/base44Client';

export default function ReportFilters({ onFilterChange }) {
  const [filters, setFilters] = useState({
    dateRange: { from: null, to: null },
    userId: 'all',
    department: 'all',
    reportType: 'summary'
  });
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFilterData();
  }, []);

  const loadFilterData = async () => {
    try {
      // Get users directly from profiles table
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .eq('status', 'active')
        .order('full_name');
      
      if (userError) throw userError;
      
      const departmentData = await Department.list();
      
      setUsers(userData || []);
      setDepartments(departmentData);
    } catch (error) {
      console.error('Error loading filter data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    // Don't call onFilterChange here - only call it when Generate Report is clicked
  };

  const handleGenerateReport = () => {
    // Transform filters to match what Reports.jsx expects
    const transformedFilters = {
      startDate: filters.dateRange.from 
        ? (filters.dateRange.from instanceof Date 
          ? filters.dateRange.from.toISOString().split('T')[0]
          : filters.dateRange.from)
        : null,
      endDate: filters.dateRange.to 
        ? (filters.dateRange.to instanceof Date 
          ? filters.dateRange.to.toISOString().split('T')[0]
          : filters.dateRange.to)
        : null,
      groupBy: 'user',
      departmentId: filters.department === 'all' ? null : filters.department,
      userId: filters.userId === 'all' ? null : filters.userId,
      reportType: filters.reportType
    };
    
    console.log('Generating report with filters:', transformedFilters);
    onFilterChange(transformedFilters);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-slate-200 rounded"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Array(3).fill(0).map((_, i) => (
                <div key={i} className="h-10 bg-slate-200 rounded"></div>
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
        <CardTitle>Report Filters</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="reportType">Report Type</Label>
            <Select 
              value={filters.reportType} 
              onValueChange={(value) => handleFilterChange('reportType', value)}
            >
              <SelectTrigger id="reportType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="summary">Summary Report</SelectItem>
                <SelectItem value="detailed">Detailed Report</SelectItem>
                <SelectItem value="pto">PTO Report</SelectItem>
                <SelectItem value="overtime">Overtime Report</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="employee">Employee</Label>
            <Select 
              value={filters.userId} 
              onValueChange={(value) => handleFilterChange('userId', value)}
            >
              <SelectTrigger id="employee">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Employees</SelectItem>
                {users.map(user => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.full_name || user.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="department">Department</Label>
            <Select 
              value={filters.department} 
              onValueChange={(value) => handleFilterChange('department', value)}
            >
              <SelectTrigger id="department">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map(dept => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="startDate">Start Date</Label>
            <Input 
              id="startDate"
              type="date"
              onChange={(e) => handleFilterChange('dateRange', {
                ...filters.dateRange,
                from: e.target.value || null
              })}
            />
          </div>
          <div>
            <Label htmlFor="endDate">End Date</Label>
            <Input 
              id="endDate"
              type="date"
              onChange={(e) => handleFilterChange('dateRange', {
                ...filters.dateRange,
                to: e.target.value || null
              })}
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button onClick={handleGenerateReport}>
            Generate Report
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}