import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, Target } from "lucide-react";

export default function WeeklyOverview({ weekHours, recentEntries }) {
  const targetHours = 40;
  const progressPercentage = Math.min((weekHours / targetHours) * 100, 100);
  const isOvertime = weekHours > targetHours;

  return (
    <Card className="bg-white shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-purple-600" />
          Weekly Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-slate-500" />
            <span className="text-sm text-slate-600">Target: {targetHours} hours</span>
          </div>
          <span className="text-2xl font-bold text-slate-900">
            {weekHours.toFixed(1)}h
          </span>
        </div>

        <div className="space-y-2">
          <Progress 
            value={progressPercentage} 
            className={`h-3 ${isOvertime ? '[&>div]:bg-orange-500' : '[&>div]:bg-blue-600'}`}
          />
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">
              {progressPercentage.toFixed(0)}% complete
            </span>
            {isOvertime && (
              <span className="text-orange-600 font-medium">
                +{(weekHours - targetHours).toFixed(1)}h overtime
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div className="text-center">
            <p className="text-sm text-slate-600">Regular Hours</p>
            <p className="text-lg font-bold text-slate-900">
              {Math.min(weekHours, targetHours).toFixed(1)}h
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-slate-600">Overtime</p>
            <p className="text-lg font-bold text-orange-600">
              {Math.max(0, weekHours - targetHours).toFixed(1)}h
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}