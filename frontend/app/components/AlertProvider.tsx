"use client";

import { createContext, useContext, useState, useCallback } from "react";
import { clsx } from "clsx";
import { X, CheckCircle, AlertCircle, Info } from "lucide-react";

interface Alert {
  id: string;
  type: "success" | "error" | "info";
  title: string;
  message?: string;
}

interface AlertContextValue {
  alerts: Alert[];
  addAlert: (alert: Omit<Alert, "id">) => void;
  removeAlert: (id: string) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

const AlertContext = createContext<AlertContextValue | undefined>(undefined);

export function useAlert() {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error("useAlert must be used within an AlertProvider");
  }
  return context;
}

interface AlertProviderProps {
  children: React.ReactNode;
}

export function AlertProvider({ children }: AlertProviderProps) {
  const [alerts, setAlerts] = useState<Alert[]>([]);

  const addAlert = useCallback((alert: Omit<Alert, "id">) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newAlert = { ...alert, id };
    setAlerts(prev => [...prev, newAlert]);

    // Auto remove after 5 seconds
    setTimeout(() => {
      setAlerts(prev => prev.filter(a => a.id !== id));
    }, 5000);
  }, []);

  const removeAlert = useCallback((id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  }, []);

  const success = useCallback((title: string, message?: string) => {
    addAlert({ type: "success", title, message });
  }, [addAlert]);

  const error = useCallback((title: string, message?: string) => {
    addAlert({ type: "error", title, message });
  }, [addAlert]);

  const info = useCallback((title: string, message?: string) => {
    addAlert({ type: "info", title, message });
  }, [addAlert]);

  const value = {
    alerts,
    addAlert,
    removeAlert,
    success,
    error,
    info,
  };

  return (
    <AlertContext.Provider value={value}>
      {children}
      <AlertContainer />
    </AlertContext.Provider>
  );
}

function AlertContainer() {
  const { alerts, removeAlert } = useAlert();

  if (alerts.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {alerts.map((alert) => (
        <AlertItem key={alert.id} alert={alert} onRemove={removeAlert} />
      ))}
    </div>
  );
}

interface AlertItemProps {
  alert: Alert;
  onRemove: (id: string) => void;
}

function AlertItem({ alert, onRemove }: AlertItemProps) {
  const { type, title, message } = alert;

  const getIcon = () => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "error":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case "info":
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getStyles = () => {
    switch (type) {
      case "success":
        return "bg-green-50 border-green-200";
      case "error":
        return "bg-red-50 border-red-200";
      case "info":
        return "bg-blue-50 border-blue-200";
    }
  };

  return (
    <div className={clsx(
      "max-w-sm w-full border rounded-lg shadow-lg p-4 animate-fade-in",
      getStyles()
    )}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        <div className="ml-3 flex-1">
          <p className="text-sm font-medium text-gray-900">{title}</p>
          {message && (
            <p className="mt-1 text-sm text-gray-600">{message}</p>
          )}
        </div>
        <div className="ml-4 flex-shrink-0">
          <button
            className="inline-flex text-gray-400 hover:text-gray-600"
            onClick={() => onRemove(alert.id)}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
