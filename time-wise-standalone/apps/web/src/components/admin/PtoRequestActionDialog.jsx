import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { PTOBalance } from '@/api/entities';

export default function PtoRequestActionDialog({ action, requests, onClose, onConfirm }) {
  const [note, setNote] = useState('');
  const [allowNegative, setAllowNegative] = useState(false);
  const [balanceInfo, setBalanceInfo] = useState({ canCover: true, newBalance: 0 });
  const [loading, setLoading] = useState(false);

  const isBulk = requests.length > 1;
  const request = requests[0];

  useEffect(() => {
    if (action === 'approve' && !isBulk) {
      checkBalance();
    }
  }, [action, request]);

  const checkBalance = async () => {
    setLoading(true);
    try {
      const balances = await PTOBalance.filter({ user_id: request.user_id });
      if (balances.length > 0) {
        const currentBalance = balances[0].balance_hours;
        const newBalance = currentBalance - request.total_hours;
        setBalanceInfo({
          canCover: newBalance >= 0,
          newBalance: newBalance,
          currentBalance: currentBalance,
        });
      }
    } catch (error) {
      console.error('Error checking balance:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    onConfirm(action, requests, note, allowNegative);
  };

  const title = `${action.charAt(0).toUpperCase() + action.slice(1)} ${isBulk ? `${requests.length} Requests` : 'Request'}`;
  const description = isBulk
    ? `You are about to ${action} ${requests.length} selected PTO requests. Add a note below that will be applied to all.`
    : `You are about to ${action} a PTO request for ${request.user?.full_name}.`;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!isBulk && action === 'approve' && !loading && (
            <div className="text-sm">
              <p>Current Balance: <strong>{balanceInfo.currentBalance?.toFixed(2) || 'N/A'}h</strong></p>
              <p>Requested: <strong>{request.total_hours}h</strong></p>
              <p>Resulting Balance: <strong className={!balanceInfo.canCover ? 'text-red-600' : ''}>{balanceInfo.newBalance?.toFixed(2) || 'N/A'}h</strong></p>
            </div>
          )}

          {!balanceInfo.canCover && action === 'approve' && !isBulk && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                This request exceeds the employee's available balance. Approving will result in a negative balance.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="note">Note / Reason *</Label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={action === 'approve' ? 'Optional note for approval...' : 'Required reason for denial...'}
            />
          </div>

          {action === 'approve' && (!balanceInfo.canCover || isBulk) && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="allow-negative"
                checked={allowNegative}
                onCheckedChange={setAllowNegative}
              />
              <Label htmlFor="allow-negative" className="text-sm font-medium">
                Allow negative balance for requests that exceed available hours.
              </Label>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleConfirm} disabled={action === 'deny' && note.length < 3}>
            Confirm {action.charAt(0).toUpperCase() + action.slice(1)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}