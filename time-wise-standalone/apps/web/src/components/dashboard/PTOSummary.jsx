import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Plus, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { PTOBalance } from "@/api/entities";
import { PTORequest } from "@/api/entities";

export default function PTOSummary({ user }) {
  const [balance, setBalance] = useState(null);
  const [recentRequests, setRecentRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadPTOData();
    }
  }, [user]);

  const loadPTOData = async () => {
    try {
      // Load PTO balance
      const balances = await PTOBalance.filter({ user_id: user.id });
      setBalance(balances[0] || null);

      // Load recent PTO requests
      const requests = await PTORequest.filter({ user_id: user.id }, "-created_date", 3);
      setRecentRequests(requests);
    } catch (error) {
      console.error("Error loading PTO data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-800",
      denied: "bg-red-100 text-red-800",
      cancelled: "bg-gray-100 text-gray-800"
    };
    return colors[status] || colors.pending;
  };

  if (loading) {
    return (
      <Card className="bg-white shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600" />
            PTO Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-20 bg-slate-200 rounded"></div>
            <div className="space-y-2">
              {Array(2).fill(0).map((_, i) => (
                <div key={i} className="h-16 bg-slate-200 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600" />
            PTO Summary
          </div>
          <Link to={createPageUrl("PTO")}>
            <Button variant="outline" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Request PTO
            </Button>
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Balance Card */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-xl">
            <div className="text-2xl font-bold text-blue-900">
              {balance?.balance_hours?.toFixed(1) || '0.0'}h
            </div>
            <div className="text-sm text-blue-700">Available</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-xl">
            <div className="text-2xl font-bold text-green-900">
              {balance?.accrued_hours?.toFixed(1) || '0.0'}h
            </div>
            <div className="text-sm text-green-700">Accrued</div>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-xl">
            <div className="text-2xl font-bold text-orange-900">
              {balance?.used_hours?.toFixed(1) || '0.0'}h
            </div>
            <div className="text-sm text-orange-700">Used</div>
          </div>
        </div>

        {/* Recent Requests */}
        <div>
          <h4 className="font-semibold text-slate-900 mb-3">Recent Requests</h4>
          {recentRequests.length === 0 ? (
            <div className="text-center py-6 text-slate-500">
              <Clock className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p className="text-sm">No recent PTO requests</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentRequests.map((request) => (
                <div key={request.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-900 capitalize">
                        {request.type}
                      </span>
                      <Badge className={getStatusColor(request.status)}>
                        {request.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-slate-600">
                      {new Date(request.start_date).toLocaleDateString()} - {new Date(request.end_date).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-sm font-medium text-slate-900">
                    {request.total_hours}h
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}