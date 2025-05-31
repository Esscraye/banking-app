"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
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
  CreditCard,
  Plus,
  Edit,
  Trash,
  ArrowLeft,
  ArrowUpRight,
  ArrowDownLeft,
} from "lucide-react";
import Link from "next/link";

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [accountTransactions, setAccountTransactions] = useState<Transaction[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newAccount, setNewAccount] = useState({
    account_type: "checking",
    currency: "EUR",
  });

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const accountsData = await accountsService.getAccounts();
      setAccounts(Array.isArray(accountsData) ? accountsData : []);
    } catch (err) {
      setError("Failed to load accounts");
      console.error("Accounts error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAccountTransactions = async (accountId: number) => {
    try {
      const transactions =
        await transactionsService.getAccountTransactions(accountId);
      setAccountTransactions(Array.isArray(transactions) ? transactions : []);
    } catch (err) {
      console.error("Failed to load account transactions:", err);
    }
  };

  const handleSelectAccount = async (account: Account) => {
    setSelectedAccount(account);
    await fetchAccountTransactions(account.id);
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await accountsService.createAccount(newAccount);
      setShowCreateForm(false);
      setNewAccount({ account_type: "checking", currency: "EUR" });
      fetchAccounts();
    } catch (err) {
      console.error("Failed to create account:", err);
      setError("Failed to create account");
    }
  };

  const handleUpdateAccountStatus = async (
    accountId: number,
    status: string,
  ) => {
    try {
      await accountsService.updateAccount(accountId, { status });
      fetchAccounts();
      if (selectedAccount && selectedAccount.id === accountId) {
        setSelectedAccount({
          ...selectedAccount,
          status: status as "active" | "frozen" | "closed",
        });
      }
    } catch (err) {
      console.error("Failed to update account:", err);
      setError("Failed to update account");
    }
  };

  const handleDeleteAccount = async (accountId: number) => {
    if (
      !confirm(
        "Are you sure you want to delete this account? This action cannot be undone.",
      )
    ) {
      return;
    }

    try {
      await accountsService.deleteAccount(accountId);
      fetchAccounts();
      if (selectedAccount && selectedAccount.id === accountId) {
        setSelectedAccount(null);
        setAccountTransactions([]);
      }
    } catch (err) {
      console.error("Failed to delete account:", err);
      setError(
        "Failed to delete account. Make sure the account balance is zero.",
      );
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "text-green-600 bg-green-100";
      case "frozen":
        return "text-yellow-600 bg-yellow-100";
      case "closed":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-4 w-[100px]" />
                  <Skeleton className="h-4 w-[80px]" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-[120px]" />
                  <Skeleton className="h-4 w-[80px] mt-2" />
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
              <h1 className="text-2xl font-bold text-gray-900">
                Account Management
              </h1>
            </div>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Account
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Create Account Form */}
        {showCreateForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Create New Account</CardTitle>
              <CardDescription>
                Add a new account to your banking portfolio.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateAccount} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Account Type
                  </label>
                  <select
                    value={newAccount.account_type}
                    onChange={(e) =>
                      setNewAccount({
                        ...newAccount,
                        account_type: e.target.value,
                      })
                    }
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                  >
                    <option value="checking">Checking Account</option>
                    <option value="savings">Savings Account</option>
                    <option value="credit">Credit Account</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Currency
                  </label>
                  <select
                    value={newAccount.currency}
                    onChange={(e) =>
                      setNewAccount({ ...newAccount, currency: e.target.value })
                    }
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                  >
                    <option value="EUR">EUR (€)</option>
                    <option value="USD">USD ($)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>
                <div className="flex space-x-2">
                  <Button type="submit">Create Account</Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Accounts List */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Your Accounts</h2>
            <div className="space-y-4">
              {accounts.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-6">
                    <p className="text-gray-500 mb-4">
                      No accounts found. Create your first account!
                    </p>
                    <Button onClick={() => setShowCreateForm(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Account
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                accounts.map((account) => (
                  <Card
                    key={account.id}
                    className={`cursor-pointer transition-colors ${
                      selectedAccount?.id === account.id
                        ? "ring-2 ring-blue-500 bg-blue-50"
                        : "hover:bg-gray-50"
                    }`}
                    onClick={() => handleSelectAccount(account)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <CreditCard className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium capitalize">
                              {account.account_type} Account
                            </p>
                            <p className="text-sm text-gray-500">
                              {account.account_number}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-lg">
                            {account.balance.toFixed(2)} {account.currency}
                          </p>
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                              account.status,
                            )}`}
                          >
                            {account.status}
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            const newStatus =
                              account.status === "active" ? "frozen" : "active";
                            handleUpdateAccountStatus(account.id, newStatus);
                          }}
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          {account.status === "active" ? "Freeze" : "Activate"}
                        </Button>
                        {account.balance === 0 && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteAccount(account.id);
                            }}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash className="h-3 w-3 mr-1" />
                            Delete
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>

          {/* Account Details */}
          <div>
            {selectedAccount ? (
              <>
                <h2 className="text-lg font-semibold mb-4">Account Details</h2>
                <Card className="mb-4">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <CreditCard className="h-5 w-5 mr-2" />
                      {selectedAccount.account_type} Account
                    </CardTitle>
                    <CardDescription>
                      Account Number: {selectedAccount.account_number}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500">
                          Balance
                        </p>
                        <p className="text-2xl font-bold">
                          {selectedAccount.balance.toFixed(2)}{" "}
                          {selectedAccount.currency}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">
                          Status
                        </p>
                        <span
                          className={`inline-flex px-2 py-1 text-sm font-medium rounded-full ${getStatusColor(
                            selectedAccount.status,
                          )}`}
                        >
                          {selectedAccount.status}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">
                          Created
                        </p>
                        <p className="text-sm">
                          {new Date(
                            selectedAccount.created_at,
                          ).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">
                          Updated
                        </p>
                        <p className="text-sm">
                          {new Date(
                            selectedAccount.updated_at,
                          ).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Account Transactions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Transactions</CardTitle>
                    <CardDescription>
                      Transaction history for this account.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {accountTransactions.length === 0 ? (
                        <p className="text-gray-500 text-center py-4">
                          No transactions found for this account
                        </p>
                      ) : (
                        accountTransactions.slice(0, 10).map((transaction) => {
                          const isCredit = transaction.type === "credit";
                          return (
                            <div
                              key={transaction.id}
                              className="flex items-center justify-between p-3 border rounded-lg"
                            >
                              <div className="flex items-center space-x-3">
                                <div
                                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                    isCredit ? "bg-green-100" : "bg-red-100"
                                  }`}
                                >
                                  {isCredit ? (
                                    <ArrowDownLeft className="h-4 w-4 text-green-600" />
                                  ) : (
                                    <ArrowUpRight className="h-4 w-4 text-red-600" />
                                  )}
                                </div>
                                <div>
                                  <p className="font-medium">
                                    {transaction.description ||
                                      transaction.type}
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    {transaction.reference}
                                  </p>
                                  <p className="text-xs text-gray-400">
                                    {new Date(
                                      transaction.created_at,
                                    ).toLocaleString()}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p
                                  className={`font-semibold ${
                                    isCredit ? "text-green-600" : "text-red-600"
                                  }`}
                                >
                                  {isCredit ? "+" : "-"}
                                  {transaction.amount.toFixed(2)}{" "}
                                  {transaction.currency}
                                </p>
                                <span
                                  className={`inline-flex px-1 py-0.5 text-xs rounded ${
                                    transaction.status === "completed"
                                      ? "bg-green-100 text-green-800"
                                      : transaction.status === "pending"
                                        ? "bg-yellow-100 text-yellow-800"
                                        : "bg-red-100 text-red-800"
                                  }`}
                                >
                                  {transaction.status}
                                </span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">
                    Select an account to view details and transactions
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
