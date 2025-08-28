import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { PTORequest } from "@/api/entities";
import { PTOBalance } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Plus, Clock, AlertCircle } from "lucide-react";

import PTOBalanceCard from "../components/pto/PTOBalanceCard";
import PTORequestForm from "../components/pto/PTORequestForm";
import PTORequestList from "../components/pto/PTORequestList";

export default function PTO() {
  const [user, setUser] = useState(null);
  const [balance, setBalance] = useState(null);
  const [requests, setRequests] = useState([]);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (user) {
      loadPTOData();
    }
  }, [user]);

  const loadUser = async () => {
    try {
      const currentUser = await User.me();
      console.log("Current user loaded:", currentUser);
      console.log("User structure - user.user.id:", currentUser?.user?.id);
      setUser(currentUser);
    } catch (error) {
      console.error("Error loading user:", error);
    }
  };

  const loadPTOData = async () => {
    setLoading(true);
    try {
      // Get the actual user ID from the nested structure
      const userId = user.user.id;  // It's user.user.id based on UserEntity.me()
      console.log("Loading PTO data for userId:", userId);
      
      // Load balance
      const balances = await PTOBalance.filter({ user_id: userId });
      if (balances.length === 0) {
        console.log("No balance found, creating default balance for user:", userId);
        
        const newBalance = await PTOBalance.create({
          user_id: userId,  // Fixed: use userId instead of user.user.id
          policy_id: null,
          balance_hours: 80,
          accrued_hours: 80,
          used_hours: 0
        });
        setBalance(newBalance);
      } else {
        setBalance(balances[0]);
      }

      // Load requests
      const userRequests = await PTORequest.filter(
        { user_id: userId },
        "-created_date"
      );
      setRequests(userRequests);
    } catch (error) {
      console.error("Error loading PTO data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestSubmit = async (requestData) => {
    try {
      const userId = user.user.id;  // Get the actual user ID
      
      console.log("=== PTO Submit Debug ===");
      console.log("User ID being used:", userId);
      console.log("Request data from form:", requestData);
      
      const ptoRequestData = {
        ...requestData,
        user_id: userId,
        employee_id: userId,  // Set both fields to the same user ID
        type: requestData.type || 'unpaid',
        request_type: requestData.request_type || requestData.type || 'unpaid',
        status: "pending"
      };
      
      console.log("Final PTO request data:", ptoRequestData);
      
      const result = await PTORequest.create(ptoRequestData);
      
      console.log("PTO request created:", result);
      console.log("=== End PTO Submit ===");
      
      await loadPTOData();
      setShowRequestForm(false);
    } catch (error) {
      console.error("Error submitting PTO request:", error);
      console.error("Error details:", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        fullError: error
      });
    }
  };

  const handleCancelRequest = async (requestId) => {
    try {
      await PTORequest.update(requestId, { status: "cancelled" });
      await loadPTOData();
    } catch (error) {
      console.error("Error cancelling request:", error);
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array(3).fill(0).map((_, i) => (
              <div key={i} className="h-32 bg-slate-200 rounded-xl"></div>
            ))}
          </div>
          <div className="h-96 bg-slate-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 bg-slate-50 min-h-screen">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Paid Time Off</h1>
          <p className="text-slate-600 mt-1">Manage your time off requests and track your balance</p>
        </div>

        <Button 
          onClick={() => setShowRequestForm(true)}
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Request Time Off
        </Button>
      </div>

      {/* PTO Balance */}
      <PTOBalanceCard balance={balance} />

      {/* PTO Request Form */}
      {showRequestForm && (
        <PTORequestForm
          balance={balance}
          onSubmit={handleRequestSubmit}
          onCancel={() => setShowRequestForm(false)}
        />
      )}

      {/* PTO Requests List */}
      <PTORequestList 
        requests={requests}
        onCancel={handleCancelRequest}
        canCancel={true}
      />
    </div>
  );
}