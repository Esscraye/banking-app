"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  accountsService,
  transactionsService,
  Account,
  Transaction,
} from "@/lib/services";
import {
  ArrowLeft,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Send,
} from "lucide-react";
import Link from "next/link";

export default function TransactionsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [showTransferForm, setShowTransferForm] = useState(false);

  const [newTransaction, setNewTransaction] = useState({
    account_id: "",
    type: "credit",
    amount: "",
    description: "",
  });

  const [newTransfer, setNewTransfer] = useState({
    from_account_id: "",
    to_account_id: "",
    amount: "",
    description: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [accountsData, transactionsData] = await Promise.all([
        accountsService.getAccounts(),
        transactionsService.getTransactions(),
      ]);

      setAccounts(Array.isArray(accountsData) ? accountsData : []);
      setTransactions(Array.isArray(transactionsData) ? transactionsData : []);
    } catch (err) {
      setError("Failed to load data");
      console.error("Transactions page error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await transactionsService.createTransaction({
        account_id: parseInt(newTransaction.account_id),
        type: newTransaction.type,
        amount: parseFloat(newTransaction.amount),
        description: newTransaction.description,
      });

      setShowTransactionForm(false);
      setNewTransaction({
        account_id: "",
        type: "credit",
        amount: "",
        description: "",
      });
      fetchData();
    } catch (err) {
      console.error("Failed to create transaction:", err);
      setError("Failed to create transaction");
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await transactionsService.transfer({
        from_account_id: parseInt(newTransfer.from_account_id),
        to_account_id: parseInt(newTransfer.to_account_id),
        amount: parseFloat(newTransfer.amount),
        description: newTransfer.description,
      });

      setShowTransferForm(false);
      setNewTransfer({
        from_account_id: "",
        to_account_id: "",
        amount: "",
        description: "",
      });
      fetchData();
    } catch (err) {
      console.error("Failed to transfer:", err);
      setError("Failed to process transfer");
    }
  };

  const getTransactionIcon = (transaction: Transaction) => {
    if (transaction.type === "transfer") {
      return <Send className="h-4 w-4" />;
    }
    return transaction.type === "credit" ? (
      <ArrowDownLeft className="h-4 w-4" />
    ) : (
      <ArrowUpRight className="h-4 w-4" />
    );
  };

  const getTransactionColor = (transaction: Transaction) => {
    if (transaction.type === "transfer") {
      return "text-blue-600 bg-blue-100";
    }
    return transaction.type === "credit"
      ? "text-green-600 bg-green-100"
      : "text-red-600 bg-red-100";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-[200px]" />
                      <Skeleton className="h-3 w-[150px] mt-2" />
                    </div>
                    <Skeleton className="h-6 w-[100px]" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
            </div>
            <div className="flex space-x-2">
              <Button onClick={() => setShowTransactionForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Transaction
              </Button>
              <Button
                onClick={() => setShowTransferForm(true)}
                variant="outline"
              >
                <Send className="h-4 w-4 mr-2" />
                Transfer
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Transaction Form */}
        {showTransactionForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Create New Transaction</CardTitle>
              <CardDescription>
                Add a deposit or withdrawal to an account.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateTransaction} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Account
                  </label>
                  <select
                    value={newTransaction.account_id}
                    onChange={(e) =>
                      setNewTransaction({
                        ...newTransaction,
                        account_id: e.target.value,
                      })
                    }
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                  >
                    <option value="">Select an account</option>
                    {accounts
                      .filter((account) => account.status === "active")
                      .map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.account_type} - {account.account_number} (
                          {account.balance.toFixed(2)} {account.currency})
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Transaction Type
                  </label>
                  <select
                    value={newTransaction.type}
                    onChange={(e) =>
                      setNewTransaction({
                        ...newTransaction,
                        type: e.target.value,
                      })
                    }
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                  >
                    <option value="credit">Deposit (Credit)</option>
                    <option value="debit">Withdrawal (Debit)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Amount
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={newTransaction.amount}
                    onChange={(e) =>
                      setNewTransaction({
                        ...newTransaction,
                        amount: e.target.value,
                      })
                    }
                    placeholder="0.00"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Description
                  </label>
                  <Input
                    value={newTransaction.description}
                    onChange={(e) =>
                      setNewTransaction({
                        ...newTransaction,
                        description: e.target.value,
                      })
                    }
                    placeholder="Optional description"
                  />
                </div>
                <div className="flex space-x-2">
                  <Button type="submit">Create Transaction</Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowTransactionForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Transfer Form */}
        {showTransferForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Transfer Between Accounts</CardTitle>
              <CardDescription>
                Transfer money from one account to another.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleTransfer} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    From Account
                  </label>
                  <select
                    value={newTransfer.from_account_id}
                    onChange={(e) =>
                      setNewTransfer({
                        ...newTransfer,
                        from_account_id: e.target.value,
                      })
                    }
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                  >
                    <option value="">Select source account</option>
                    {accounts
                      .filter((account) => account.status === "active")
                      .map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.account_type} - {account.account_number} (
                          {account.balance.toFixed(2)} {account.currency})
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    To Account
                  </label>
                  <select
                    value={newTransfer.to_account_id}
                    onChange={(e) =>
                      setNewTransfer({
                        ...newTransfer,
                        to_account_id: e.target.value,
                      })
                    }
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                  >
                    <option value="">Select destination account</option>
                    {accounts
                      .filter((account) => account.status === "active")
                      .map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.account_type} - {account.account_number} (
                          {account.balance.toFixed(2)} {account.currency})
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Amount
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={newTransfer.amount}
                    onChange={(e) =>
                      setNewTransfer({ ...newTransfer, amount: e.target.value })
                    }
                    placeholder="0.00"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Description
                  </label>
                  <Input
                    value={newTransfer.description}
                    onChange={(e) =>
                      setNewTransfer({
                        ...newTransfer,
                        description: e.target.value,
                      })
                    }
                    placeholder="Optional transfer description"
                  />
                </div>
                <div className="flex space-x-2">
                  <Button type="submit">Transfer Funds</Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowTransferForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Transactions List */}
        <Card>
          <CardHeader>
            <CardTitle>All Transactions</CardTitle>
            <CardDescription>
              Complete history of all your transactions across all accounts.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {transactions.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">
                    No transactions found. Create your first transaction!
                  </p>
                  <Button onClick={() => setShowTransactionForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Transaction
                  </Button>
                </div>
              ) : (
                transactions.map((transaction) => {
                  const account = accounts.find(
                    (acc) => acc.id === transaction.account_id,
                  );
                  return (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center space-x-4">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${getTransactionColor(
                            transaction,
                          )}`}
                        >
                          {getTransactionIcon(transaction)}
                        </div>
                        <div>
                          <p className="font-medium">
                            {transaction.description ||
                              `${transaction.type} transaction`}
                          </p>
                          <p className="text-sm text-gray-500">
                            {account
                              ? `${account.account_type} - ${account.account_number}`
                              : `Account ${transaction.account_id}`}
                          </p>
                          <p className="text-sm text-gray-500">
                            Ref: {transaction.reference}
                          </p>
                          <p className="text-xs text-gray-400">
                            {new Date(transaction.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p
                          className={`font-semibold text-lg ${
                            transaction.type === "credit"
                              ? "text-green-600"
                              : transaction.type === "debit"
                                ? "text-red-600"
                                : "text-blue-600"
                          }`}
                        >
                          {transaction.type === "credit"
                            ? "+"
                            : transaction.type === "debit"
                              ? "-"
                              : ""}
                          {transaction.amount.toFixed(2)} {transaction.currency}
                        </p>
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                            transaction.status,
                          )}`}
                        >
                          {transaction.status}
                        </span>
                        {transaction.processed_at && (
                          <p className="text-xs text-gray-400 mt-1">
                            Processed:{" "}
                            {new Date(
                              transaction.processed_at,
                            ).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
