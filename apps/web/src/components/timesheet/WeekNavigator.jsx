import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { format, startOfWeek, endOfWeek } from "date-fns";

export default function WeekNavigator({ 
  currentWeek, 
  onPrevious, 
  onNext, 
  onCurrent, 
  isCurrentWeek 
}) {
  return (
    <Card className="bg-white shadow-lg">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={onPrevious}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </Button>

          <div className="text-center">
            <div className="font-semibold text-slate-900">
              {format(startOfWeek(currentWeek), 'MMM d')} - {format(endOfWeek(currentWeek), 'MMM d, yyyy')}
            </div>
            <div className="text-sm text-slate-600">
              {format(currentWeek, "'Week of' MMMM yyyy")}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isCurrentWeek && (
              <Button
                variant="outline"
                onClick={onCurrent}
                className="flex items-center gap-2"
              >
                <Calendar className="w-4 h-4" />
                Current
              </Button>
            )}
            <Button
              variant="outline"
              onClick={onNext}
              className="flex items-center gap-2"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}