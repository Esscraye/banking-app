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
import { notificationsService, Notification } from "@/lib/services";
import {
  ArrowLeft,
  Plus,
  Bell,
  Mail,
  MessageSquare,
  Smartphone,
  Check,
  Trash,
} from "lucide-react";
import Link from "next/link";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);

  const [newNotification, setNewNotification] = useState({
    type: "system",
    title: "",
    message: "",
  });

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const notificationsData = await notificationsService.getNotifications();
      setNotifications(
        Array.isArray(notificationsData) ? notificationsData : [],
      );
    } catch (err) {
      setError("Failed to load notifications");
      console.error("Notifications error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await notificationsService.createNotification(newNotification);
      setShowCreateForm(false);
      setNewNotification({
        type: "system",
        title: "",
        message: "",
      });
      fetchNotifications();
    } catch (err) {
      console.error("Failed to create notification:", err);
      setError("Failed to create notification");
    }
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      await notificationsService.markAsRead(id);
      setNotifications(
        notifications.map((notif) =>
          notif.id === id ? { ...notif, is_read: true } : notif,
        ),
      );
    } catch (err) {
      console.error("Failed to mark as read:", err);
      setError("Failed to mark notification as read");
    }
  };

  const handleDeleteNotification = async (id: number) => {
    if (!confirm("Are you sure you want to delete this notification?")) {
      return;
    }

    try {
      await notificationsService.deleteNotification(id);
      setNotifications(notifications.filter((notif) => notif.id !== id));
    } catch (err) {
      console.error("Failed to delete notification:", err);
      setError("Failed to delete notification");
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "email":
        return <Mail className="h-5 w-5" />;
      case "sms":
        return <MessageSquare className="h-5 w-5" />;
      case "push":
        return <Smartphone className="h-5 w-5" />;
      case "system":
      default:
        return <Bell className="h-5 w-5" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "email":
        return "text-blue-600 bg-blue-100";
      case "sms":
        return "text-green-600 bg-green-100";
      case "push":
        return "text-purple-600 bg-purple-100";
      case "system":
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "sent":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const unreadCount = notifications.filter((notif) => !notif.is_read).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-8 w-48 mb-6" data-testid="skeleton" />
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex items-start space-x-4">
                    <Skeleton
                      className="h-10 w-10 rounded-full"
                      data-testid="skeleton"
                    />
                    <div className="flex-1">
                      <Skeleton
                        className="h-4 w-[200px]"
                        data-testid="skeleton"
                      />
                      <Skeleton
                        className="h-3 w-[300px] mt-2"
                        data-testid="skeleton"
                      />
                      <Skeleton
                        className="h-3 w-[150px] mt-2"
                        data-testid="skeleton"
                      />
                    </div>
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
              <h1 className="text-2xl font-bold text-gray-900">
                Notifications
              </h1>
              {unreadCount > 0 && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  {unreadCount} unread
                </span>
              )}
            </div>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Notification
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Create Notification Form */}
        {showCreateForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Create New Notification</CardTitle>
              <CardDescription>
                Send a notification to yourself for testing purposes.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateNotification} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Notification Type
                  </label>
                  <select
                    value={newNotification.type}
                    onChange={(e) =>
                      setNewNotification({
                        ...newNotification,
                        type: e.target.value,
                      })
                    }
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                  >
                    <option value="system">System</option>
                    <option value="email">Email</option>
                    <option value="sms">SMS</option>
                    <option value="push">Push Notification</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Title
                  </label>
                  <Input
                    value={newNotification.title}
                    onChange={(e) =>
                      setNewNotification({
                        ...newNotification,
                        title: e.target.value,
                      })
                    }
                    placeholder="Notification title"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Message
                  </label>
                  <textarea
                    value={newNotification.message}
                    onChange={(e) =>
                      setNewNotification({
                        ...newNotification,
                        message: e.target.value,
                      })
                    }
                    placeholder="Notification message"
                    className="w-full p-2 border border-gray-300 rounded-md"
                    rows={3}
                    required
                  />
                </div>
                <div className="flex space-x-2">
                  <Button type="submit" data-testid="submit-notification">
                    Create Notification
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateForm(false)}
                    data-testid="cancel-notification"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Notifications List */}
        <div className="space-y-4">
          {notifications.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">
                  No notifications found. Create your first notification!
                </p>
                <Button onClick={() => setShowCreateForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Notification
                </Button>
              </CardContent>
            </Card>
          ) : (
            notifications.map((notification) => (
              <Card
                key={notification.id}
                className={`transition-all ${
                  notification.is_read
                    ? "bg-white"
                    : "bg-blue-50 border-blue-200 shadow-md"
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${getTypeColor(
                          notification.type,
                        )}`}
                      >
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3
                              className={`text-lg font-medium ${
                                notification.is_read
                                  ? "text-gray-900"
                                  : "text-gray-900 font-semibold"
                              }`}
                            >
                              {notification.title}
                            </h3>
                            <p className="text-gray-600 mt-1">
                              {notification.message}
                            </p>
                          </div>
                          {!notification.is_read && (
                            <div className="w-3 h-3 bg-blue-500 rounded-full ml-2 flex-shrink-0"></div>
                          )}
                        </div>

                        <div className="flex items-center space-x-4 mt-3">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-medium rounded capitalize ${getTypeColor(
                              notification.type,
                            )}`}
                          >
                            {notification.type}
                          </span>
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                              notification.status,
                            )}`}
                          >
                            {notification.status}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(notification.created_at).toLocaleString()}
                          </span>
                          {notification.sent_at && (
                            <span className="text-xs text-gray-500">
                              Sent:{" "}
                              {new Date(notification.sent_at).toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      {!notification.is_read && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleMarkAsRead(notification.id)}
                          title="Mark as read"
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          handleDeleteNotification(notification.id)
                        }
                        className="text-red-600 hover:text-red-700"
                        title="Delete notification"
                      >
                        <Trash className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Summary Stats */}
        {notifications.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Notification Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">
                    {notifications.length}
                  </p>
                  <p className="text-sm text-gray-500">Total</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">
                    {unreadCount}
                  </p>
                  <p className="text-sm text-gray-500">Unread</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {notifications.filter((n) => n.status === "sent").length}
                  </p>
                  <p className="text-sm text-gray-500">Sent</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-yellow-600">
                    {notifications.filter((n) => n.status === "pending").length}
                  </p>
                  <p className="text-sm text-gray-500">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
