"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
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
  DollarSign,
  TrendingUp,
  Bell,
  LogOut,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  User,
  Wallet,
  ArrowLeftRight,
} from "lucide-react";
import Link from "next/link";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [accountsResponse, transactionsResponse] = await Promise.all([
        accountsService.getAccounts(),
        transactionsService.getTransactions(),
      ]);

      // Ensure responses are arrays
      const accountsData = Array.isArray(accountsResponse)
        ? accountsResponse
        : [];
      const transactionsData = Array.isArray(transactionsResponse)
        ? transactionsResponse
        : [];

      setAccounts(accountsData);
      setRecentTransactions(transactionsData.slice(0, 5)); // Get latest 5 transactions
    } catch (err: unknown) {
      setError("Failed to load dashboard data");
      console.error("Dashboard error:", err);
    } finally {
      setLoading(false);
    }
  };

  const getTotalBalance = () => {
    if (!Array.isArray(accounts)) return 0;
    return accounts.reduce(
      (total, account) => total + (account.balance || 0),
      0,
    );
  };

  const handleCreateAccount = async () => {
    try {
      await accountsService.createAccount({
        account_type: "checking",
        currency: "EUR",
      });
      fetchDashboardData(); // Refresh data
    } catch (err) {
      console.error("Failed to create account:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Skeleton className="h-4 w-[100px]" />
                  <Skeleton className="h-4 w-4" />
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
            <h1 className="text-2xl font-bold text-gray-900">
              Banking Dashboard
            </h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                Welcome, {user?.first_name} {user?.last_name}
              </span>
              <Link href="/notifications">
                <Button variant="ghost" size="sm">
                  <Bell className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/profile">
                <Button variant="ghost" size="sm">
                  <User className="h-4 w-4" />
                </Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={logout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Menu */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 h-12 items-center">
            <Link href="/">
              <Button variant="ghost" size="sm" className="text-blue-600">
                <DollarSign className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
            </Link>
            <Link href="/accounts">
              <Button variant="ghost" size="sm">
                <Wallet className="h-4 w-4 mr-2" />
                Accounts
              </Button>
            </Link>
            <Link href="/transactions">
              <Button variant="ghost" size="sm">
                <ArrowLeftRight className="h-4 w-4 mr-2" />
                Transactions
              </Button>
            </Link>
            <Link href="/notifications">
              <Button variant="ghost" size="sm">
                <Bell className="h-4 w-4 mr-2" />
                Notifications
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Balance
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                €{getTotalBalance().toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                Across {accounts.length} account
                {accounts.length !== 1 ? "s" : ""}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Accounts
              </CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {accounts.filter((a) => a.status === "active").length}
              </div>
              <p className="text-xs text-muted-foreground">
                {accounts.filter((a) => a.status !== "active").length} inactive
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Recent Transactions
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {recentTransactions.length}
              </div>
              <p className="text-xs text-muted-foreground">
                Last 5 transactions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Quick Actions
              </CardTitle>
              <Plus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                size="sm"
                onClick={handleCreateAccount}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Account
              </Button>
              <Link href="/transactions">
                <Button variant="outline" size="sm" className="w-full">
                  <ArrowLeftRight className="h-4 w-4 mr-2" />
                  Make Transfer
                </Button>
              </Link>
              <Link href="/accounts">
                <Button variant="outline" size="sm" className="w-full">
                  <Wallet className="h-4 w-4 mr-2" />
                  Manage Accounts
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          {/* Accounts List */}
          <Card className="col-span-4">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Your Accounts</CardTitle>
                <CardDescription>
                  Manage your banking accounts and view balances.
                </CardDescription>
              </div>
              <Link href="/accounts">
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {accounts.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-gray-500">
                      No accounts found. Create your first account!
                    </p>
                    <Button onClick={handleCreateAccount} className="mt-2">
                      Create Account
                    </Button>
                  </div>
                ) : (
                  accounts.map((account) => (
                    <div
                      key={account.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center space-x-4">
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
                        <p className="font-semibold">
                          €{account.balance.toFixed(2)}
                        </p>
                        <p
                          className={`text-sm ${
                            account.status === "active"
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {account.status === "active"
                            ? "Active"
                            : account.status}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Transactions */}
          <Card className="col-span-3">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription>Your latest account activity.</CardDescription>
              </div>
              <Link href="/transactions">
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentTransactions.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">
                    No recent transactions
                  </p>
                ) : (
                  recentTransactions.map((transaction) => {
                    const isCredit = transaction.type === "credit";
                    return (
                      <div
                        key={transaction.id}
                        className="flex items-center space-x-4"
                      >
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
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {transaction.description || transaction.type}
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(
                              transaction.created_at,
                            ).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-sm font-medium">
                          <span
                            className={
                              isCredit ? "text-green-600" : "text-red-600"
                            }
                          >
                            {isCredit ? "+" : "-"}€
                            {transaction.amount.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
