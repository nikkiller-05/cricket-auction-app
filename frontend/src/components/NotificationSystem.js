import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';

// Add CSS animations for notifications
const notificationStyles = `
  @keyframes slideInRight {
    from {
      transform: translateX(100%) scale(0.8);
      opacity: 0;
    }
    to {
      transform: translateX(0) scale(1);
      opacity: 1;
    }
  }
  
  @keyframes slideOutRight {
    from {
      transform: translateX(0) scale(1);
      opacity: 1;
    }
    to {
      transform: translateX(100%) scale(0.8);
      opacity: 0;
    }
  }
  
  @keyframes pulseBrief {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.02); }
  }
  
  .animate-slide-in {
    animation: slideInRight 0.4s ease-out forwards;
  }
  
  .animate-slide-out {
    animation: slideOutRight 0.3s ease-in forwards;
  }
  
  .animate-pulse-once {
    animation: pulseBrief 0.6s ease-in-out;
  }
`;

// Inject styles once
if (typeof document !== 'undefined' && !document.getElementById('notification-styles')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'notification-styles';
  styleSheet.textContent = notificationStyles;
  document.head.appendChild(styleSheet);
}

// Notification Context
const NotificationContext = createContext();

// Notification Hook
export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
};

// Notification Types
const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
  CONFIRM: 'confirm'
};

// Individual Notification Component
const Notification = ({ notification, onRemove, onConfirm, onCancel }) => {
  const { id, type, title, message, duration, showConfirm } = notification;
  const [isExiting, setIsExiting] = useState(false);

  const handleRemove = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      onRemove(id);
    }, 300); // Match animation duration
  }, [onRemove, id]);

  useEffect(() => {
    if (!showConfirm && duration && duration > 0) {
      const timer = setTimeout(() => {
        handleRemove();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [id, duration, onRemove, showConfirm, handleRemove]);

  const getIcon = () => {
    switch (type) {
      case NOTIFICATION_TYPES.SUCCESS:
        return '✅';
      case NOTIFICATION_TYPES.ERROR:
        return '❌';
      case NOTIFICATION_TYPES.WARNING:
        return '⚠️';
      case NOTIFICATION_TYPES.INFO:
        return 'ℹ️';
      case NOTIFICATION_TYPES.CONFIRM:
        return '❓';
      default:
        return 'ℹ️';
    }
  };

  const getStyles = () => {
    const baseStyles = 'backdrop-blur-xl border-2 shadow-2xl rounded-xl ring-2 ring-opacity-50';
    
    switch (type) {
      case NOTIFICATION_TYPES.SUCCESS:
        return `${baseStyles} bg-green-600 bg-opacity-95 border-green-400 text-white ring-green-300 shadow-green-500/30`;
      case NOTIFICATION_TYPES.ERROR:
        return `${baseStyles} bg-red-600 bg-opacity-95 border-red-400 text-white ring-red-300 shadow-red-500/30`;
      case NOTIFICATION_TYPES.WARNING:
        return `${baseStyles} bg-yellow-600 bg-opacity-95 border-yellow-400 text-white ring-yellow-300 shadow-yellow-500/30`;
      case NOTIFICATION_TYPES.INFO:
        return `${baseStyles} bg-blue-600 bg-opacity-95 border-blue-400 text-white ring-blue-300 shadow-blue-500/30`;
      case NOTIFICATION_TYPES.CONFIRM:
        return `${baseStyles} bg-purple-600 bg-opacity-95 border-purple-400 text-white ring-purple-300 shadow-purple-500/30`;
      default:
        return `${baseStyles} bg-gray-600 bg-opacity-95 border-gray-400 text-white ring-gray-300 shadow-gray-500/30`;
    }
  };

  return (
    <div className={`p-3 ${getStyles()} transform transition-all duration-500 ease-out ${isExiting ? 'animate-slide-out' : 'animate-slide-in animate-pulse-once'}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-2 flex-1">
          <span className="text-lg flex-shrink-0 drop-shadow-lg">{getIcon()}</span>
          <div className="flex-1 min-w-0">
            {title && (
              <h4 className="font-bold text-sm mb-1 break-words drop-shadow-sm">{title}</h4>
            )}
            <p className="text-xs font-medium whitespace-pre-line break-words drop-shadow-sm">{message}</p>
          </div>
        </div>
        
        {!showConfirm && (
          <button
            onClick={handleRemove}
            className="ml-2 text-white hover:text-gray-200 transition-all duration-200 flex-shrink-0 p-1 rounded-full hover:bg-white hover:bg-opacity-20 text-sm font-bold"
            aria-label="Close notification"
          >
            ✕
          </button>
        )}
      </div>
      
      {showConfirm && (
        <div className="mt-3 flex space-x-2 justify-end">
          <button
            onClick={() => {
              setIsExiting(true);
              setTimeout(() => onCancel(id), 300);
            }}
            className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-all font-semibold text-xs shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              setIsExiting(true);
              setTimeout(() => onConfirm(id), 300);
            }}
            className="px-3 py-1.5 bg-white bg-opacity-90 hover:bg-opacity-100 text-gray-800 rounded-lg transition-all font-semibold text-xs shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            Confirm
          </button>
        </div>
      )}
    </div>
  );
};

// Notification Container
const NotificationContainer = ({ notifications, removeNotification, confirmNotification, cancelNotification }) => {
  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-16 left-4 right-4 sm:left-auto sm:right-4 z-[9999] w-auto sm:max-w-sm space-y-2">
      {notifications.map((notification, index) => (
        <div
          key={notification.id}
          className="transform transition-all duration-300 ease-in-out"
          style={{
            transform: `translateY(${index * 2}px)`,
            zIndex: 9999 - index
          }}
        >
          <Notification
            notification={notification}
            onRemove={removeNotification}
            onConfirm={confirmNotification}
            onCancel={cancelNotification}
          />
        </div>
      ))}
    </div>
  );
};

// Notification Provider Component
export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [confirmCallbacks, setConfirmCallbacks] = useState({});

  const addNotification = (type, message, title = null, options = {}) => {
    const id = Date.now() + Math.random();
    const notification = {
      id,
      type,
      title,
      message,
      duration: options.duration !== undefined ? options.duration : (type === NOTIFICATION_TYPES.ERROR ? 5000 : 3000),
      showConfirm: false,
      ...options
    };

    setNotifications(prev => [...prev, notification]);
    return id;
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    // Clean up confirm callbacks
    setConfirmCallbacks(prev => {
      const newCallbacks = { ...prev };
      delete newCallbacks[id];
      return newCallbacks;
    });
  };

  const confirmNotification = (id) => {
    const callback = confirmCallbacks[id];
    if (callback && callback.onConfirm) {
      callback.onConfirm();
    }
    removeNotification(id);
  };

  const cancelNotification = (id) => {
    const callback = confirmCallbacks[id];
    if (callback && callback.onCancel) {
      callback.onCancel();
    }
    removeNotification(id);
  };

  // Modern replacements for alert, confirm, etc.
  const showSuccess = (message, title = 'Success', options = {}) => {
    return addNotification(NOTIFICATION_TYPES.SUCCESS, message, title, options);
  };

  const showError = (message, title = 'Error', options = {}) => {
    return addNotification(NOTIFICATION_TYPES.ERROR, message, title, options);
  };

  const showWarning = (message, title = 'Warning', options = {}) => {
    return addNotification(NOTIFICATION_TYPES.WARNING, message, title, options);
  };

  const showInfo = (message, title = 'Information', options = {}) => {
    return addNotification(NOTIFICATION_TYPES.INFO, message, title, options);
  };

  const showConfirm = (message, title = 'Confirm Action', onConfirm, onCancel) => {
    const id = Date.now() + Math.random();
    
    // Store callbacks
    setConfirmCallbacks(prev => ({
      ...prev,
      [id]: { onConfirm, onCancel }
    }));

    const notification = {
      id,
      type: NOTIFICATION_TYPES.CONFIRM,
      title,
      message,
      duration: 0, // No auto-remove for confirmations
      showConfirm: true
    };

    setNotifications(prev => [...prev, notification]);
    return id;
  };

  // Convenience methods that match old alert/confirm patterns
  const alert = (message, title = 'Alert') => {
    return showInfo(message, title);
  };

  const confirm = (message, title = 'Confirm') => {
    return new Promise((resolve) => {
      showConfirm(
        message, 
        title, 
        () => resolve(true), 
        () => resolve(false)
      );
    });
  };

  const contextValue = {
    // New modern methods
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showConfirm,
    removeNotification,
    
    // Legacy compatibility methods
    alert,
    confirm,
    
    // Direct notification management
    notifications
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      <NotificationContainer
        notifications={notifications}
        removeNotification={removeNotification}
        confirmNotification={confirmNotification}
        cancelNotification={cancelNotification}
      />
    </NotificationContext.Provider>
  );
};

export default NotificationProvider;