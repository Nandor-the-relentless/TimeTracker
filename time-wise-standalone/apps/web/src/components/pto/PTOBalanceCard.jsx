import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Calendar, Clock, TrendingUp } from "lucide-react";

export default function PTOBalanceCard({ balance }) {
  const availableHours = balance?.balance_hours || 0;
  const accruedHours = balance?.accrued_hours || 0;
  const usedHours = balance?.used_hours || 0;
  
  const usagePercentage = accruedHours > 0 ? (usedHours / accruedHours) * 100 : 0;
  const remainingPercentage = accruedHours > 0 ? (availableHours / accruedHours) * 100 : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Available Balance */}
      <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-white">
            <Clock className="w-5 h-5" />
            Available Balance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold mb-2">{availableHours.toFixed(1)}h</div>
          <div className="text-blue-100">
            {(availableHours / 8).toFixed(1)} days remaining
          </div>
        </CardContent>
      </Card>

      {/* Accrued This Year */}
      <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-white">
            <TrendingUp className="w-5 h-5" />
            Accrued This Year
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold mb-2">{accruedHours.toFixed(1)}h</div>
          <div className="text-green-100">
            {(accruedHours / 8).toFixed(1)} days total
          </div>
        </CardContent>
      </Card>

      {/* Used This Year */}
      <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-white">
            <Calendar className="w-5 h-5" />
            Used This Year
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold mb-2">{usedHours.toFixed(1)}h</div>
          <div className="text-orange-100">
            {(usedHours / 8).toFixed(1)} days taken
          </div>
        </CardContent>
      </Card>

      {/* Usage Progress */}
      <Card className="md:col-span-3 bg-white shadow-lg">
        <CardHeader>
          <CardTitle>PTO Usage Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm text-slate-600">Time Used vs. Available</span>
              <span className="text-sm font-medium text-slate-900">
                {usedHours.toFixed(1)}h / {accruedHours.toFixed(1)}h
              </span>
            </div>
            <Progress 
              value={usagePercentage} 
              className="h-3 [&>div]:bg-gradient-to-r [&>div]:from-orange-500 [&>div]:to-orange-600" 
            />
            <div className="flex justify-between mt-1 text-xs text-slate-500">
              <span>0h</span>
              <span>{accruedHours.toFixed(1)}h</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{remainingPercentage.toFixed(0)}%</div>
              <div className="text-sm text-slate-600">Remaining</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{usagePercentage.toFixed(0)}%</div>
              <div className="text-sm text-slate-600">Used</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}