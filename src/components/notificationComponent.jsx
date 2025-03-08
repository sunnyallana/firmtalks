import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import { io } from 'socket.io-client';
import { useTheme } from '@mui/material/styles';

export function NotificationBell() {
  const { isSignedIn, getToken } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const socketRef = useRef(null);
  const theme = useTheme();

  // Real-time updates with stable dependencies
  useEffect(() => {
    if (!isSignedIn) return;

    socketRef.current = io('http://localhost:3000');

    const handleNewNotification = (notification) => {
      setNotifications(prev => {
        // Use JSON string comparison for more reliable duplicate check
        const exists = prev.some(n => JSON.stringify(n) === JSON.stringify(notification));
        return exists ? prev : [notification, ...prev];
      });
      
      setUnreadCount(prev => (!notification.read ? prev + 1 : prev));
    };

    socketRef.current.on('new-notification', handleNewNotification);

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [isSignedIn]); // Removed theme dependency

  // Initial notifications load with error handling
  useEffect(() => {
    if (!isSignedIn) return;

    const loadNotifications = async () => {
      try {
        const token = await getToken();
        const response = await fetch('http://localhost:3000/api/notifications/me/notifications', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        
        setNotifications(data);
        setUnreadCount(data.filter(n => !n.read).length);
      } catch (error) {
        console.error('Notification load failed:', error);
      }
    };

    loadNotifications();
  }, [isSignedIn, getToken]);

  const handleMarkAsRead = async () => {
    try {
      await fetch('http://localhost:3000/api/notifications/me/notifications/read', {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Mark read failed:', error);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={(e) => setAnchorEl(e.currentTarget)}
        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full focus:outline-none"
      >
        <div className="relative">
          <Bell className="w-6 h-6 text-gray-700 dark:text-gray-300" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">
              {unreadCount}
            </span>
          )}
        </div>
      </button>

      {anchorEl && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setAnchorEl(null)}
        ></div>
      )}

      {anchorEl && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg z-50">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Notifications
              </h3>
              <button
                onClick={handleMarkAsRead}
                className="text-sm text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Mark all as read
              </button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.map((notification) => (
              <Link
                key={notification._id}
                to={`/discussions/${notification.discussion?._id}`}
                className={`block p-4 hover:bg-gray-50 dark:hover:bg-gray-700 ${
                  !notification.read ? 'bg-gray-100 dark:bg-gray-700' : 'bg-white dark:bg-gray-800'
                }`}
              >
                <div className="flex items-center">
                  <img
                    src={notification.sender?.profileImageUrl}
                    alt={notification.sender?.username}
                    className="w-8 h-8 rounded-full mr-3"
                  />
                  <div>
                    <p className="text-sm text-gray-900 dark:text-gray-100">
                      {notification.sender?.username || 'Someone'}{' '}
                      {notification.type === 'reply' ? 'replied to' : 'liked'}{' '}
                      {notification.type === 'like' && notification.reply ? 
                        'your reply' : 
                        notification.discussion?.title ? 
                        `"${notification.discussion.title}"` : 
                        'your discussion'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(notification.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}