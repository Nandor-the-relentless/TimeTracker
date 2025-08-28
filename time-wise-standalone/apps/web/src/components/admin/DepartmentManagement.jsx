import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import { Department } from '@/api/entities';
import { User } from '@/api/entities';
import { AuditLog } from '@/api/entities';
import DepartmentDialog from './DepartmentDialog';

export default function DepartmentManagement() {
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [deptData, userData, currentUserData] = await Promise.all([
        Department.list(),
        User.list(),
        User.me()
      ]);
      
      setDepartments(deptData);
      setUsers(userData);
      setCurrentUser(currentUserData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDepartment = async (deptData) => {
    try {
      const newDept = await Department.create(deptData);
      
      await AuditLog.create({
        actor_id: currentUser.id,
        actor_name: currentUser.full_name,
        action: 'department.create',
        entity_type: 'Department',
        entity_id: newDept.id,
        details: `Created department: ${deptData.name}`,
        metadata: { department: deptData }
      });

      await loadData();
      setShowDialog(false);
    } catch (error) {
      console.error('Error creating department:', error);
    }
  };

  const handleUpdateDepartment = async (deptId, updates) => {
    try {
      await Department.update(deptId, updates);
      
      await AuditLog.create({
        actor_id: currentUser.id,
        actor_name: currentUser.full_name,
        action: 'department.update',
        entity_type: 'Department',
        entity_id: deptId,
        details: `Updated department: ${updates.name}`,
        metadata: { changes: updates }
      });

      await loadData();
      setEditingDept(null);
      setShowDialog(false);
    } catch (error) {
      console.error('Error updating department:', error);
    }
  };

  const handleDeleteDepartment = async (dept) => {
    if (!confirm(`Are you sure you want to delete "${dept.name}"? This cannot be undone.`)) {
      return;
    }

    try {
      await Department.delete(dept.id);
      
      await AuditLog.create({
        actor_id: currentUser.id,
        actor_name: currentUser.full_name,
        action: 'department.delete',
        entity_type: 'Department',
        entity_id: dept.id,
        details: `Deleted department: ${dept.name}`,
        metadata: { department: dept }
      });

      await loadData();
    } catch (error) {
      console.error('Error deleting department:', error);
    }
  };

  const getUserCount = (deptName) => {
    return users.filter(user => user.department === deptName).length;
  };

  const getManagerName = (managerId) => {
    const manager = users.find(user => user.id === managerId);
    return manager ? manager.full_name : 'None';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-slate-200 rounded w-1/4"></div>
            <div className="space-y-2">
              {Array(3).fill(0).map((_, i) => (
                <div key={i} className="h-12 bg-slate-200 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Departments & Teams ({departments.length})</CardTitle>
            <Button onClick={() => setShowDialog(true)}>
              <PlusCircle className="w-4 h-4 mr-2" />
              New Department
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Department Name</TableHead>
                  <TableHead>Manager</TableHead>
                  <TableHead>Members</TableHead>
                  <TableHead className="w-32">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {departments.map((dept) => (
                  <TableRow key={dept.id}>
                    <TableCell className="font-medium">{dept.name}</TableCell>
                    <TableCell>{getManagerName(dept.manager_id)}</TableCell>
                    <TableCell>{getUserCount(dept.name)} users</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingDept(dept);
                            setShowDialog(true);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteDepartment(dept)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {departments.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-slate-500">
                      No departments created yet
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {showDialog && (
        <DepartmentDialog
          department={editingDept}
          users={users}
          onCreate={handleCreateDepartment}
          onUpdate={handleUpdateDepartment}
          onClose={() => {
            setShowDialog(false);
            setEditingDept(null);
          }}
        />
      )}
    </>
  );
}