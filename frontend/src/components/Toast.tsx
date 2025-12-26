'use client';

import { useEffect } from 'react';
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastProps {
  toast: Toast;
  onClose: (id: string) => void;
}

export function ToastItem({ toast, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(toast.id);
    }, 5000); // Auto-close after 5 seconds

    return () => clearTimeout(timer);
  }, [toast.id, onClose]);

  const typeStyles = {
    success: 'border-green-200 text-green-700',
    error: 'border-red-200 text-red-700',
    info: 'border-blue-200 text-blue-700',
    warning: 'border-yellow-200 text-yellow-700',
  };

  const icons = {
    success: <CheckCircle2 className="h-5 w-5" />,
    error: <XCircle className="h-5 w-5" />,
    info: <Info className="h-5 w-5" />,
    warning: <AlertTriangle className="h-5 w-5" />,
  };

  return (
    <div
      className={`flex items-start gap-3 rounded-lg border bg-white p-4 shadow-lg min-w-[300px] max-w-md animate-in slide-in-from-top-5 ${typeStyles[toast.type]}`}
    >
      <div>{icons[toast.type]}</div>
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-900">{toast.message}</p>
      </div>
      <button
        onClick={() => onClose(toast.id)}
        className="text-gray-400 hover:text-gray-600 transition-colors"
        aria-label="Close"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

interface ToastContainerProps {
  toasts: Toast[];
  onClose: (id: string) => void;
}

export function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={onClose} />
      ))}
    </div>
  );
}
