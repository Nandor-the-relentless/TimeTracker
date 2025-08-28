import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Filter } from 'lucide-react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, subMonths } from 'date-fns';
import { Department } from '@/api/entities';
import { User } from '@/api/entities';

export default function ReportFilters({ filters, onFiltersChange }) {
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);
  const [showCustomDate, setShowCustomDate] = useState(false);

  useEffect(() => {
    loadFilterData();
  }, []);

  const loadFilterData = async () => {
    try {
      const [deptData, userData] = await Promise.all([
        Department.list(),
        User.list()
      ]);
      
      setDepartments(deptData);
      setUsers(userData);
    } catch (error) {
      console.error('Error loading filter data:', error);
    }
  };

  const handleQuickDateRange = (range) => {
    const today = new Date();
    let startDate, endDate;

    switch (range) {
      case 'this_week':
        startDate = startOfWeek(today);
        endDate = endOfWeek(today);
        break;
      case 'last_week':
        const lastWeek = subDays(today, 7);
        startDate = startOfWeek(lastWeek);
        endDate = endOfWeek(lastWeek);
        break;
      case 'this_month':
        startDate = startOfMonth(today);
        endDate = endOfMonth(today);
        break;
      case 'last_month':
        const lastMonth = subMonths(today, 1);
        startDate = startOfMonth(lastMonth);
        endDate = endOfMonth(lastMonth);
        break;
      case 'last_30':
        startDate = subDays(today, 30);
        endDate = today;
        break;
      case 'last_90':
        startDate = subDays(today, 90);
        endDate = today;
        break;
      default:
        return;
    }

    onFiltersChange({
      ...filters,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    });
    setShowCustomDate(false);
  };

  const handleCustomDateRange = () => {
    setShowCustomDate(true);
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Date Range */}
          <div className="space-y-2">
            <Label>Date Range</Label>
            <div className="space-y-2">
              <Select onValueChange={handleQuickDateRange}>
                <SelectTrigger>
                  <SelectValue placeholder="Quick ranges" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="this_week">This Week</SelectItem>
                  <SelectItem value="last_week">Last Week</SelectItem>
                  <SelectItem value="this_month">This Month</SelectItem>
                  <SelectItem value="last_month">Last Month</SelectItem>
                  <SelectItem value="last_30">Last 30 Days</SelectItem>
                  <SelectItem value="last_90">Last 90 Days</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                variant="outline" 
                onClick={handleCustomDateRange}
                className="w-full"
              >
                <CalendarIcon className="w-4 h-4 mr-2" />
                Custom Range
              </Button>
            </div>
          </div>

          {/* Group By */}
          <div className="space-y-2">
            <Label>Group By</Label>
            <Select 
              value={filters.groupBy} 
              onValueChange={(value) => onFiltersChange({...filters, groupBy: value})}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Week</SelectItem>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="department">Department</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Department Filter */}
          <div className="space-y-2">
            <Label>Department</Label>
            <Select 
              value={filters.departmentId || 'all'} 
              onValueChange={(value) => onFiltersChange({...filters, departmentId: value === 'all' ? null : value})}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* User Filter */}
          <div className="space-y-2">
            <Label>Employee</Label>
            <Select 
              value={filters.userId || 'all'} 
              onValueChange={(value) => onFiltersChange({...filters, userId: value === 'all' ? null : value})}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Employees</SelectItem>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Custom Date Range Inputs */}
        {showCustomDate && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={filters.startDate || ''}
                onChange={(e) => onFiltersChange({...filters, startDate: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input
                type="date"
                value={filters.endDate || ''}
                onChange={(e) => onFiltersChange({...filters, endDate: e.target.value})}
              />
            </div>
          </div>
        )}

        {/* Current Filter Summary */}
        {(filters.startDate || filters.endDate || filters.departmentId || filters.userId) && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Filter className="w-4 h-4" />
              <span>Active filters:</span>
              {filters.startDate && filters.endDate && (
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {format(new Date(filters.startDate), 'MMM d')} - {format(new Date(filters.endDate), 'MMM d')}
                </span>
              )}
              {filters.departmentId && (
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                  {departments.find(d => d.id === filters.departmentId)?.name}
                </span>
              )}
              {filters.userId && (
                <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">
                  {users.find(u => u.id === filters.userId)?.full_name}
                </span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}