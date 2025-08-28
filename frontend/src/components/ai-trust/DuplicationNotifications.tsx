import React, { useState, useEffect } from "react";
import {
  Bell,
  BellRing,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  X,
  Clock,
  Filter,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  duplicateProcessor,
  DuplicateNotification,
} from "@/services/duplicateProcessor";

interface DuplicationNotificationsProps {
  className?: string;
}

const DuplicationNotifications: React.FC<DuplicationNotificationsProps> = ({
  className,
}) => {
  const [notifications, setNotifications] = useState<DuplicateNotification[]>(
    [],
  );
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<
    "all" | "unread" | "high" | "medium" | "low"
  >("all");

  useEffect(() => {
    // Load initial notifications
    setNotifications(duplicateProcessor.getNotifications());

    // Subscribe to new notifications
    const unsubscribe = duplicateProcessor.onNotification((notification) => {
      setNotifications((prev) => [notification, ...prev]);
    });

    // Refresh notifications every 30 seconds
    const interval = setInterval(() => {
      setNotifications(duplicateProcessor.getNotifications());
    }, 30000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filteredNotifications = notifications.filter((notification) => {
    switch (filter) {
      case "unread":
        return !notification.read;
      case "high":
      case "medium":
      case "low":
        return notification.severity === filter;
      default:
        return true;
    }
  });

  const handleMarkAsRead = (notificationId: string) => {
    duplicateProcessor.markNotificationRead(notificationId);
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)),
    );
  };

  const handleMarkAllAsRead = () => {
    duplicateProcessor.markAllNotificationsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "duplicate_detected":
        return AlertTriangle;
      case "check_completed":
        return CheckCircle;
      case "check_failed":
        return XCircle;
      default:
        return Bell;
    }
  };

  const getNotificationColor = (severity: string, read: boolean) => {
    const opacity = read ? "opacity-60" : "";
    switch (severity) {
      case "high":
        return `text-red-400 ${opacity}`;
      case "medium":
        return `text-orange-400 ${opacity}`;
      case "low":
        return `text-green-400 ${opacity}`;
      default:
        return `text-gray-400 ${opacity}`;
    }
  };

  const getSeverityBadgeColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case "medium":
        return "bg-orange-500/20 text-orange-400 border-orange-500/30";
      case "low":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <div className={`relative ${className}`}>
      {/* Notification Bell */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="relative text-gray-400 hover:text-white"
      >
        {unreadCount > 0 ? (
          <BellRing className="w-5 h-5" />
        ) : (
          <Bell className="w-5 h-5" />
        )}
        {unreadCount > 0 && (
          <Badge className="absolute -top-1 -right-1 bg-red-500 text-white text-xs min-w-[1.25rem] h-5 flex items-center justify-center rounded-full">
            {unreadCount > 99 ? "99+" : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Notification Panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 max-h-96 overflow-hidden glass rounded-xl border border-gray-500/20 z-50">
          {/* Header */}
          <div className="p-4 border-b border-gray-700/50">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-white">Duplicate Alerts</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Filter and Actions */}
            <div className="flex items-center justify-between">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="text-xs bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white"
              >
                <option value="all">All</option>
                <option value="unread">Unread</option>
                <option value="high">High Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="low">Low Priority</option>
              </select>

              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMarkAllAsRead}
                  className="text-xs text-gray-400 hover:text-white"
                >
                  <Check className="w-3 h-3 mr-1" />
                  Mark all read
                </Button>
              )}
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto">
            {filteredNotifications.length === 0 ? (
              <div className="p-6 text-center text-gray-400">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No notifications</p>
              </div>
            ) : (
              <div className="space-y-1">
                {filteredNotifications.map((notification) => {
                  const Icon = getNotificationIcon(notification.type);
                  return (
                    <div
                      key={notification.id}
                      className={`p-3 border-b border-gray-700/30 hover:bg-gray-800/30 transition-colors ${
                        !notification.read ? "bg-blue-500/5" : ""
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Icon
                          className={`w-4 h-4 mt-0.5 flex-shrink-0 ${getNotificationColor(
                            notification.severity,
                            notification.read,
                          )}`}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p
                              className={`text-sm ${
                                notification.read
                                  ? "text-gray-400"
                                  : "text-white"
                              }`}
                            >
                              {notification.message}
                            </p>
                            <Badge
                              className={`text-xs ${getSeverityBadgeColor(notification.severity)}`}
                            >
                              {notification.severity}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <Clock className="w-3 h-3" />
                              {formatTimeAgo(notification.createdAt)}
                            </div>
                            <div className="flex items-center gap-1">
                              {!notification.read && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    handleMarkAsRead(notification.id)
                                  }
                                  className="text-xs text-gray-400 hover:text-white p-1 h-auto"
                                >
                                  <Eye className="w-3 h-3" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          {filteredNotifications.length > 0 && (
            <div className="p-3 border-t border-gray-700/50 text-center">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-gray-400 hover:text-white"
                onClick={() => {
                  setIsOpen(false);
                  // Could navigate to full notifications page
                }}
              >
                View All Notifications
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DuplicationNotifications;
