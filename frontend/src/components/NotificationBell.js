import React, { useState, useEffect, useRef } from 'react';
import { HiBell, HiCheck, HiTrash, HiClipboardList, HiMail, HiX } from 'react-icons/hi';

function NotificationBell({ token, darkMode, onNavigate }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/notifications', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const markAsRead = async (id) => {
    try {
      await fetch(`http://localhost:5000/api/notifications/${id}/read`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchNotifications();
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch('http://localhost:5000/api/notifications/read-all', {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchNotifications();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const deleteNotification = async (id, e) => {
    e.stopPropagation();
    try {
      await fetch(`http://localhost:5000/api/notifications/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchNotifications();
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handleNotificationClick = async (notification) => {
    // تحديث الحالة كمقروء
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }
    
    // توجيه المستخدم حسب نوع الإشعار
    if (notification.data) {
      const data = typeof notification.data === 'string' ? JSON.parse(notification.data) : notification.data;
      
      if (notification.type === 'task_assigned' && data.task_id) {
        // توجيه إلى صفحة المهام مع تحديد المهمة
        if (onNavigate) onNavigate('tasks', data.task_id);
      } else if (notification.type === 'mention' && data.room_id) {
        // توجيه إلى الغرفة المحددة
        if (onNavigate) onNavigate('room', data.room_id, data.message_id);
      }
    }
    
    setIsOpen(false);
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'task_assigned':
        return <HiClipboardList className="text-blue-500" size={16} />;
      case 'mention':
        return <HiMail className="text-purple-500" size={16} />;
      default:
        return <HiBell className="text-gray-500" size={16} />;
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  const theme = {
    bg: darkMode ? 'bg-gray-800' : 'bg-white',
    text: darkMode ? 'text-white' : 'text-gray-900',
    textSecondary: darkMode ? 'text-gray-400' : 'text-gray-500',
    border: darkMode ? 'border-gray-700' : 'border-gray-200',
    hover: darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100',
    unreadBg: darkMode ? 'bg-blue-900/20' : 'bg-blue-50'
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-xl transition ${theme.hover}`}
      >
        <HiBell size={22} className={theme.text} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className={`absolute right-0 mt-2 w-80 ${theme.bg} rounded-xl shadow-xl border ${theme.border} z-50 overflow-hidden`}>
          {/* Header */}
          <div className={`flex justify-between items-center px-4 py-3 border-b ${theme.border}`}>
            <h3 className={`font-semibold ${theme.text}`}>Notifications</h3>
            <div className="flex gap-2">
              {notifications.length > 0 && (
                <button
                  onClick={markAllAsRead}
                  className={`text-xs ${theme.textSecondary} hover:text-blue-500 transition`}
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className={`p-1 rounded ${theme.hover}`}
              >
                <HiX size={14} className={theme.textSecondary} />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className={`px-4 py-8 text-center ${theme.textSecondary} text-sm`}>
                No notifications yet
              </div>
            ) : (
              notifications.map(notif => (
                <div
                  key={notif.id}
                  className={`px-4 py-3 border-b ${theme.border} transition-all duration-200 ${
                    !notif.is_read ? theme.unreadBg : ''
                  } ${theme.hover} cursor-pointer group`}
                >
                  <div className="flex gap-3">
                    {/* Icon */}
                    <div className="flex-shrink-0 mt-0.5">
                      {getNotificationIcon(notif.type)}
                    </div>
                    
                    {/* Content - Clickable */}
                    <div 
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => handleNotificationClick(notif)}
                    >
                      <p className={`text-sm font-medium ${theme.text}`}>
                        {notif.title}
                      </p>
                      <p className={`text-xs ${theme.textSecondary} mt-0.5`}>
                        {notif.message}
                      </p>
                      <p className={`text-[10px] ${theme.textSecondary} mt-1`}>
                        {formatTime(notif.created_at)}
                      </p>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!notif.is_read && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notif.id);
                          }}
                          className="p-1 rounded hover:bg-green-500/20 transition"
                          title="Mark as read"
                        >
                          <HiCheck size={14} className="text-green-500" />
                        </button>
                      )}
                      <button
                        onClick={(e) => deleteNotification(notif.id, e)}
                        className="p-1 rounded hover:bg-red-500/20 transition"
                        title="Delete"
                      >
                        <HiTrash size={14} className="text-red-500" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;