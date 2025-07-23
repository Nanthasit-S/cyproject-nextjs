// fixcy/lib/NotificationContext.tsx
import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

type NotificationType = 'success' | 'error' | 'info';

interface NotificationState {
  isOpen: boolean;
  message: string;
  title: string;
  type: NotificationType;
}

interface NotificationContextType extends NotificationState {
  showNotification: (title: string, message: string, type?: NotificationType) => void;
  hideNotification: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notification, setNotification] = useState<NotificationState>({
    isOpen: false,
    message: '',
    title: '',
    type: 'info',
  });

  const hideNotification = useCallback(() => {
    setNotification((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const showNotification = useCallback((title: string, message: string, type: NotificationType = 'info') => {
    setNotification({ isOpen: true, title, message, type });
  }, []);

  return (
    <NotificationContext.Provider value={{ ...notification, showNotification, hideNotification }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};