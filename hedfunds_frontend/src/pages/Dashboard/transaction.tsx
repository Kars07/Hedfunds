import React, { useState } from "react";

interface Transaction {
  description: string;
  date: string;
  amount: number;
}

const Transactions: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  return (
    <div className="p-6 bg-gray-900 text-white rounded-lg shadow-md space-y-4">
      {/* Header Section */}
      <div>
        <h2 className="text-xl font-bold flex items-center">
          Transactions
          <i className="bx bx-wallet text-xl ml-2"></i>
        </h2>
        <p className="text-sm text-gray-400 mt-1">
          This wallet has a total of {transactions.length} transactions.
        </p>
        <p className="text-sm text-gray-400">
          Click on a transaction to see more details or set a filter to narrow down the list.
        </p>
      </div>

      {/* Transactions List */}
      {transactions.length === 0 ? (
        <div className="bg-gray-800 p-4 rounded-lg text-center text-gray-400">
          This account has no transactions.
        </div>
      ) : (
        <div className="space-y-4">
          {transactions.map((transaction, index) => (
            <div
              key={index}
              className="bg-gray-800 p-4 rounded-lg flex justify-between items-center hover:bg-gray-700 transition"
            >
              <div>
                <p className="text-white font-semibold">{transaction.description}</p>
                <p className="text-sm text-gray-400">{transaction.date}</p>
              </div>
              <p
                className={`text-lg font-bold ${
                  transaction.amount > 0 ? "text-green-400" : "text-red-400"
                }`}
              >
                {transaction.amount > 0 ? "+" : ""}
                {transaction.amount.toLocaleString()} ₦
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Transactions;