import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
    id: string;
    type: ToastType;
    message: string;
    description?: string;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType, description?: string) => void;
    success: (message: string, description?: string) => void;
    error: (message: string, description?: string) => void;
    info: (message: string, description?: string) => void;
    warning: (message: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

export const ToastProvider = ({ children }: { children: ReactNode }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    const showToast = useCallback((message: string, type: ToastType = 'info', description?: string) => {
        const id = Date.now().toString() + Math.random();
        setToasts((prev) => [...prev, { id, type, message, description }]);

        // Auto remove after 5 seconds
        setTimeout(() => {
            removeToast(id);
        }, 5000);
    }, [removeToast]);

    const success = (message: string, description?: string) => showToast(message, 'success', description);
    const error = (message: string, description?: string) => showToast(message, 'error', description);
    const info = (message: string, description?: string) => showToast(message, 'info', description);
    const warning = (message: string, description?: string) => showToast(message, 'warning', description);

    return (
        <ToastContext.Provider value={{ showToast, success, error, info, warning }}>
            {children}
            <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none">
                {toasts.map((toast) => (
                    <ToastItem key={toast.id} toast={toast} onRemove={() => removeToast(toast.id)} />
                ))}
            </div>
        </ToastContext.Provider>
    );
};

const ToastItem = ({ toast, onRemove }: { toast: Toast; onRemove: () => void }) => {
    const icons = {
        success: <CheckCircle className="text-black" size={20} />,
        error: <XCircle className="text-white" size={20} />,
        info: <Info className="text-blue-500" size={20} />,
        warning: <AlertCircle className="text-yellow-500" size={20} />
    };

    const bgColors = {
        success: 'bg-[#D4F932]',
        error: 'bg-red-500',
        info: 'bg-zinc-900 border-zinc-700',
        warning: 'bg-yellow-500/10 border-yellow-500/50'
    };

    // Custom premium styling
    // Success: The brand yellow/green color.
    // Error: Red but elegant.

    return (
        <div className={`
            pointer-events-auto
            min-w-[320px] max-w-sm
            rounded-xl shadow-2xl
            flex items-start gap-3 p-4
            transform transition-all duration-500 ease-out
            animate-slide-in
            backdrop-blur-md
            ${toast.type === 'success' ? 'bg-[#D4F932] text-black' : ''}
            ${toast.type === 'error' ? 'bg-red-600 text-white' : ''}
            ${toast.type === 'info' ? 'bg-[#111] border border-zinc-800 text-white' : ''}
            ${toast.type === 'warning' ? 'bg-yellow-500 text-black' : ''}
        `}>
            <div className="mt-0.5">
                {toast.type === 'success' && <CheckCircle size={20} />}
                {toast.type === 'error' && <XCircle size={20} />}
                {toast.type === 'info' && <Info size={20} className="text-[#D4F932]" />}
                {toast.type === 'warning' && <AlertCircle size={20} />}
            </div>
            <div className="flex-1">
                <h4 className="font-bold text-sm">{toast.message}</h4>
                {toast.description && (
                    <p className={`text-xs mt-1 ${toast.type === 'success' || toast.type === 'warning' ? 'text-black/70' : 'text-zinc-400'}`}>
                        {toast.description}
                    </p>
                )}
            </div>
            <button
                onClick={onRemove}
                className={`p-1 rounded-full hover:bg-black/10 transition-colors ${toast.type === 'info' ? 'hover:bg-white/10' : ''}`}
            >
                <X size={16} />
            </button>

            <style>{`
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                .animate-slide-in {
                    animation: slideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                }
            `}</style>
        </div>
    );
};
