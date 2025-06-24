import React, { createContext, useContext, useState } from 'react';

const NotificationContext = createContext();

export const useNotification = () => useContext(NotificationContext);

const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const addNotification = (type, message) => {
    setNotifications((prev) => [
      ...prev,
      { id: Date.now() + Math.random(), type, message },
    ]);
    setUnreadCount((prev) => prev + 1);
  };

  const removeNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const markAllAsRead = () => {
    setUnreadCount(0);
  };

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification, unreadCount, markAllAsRead }}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationProvider; 