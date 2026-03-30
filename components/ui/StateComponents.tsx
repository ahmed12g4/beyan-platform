// UI State Components
// Empty States, Loading States, Error States

import React from 'react'
import Link from 'next/link'

// ============================================
// EMPTY STATE COMPONENT
// ============================================

interface EmptyStateProps {
    icon?: React.ReactNode
    title: string
    description: string
    actionLabel?: string
    onAction?: () => void
    actionHref?: string
}

export function EmptyState({ icon, title, description, actionLabel, onAction, actionHref }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            {icon && (
                <div className="mb-4 text-gray-400">
                    {icon}
                </div>
            )}
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
            <p className="text-base text-gray-600 mb-6 max-w-md">{description}</p>
            {actionLabel && (
                actionHref ? (
                    <Link
                        href={actionHref}
                        className="px-6 py-3 bg-brand-primary text-white rounded-lg font-medium hover:bg-brand-primary-dark transition-colors shadow-sm"
                    >
                        {actionLabel}
                    </Link>
                ) : onAction ? (
                    <button
                        onClick={onAction}
                        className="px-6 py-3 bg-brand-primary text-white rounded-lg font-medium hover:bg-brand-primary-dark transition-colors shadow-sm"
                    >
                        {actionLabel}
                    </button>
                ) : null
            )}
        </div>
    )
}

// ============================================
// LOADING SKELETON COMPONENTS
// ============================================

export function CardSkeleton() {
    return (
        <div className="bg-white rounded-lg border-2 border-gray-200 p-6 sm:p-8 animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
    )
}

export function StudentCardSkeleton() {
    return (
        <div className="bg-white rounded-lg border-2 border-gray-200 p-6 animate-pulse">
            <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-full bg-gray-200 flex-shrink-0"></div>
                <div className="flex-1">
                    <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                    <div className="flex gap-3 mb-4">
                        <div className="h-4 bg-gray-200 rounded w-20"></div>
                        <div className="h-4 bg-gray-200 rounded w-20"></div>
                    </div>
                    <div className="h-10 bg-gray-200 rounded"></div>
                </div>
            </div>
        </div>
    )
}

export function LessonCardSkeleton() {
    return (
        <div className="bg-white rounded-lg border-2 border-gray-200 p-5 animate-pulse">
            <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gray-200 rounded flex-shrink-0"></div>
                <div className="flex-1">
                    <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="h-10 w-24 bg-gray-200 rounded"></div>
            </div>
        </div>
    )
}

export function StatCardSkeleton() {
    return (
        <div className="bg-white rounded-lg border-2 border-gray-200 p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        </div>
    )
}

// ============================================
// LOADING PAGE COMPONENT
// ============================================

interface LoadingPageProps {
    message?: string
}

export function LoadingPage({ message = 'Yükleniyor...' }: LoadingPageProps) {
    return (
        <div className="flex flex-col items-center justify-center py-12 px-4">
            <div className="w-12 h-12 border-4 border-brand-accent border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-900 font-medium">{message}</p>
        </div>
    )
}

// ============================================
// ERROR STATE COMPONENT
// ============================================

interface ErrorStateProps {
    title?: string
    message: string
    actionLabel?: string
    onAction?: () => void
}

export function ErrorState({
    title = 'Bir Hata Oluştu',
    message,
    actionLabel = 'Tekrar Dene',
    onAction
}: ErrorStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="mb-4">
                <svg className="w-16 h-16 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
            <p className="text-base text-gray-600 mb-6 max-w-md">{message}</p>
            {onAction && (
                <button
                    onClick={onAction}
                    className="px-6 py-3 bg-brand-primary text-white rounded-lg font-medium hover:bg-brand-primary-dark transition-colors shadow-sm"
                >
                    {actionLabel}
                </button>
            )}
        </div>
    )
}

// ============================================
// INLINE LOADING SPINNER
// ============================================

export function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
    const sizeClasses = {
        sm: 'w-4 h-4 border-2',
        md: 'w-6 h-6 border-3',
        lg: 'w-8 h-8 border-4'
    }

    return (
        <div className={`${sizeClasses[size]} border-brand-accent border-t-transparent rounded-full animate-spin`}></div>
    )
}

// ============================================
// SAVE FEEDBACK COMPONENT
// ============================================

interface SaveFeedbackProps {
    show: boolean
    type: 'success' | 'error'
    message: string
}

export function SaveFeedback({ show, type, message }: SaveFeedbackProps) {
    if (!show) return null

    const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500'

    return (
        <div className={`fixed bottom-4 right-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fadeIn`}>
            <div className="flex items-center gap-3">
                {type === 'success' ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                )}
                <span className="font-medium">{message}</span>
            </div>
        </div>
    )
}
