import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useWallet } from "./Dashboard";

interface RepaymentData {
  date: string;          // Formatted date string for display
  timestamp: number;     // Original timestamp for sorting
  amountRepaid: number;  // Total amount repaid (loan + interest)
}


type RepaidLoan = {
  id: string;
  data: {
    repaidAt: number;
    repaymentTxHash: string;
    loanAmount: string;
    interest: string;
    originalLoanId?: string;
    lenderPKH: string;
    borrowerPKH: string;
  };
};

const API_BASE_URL = "http://localhost:5000/api/loans";
const RepaymentTimelineChart: React.FC = () => {
  const { connection } = useWallet();
  const [chartData, setChartData] = useState<RepaymentData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Format lovelace to ADA
  function lovelaceToAda(lovelace: string): number {
    return Number(lovelace) / 1_000_000;
  }

  // Format date for display
  function formatDate(timestamp: number): string {
    return new Date(timestamp).toISOString().split('T')[0]; // YYYY-MM-DD format
  }

  // Load repayment history from localStorage
  useEffect(() => {
    if (!connection || !connection.pkh) {
      setChartData([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const repaidLoansTracking = JSON.parse(localStorage.getItem('repaidLoans') || '{}');
      const fundedLoansTracking = JSON.parse(localStorage.getItem('fundedLoans') || '{}');
      
      // Build repayment history for the current user
      const history: RepaidLoan[] = [];
      
      for (const [fundedLoanId, repaymentData] of Object.entries(repaidLoansTracking)) {
        const repaymentInfo = repaymentData as any;
        
        // Find the loan tracking info
        const loanInfo = Object.values(fundedLoansTracking).find(
          (info: any) => info.fundedLoanId === fundedLoanId
        ) as any;
        
        // Only include if the user is the borrower
        if (loanInfo && loanInfo.borrowerPKH === connection.pkh) {
          history.push({
            id: fundedLoanId,
            data: {
              ...repaymentInfo,
              lenderPKH: loanInfo.lenderPKH,
              borrowerPKH: loanInfo.borrowerPKH,
              loanAmount: repaymentInfo.loanAmount || loanInfo.loanAmount,
              interest: repaymentInfo.interest || loanInfo.interest
            }
          });
        }
      }
      
      // Format the data for the chart
      const formattedData = history.map(loan => {
        const loanAmount = lovelaceToAda(loan.data.loanAmount);
        const interest = lovelaceToAda(loan.data.interest);
        const totalRepaid = loanAmount + interest;
        
        return {
          date: formatDate(loan.data.repaidAt),
          timestamp: loan.data.repaidAt,
          amountRepaid: totalRepaid
        };
      });
      
      // Sort by timestamp (oldest first for the chart)
      formattedData.sort((a, b) => a.timestamp - b.timestamp);
      
      setChartData(formattedData);
    } catch (error) {
      console.error("Error loading repayment data for chart:", error);
      setError("Failed to load repayment data");
    } finally {
      setIsLoading(false);
    }
  }, [connection]);

  // Custom tooltip for the chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white  p-4 border border-gray-200 rounded shadow-lg">
          <p className="font-medium">{label}</p>
          <p className="text-green-600">
            Amount Repaid: {payload[0].value.toFixed(6)} ADA
          </p>
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="w-full h-[300px] bg-white p-4 rounded-2xl shadow-md flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
          <p className="mt-2 text-gray-600">Loading repayment data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-[300px] bg-white p-4 rounded-2xl shadow-md flex items-center justify-center">
        <div className="text-center text-red-600">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="w-full h-[300px] bg-white p-6  rounded-2xl shadow-md">
        <h2 className="text-xl font-semibold mb-4 py-9 text-gray-800">Repayment Timeline</h2>
        <div className="h-full flex items-center justify-center">
          <p className="text-gray-500">No repayment data available. Repay a loan to see your timeline.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-[300px]  pt-10 bg-white ">
       <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 12 }}
            label={{ value: 'Repayment Date', position: 'insideBottom', offset: -4 }}
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            label={{ value: 'Amount (ADA)', angle: -90, position: 'insideLeft' , offset:10 , dy:50}}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Line 
            name="Amount Repaid (ADA)" 
            type="monotone" 
            dataKey="amountRepaid" 
            stroke="#22c55e"
            strokeWidth={3} 
            dot={{ r: 5, fill: "#2563eb" }} 
            activeDot={{ r: 8 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RepaymentTimelineChart;