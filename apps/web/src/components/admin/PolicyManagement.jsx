import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { FilePlus, Edit, Trash2, DollarSign, ListFilter } from 'lucide-react';
import { PTOPolicy } from '@/api/entities';
import { PTOBalance } from '@/api/entities';
import { PTORequest } from '@/api/entities';
import { User } from '@/api/entities';
import { AuditLog } from '@/api/entities';
import { NotificationQueue } from '@/api/entities';
import { format, subMonths } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import PtoRequestTable from './PtoRequestTable';

export default function PolicyManagement() {
  const [policies, setPolicies] = useState([]);
  const [balances, setBalances] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [editingBalance, setEditingBalance] = useState(null);
  const [balanceAdjustment, setBalanceAdjustment] = useState({ hours: '', reason: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [policiesData, balancesData, usersData, currentUserData] = await Promise.all([
        PTOPolicy.list(),
        PTOBalance.list(),
        User.list(),
        User.me()
      ]);
      
      setPolicies(policiesData);
      setBalances(balancesData);
      setUsers(usersData);
      setCurrentUser(currentUserData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustBalance = async (balance) => {
    if (!balanceAdjustment.hours || !balanceAdjustment.reason) {
      alert('Please provide both adjustment amount and reason.');
      return;
    }

    try {
      const adjustmentHours = parseFloat(balanceAdjustment.hours);
      const newBalance = balance.balance_hours + adjustmentHours;

      await PTOBalance.update(balance.id, {
        balance_hours: Math.max(0, newBalance),
        accrued_hours: adjustmentHours > 0 ? balance.accrued_hours + adjustmentHours : balance.accrued_hours,
        used_hours: adjustmentHours < 0 ? balance.used_hours + Math.abs(adjustmentHours) : balance.used_hours
      });

      const user = users.find(u => u.id === balance.user_id);
      await AuditLog.create({
        actor_id: currentUser.id,
        actor_name: currentUser.full_name,
        action: 'pto_balance.adjust',
        entity_type: 'PTOBalance',
        entity_id: balance.id,
        details: `Adjusted PTO balance for ${user?.full_name} by ${adjustmentHours}h`,
        metadata: { 
          user_id: balance.user_id,
          adjustment_hours: adjustmentHours,
          reason: balanceAdjustment.reason,
          old_balance: balance.balance_hours,
          new_balance: newBalance
        }
      });

      await NotificationQueue.create({
          recipient: user.email,
          subject: "Your PTO Balance has been Adjusted",
          message: `Hello ${user.full_name},\n\nAn administrator has adjusted your PTO balance by ${adjustmentHours} hours. Your new balance is ${newBalance} hours.\n\nReason: ${balanceAdjustment.reason}`,
          metadata: { type: 'pto_balance_adjusted' }
      });

      setEditingBalance(null);
      setBalanceAdjustment({ hours: '', reason: '' });
      await loadData();
    } catch (error) {
      console.error('Error adjusting balance:', error);
    }
  };

  const getUserName = (userId) => {
    const user = users.find(u => u.id === userId);
    return user ? user.full_name : 'Unknown User';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {Array(2).fill(0).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-8 bg-slate-200 rounded w-1/4"></div>
                <div className="space-y-2">
                  {Array(3).fill(0).map((_, j) => (
                    <div key={j} className="h-12 bg-slate-200 rounded"></div>
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
    <Tabs defaultValue="requests" className="w-full">
      <TabsList className="mb-4">
        <TabsTrigger value="requests">Requests</TabsTrigger>
        <TabsTrigger value="policies">Policies</TabsTrigger>
        <TabsTrigger value="balances">Balances</TabsTrigger>
      </TabsList>
      
      <TabsContent value="requests">
        <PtoRequestTable users={users} currentUser={currentUser} />
      </TabsContent>
      
      <TabsContent value="policies">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>PTO Policies ({policies.length})</CardTitle>
              <Button>
                <FilePlus className="w-4 h-4 mr-2" />
                New Policy
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {policies.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <FilePlus className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                <p>No PTO policies created yet</p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Policy Name</TableHead>
                      <TableHead>Accrual Rate</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Carryover Cap</TableHead>
                      <TableHead>Effective Date</TableHead>
                      <TableHead className="w-32">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {policies.map((policy) => (
                      <TableRow key={policy.id}>
                        <TableCell className="font-medium">{policy.name}</TableCell>
                        <TableCell>{policy.accrual_hours_per_period}h</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {policy.accrual_period}
                          </Badge>
                        </TableCell>
                        <TableCell>{policy.carryover_cap_hours}h</TableCell>
                        <TableCell>{policy.effective_date}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon">
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="balances">
        <Card>
          <CardHeader>
            <CardTitle>Employee PTO Balances ({balances.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {balances.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <DollarSign className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                <p>No PTO balances found</p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Current Balance</TableHead>
                      <TableHead>Accrued</TableHead>
                      <TableHead>Used</TableHead>
                      <TableHead>Last Updated</TableHead>
                      <TableHead className="w-32">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {balances.map((balance) => (
                      <TableRow key={balance.id}>
                        <TableCell className="font-medium">
                          {getUserName(balance.user_id)}
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-blue-100 text-blue-800">
                            {balance.balance_hours}h
                          </Badge>
                        </TableCell>
                        <TableCell>{balance.accrued_hours}h</TableCell>
                        <TableCell>{balance.used_hours}h</TableCell>
                        <TableCell>
                          {format(new Date(balance.updated_date), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingBalance(balance)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Balance Adjustment Modal */}
            {editingBalance && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <Card className="w-full max-w-md mx-4">
                  <CardHeader>
                    <CardTitle>Adjust PTO Balance</CardTitle>
                    <p className="text-sm text-slate-600">
                      {getUserName(editingBalance.user_id)} - Current: {editingBalance.balance_hours}h
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Adjustment (hours)</Label>
                      <Input
                        type="number"
                        step="0.5"
                        placeholder="e.g., +8 or -4"
                        value={balanceAdjustment.hours}
                        onChange={(e) => setBalanceAdjustment(prev => ({...prev, hours: e.target.value}))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Reason *</Label>
                      <Input
                        placeholder="Required reason for audit trail"
                        value={balanceAdjustment.reason}
                        onChange={(e) => setBalanceAdjustment(prev => ({...prev, reason: e.target.value}))}
                      />
                    </div>
                    <div className="flex justify-end gap-3">
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setEditingBalance(null);
                          setBalanceAdjustment({ hours: '', reason: '' });
                        }}
                      >
                        Cancel
                      </Button>
                      <Button onClick={() => handleAdjustBalance(editingBalance)}>
                        Apply Adjustment
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}