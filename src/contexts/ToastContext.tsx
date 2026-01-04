'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
    id: string;
    message: React.ReactNode;
    type: ToastType;
}

interface ToastContextValue {
    showToast: (message: React.ReactNode, type?: ToastType) => void;
    toast: {
        success: (message: React.ReactNode) => void;
        error: (message: React.ReactNode) => void;
        info: (message: React.ReactNode) => void;
        warning: (message: React.ReactNode) => void;
    };
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const showToast = useCallback((message: React.ReactNode, type: ToastType = 'info') => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts((prev) => [...prev, { id, message, type }]);

        setTimeout(() => {
            removeToast(id);
        }, 4000);
    }, [removeToast]);

    const toast = {
        success: (msg: React.ReactNode) => showToast(msg, 'success'),
        error: (msg: React.ReactNode) => showToast(msg, 'error'),
        info: (msg: React.ReactNode) => showToast(msg, 'info'),
        warning: (msg: React.ReactNode) => showToast(msg, 'warning'),
    };

    return (
        <ToastContext.Provider value={{ showToast, toast }}>
            {children}
            <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none p-4 md:p-0 w-full md:w-auto">
                <AnimatePresence>
                    {toasts.map((t) => (
                        <ToastItem key={t.id} toast={t} onDismiss={() => removeToast(t.id)} />
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
    const bgColors = {
        success: 'bg-emerald-50 border-emerald-100',
        error: 'bg-red-50 border-red-100',
        info: 'bg-blue-50 border-blue-100',
        warning: 'bg-amber-50 border-amber-100',
    };

    const icons = {
        success: <CheckCircle className="w-5 h-5 text-emerald-600" />,
        error: <AlertCircle className="w-5 h-5 text-red-600" />,
        info: <Info className="w-5 h-5 text-blue-600" />,
        warning: <AlertTriangle className="w-5 h-5 text-amber-600" />,
    };

    const textColors = {
        success: 'text-emerald-800',
        error: 'text-red-800',
        info: 'text-blue-800',
        warning: 'text-amber-800',
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            layout
            className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg backdrop-blur-md min-w-[300px] max-w-md ${bgColors[toast.type]}`}
        >
            <div className="flex-shrink-0">{icons[toast.type]}</div>
            <div className={`flex-1 text-sm font-medium ${textColors[toast.type]}`}>
                {toast.message}
            </div>
            <button
                onClick={onDismiss}
                className={`p-1 rounded-full hover:bg-black/5 transition-colors ${textColors[toast.type]}`}
            >
                <X className="w-4 h-4" />
            </button>
        </motion.div>
    );
}
