'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: React.ReactNode;
    confirmText?: string;
    cancelText?: string;
    isLoading?: boolean;
}

export default function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Evet, Onayla',
    cancelText = 'İptal',
    isLoading = false
}: ConfirmModalProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!isOpen || !mounted) return null;

    const modalContent = (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-gray-900/60 transition-opacity animate-fadeIn"
                onClick={() => !isLoading && onClose()}
            />
            <div className="relative bg-white shadow-md p-8 w-full max-w-sm rounded-lg text-center animate-gentle-rise">
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i className="fas fa-exclamation-triangle text-2xl text-red-500"></i>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 mb-8">{message}</p>
                <div className="flex gap-4">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="flex-1 py-3 bg-gray-100 text-gray-500 text-[11px] font-black uppercase tracking-widest rounded-lg hover:bg-gray-200 transition-all active:scale-95 disabled:opacity-50"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className="flex-1 py-3 bg-red-500 text-white text-[11px] font-black uppercase tracking-widest rounded-lg hover:bg-red-600 shadow-md shadow-red-500/20 active:scale-95 disabled:opacity-50 transition-all"
                    >
                        {isLoading ? <i className="fas fa-spinner fa-spin"></i> : confirmText}
                    </button>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}
