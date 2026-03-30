// Student Interface TypeScript Definitions
// Created: 2026-02-07
// Purpose: Define all data structures for Student interface

// ============================================
// STUDENT & PROFILE
// ============================================

export interface StudentProfile {
    id: string
    name: string
    email: string
    phone?: string
    avatar?: string | null
    memberSince: Date
    subscriptionStatus: 'FREE' | 'PREMIUM' | 'TRIAL'
    subscriptionExpiresAt?: Date
}

// ============================================
// COURSE (Student View)
// ============================================

export interface Course {
    id: string
    title: string
    description: string
    level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' | 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
    type: 'GENERAL' | 'CONVERSATION' | 'BUSINESS'
    instructor: string
    instructorAvatar?: string
    duration: number // total hours
    lessonsCount: number
    studentsCount: number
    rating: number // 0-5
    reviewsCount: number
    price: number // 0 for free courses
    thumbnail?: string
    color?: string
    isPurchased: boolean
    isSubscriptionOnly: boolean
    createdAt: Date
}

// ============================================
// ENROLLED COURSE (with progress)
// ============================================

export interface EnrolledCourse extends Course {
    enrolledAt: Date
    progress: number // 0-100
    completedLessons: number
    totalLessons: number
    lastAccessedAt?: Date
    nextLessonId?: string
    nextLessonTitle?: string
    certificateEarned: boolean
}

// ============================================
// LESSON (Student View)
// ============================================

export interface Lesson {
    id: string
    courseId: string
    title: string
    description?: string
    duration: number // minutes
    order: number
    type: 'VIDEO' | 'LIVE' | 'QUIZ' | 'READING' | 'ASSIGNMENT'
    isLocked: boolean
    isCompleted: boolean
    videoUrl?: string
    liveSessionAt?: Date
    resources?: LessonResource[]
}

export interface LessonResource {
    id: string
    name: string
    type: 'PDF' | 'VIDEO' | 'AUDIO' | 'LINK'
    url: string
    size?: number
}

// ============================================
// PROGRESS & ACHIEVEMENTS
// ============================================

export interface LearningStats {
    totalCoursesEnrolled: number
    coursesCompleted: number
    totalHoursLearned: number
    currentStreak: number // days
    certificatesEarned: number
}

export interface Achievement {
    id: string
    title: string
    description: string
    icon: string
    earnedAt?: Date
    isUnlocked: boolean
}

// ============================================
// SUBSCRIPTION & BILLING
// ============================================

export interface Subscription {
    id: string
    plan: 'FREE' | 'MONTHLY' | 'YEARLY'
    status: 'ACTIVE' | 'CANCELLED' | 'EXPIRED' | 'TRIAL'
    startedAt: Date
    expiresAt?: Date
    autoRenew: boolean
    price: number
    currency: string
}

export interface PaymentHistory {
    id: string
    date: Date
    amount: number
    currency: string
    description: string
    status: 'PAID' | 'PENDING' | 'FAILED' | 'REFUNDED'
    invoiceUrl?: string
}

// ============================================
// LIVE SESSIONS
// ============================================

export interface LiveSession {
    id: string
    courseId: string
    courseName: string
    title: string
    instructor: string
    scheduledAt: Date
    duration: number // minutes
    status: 'UPCOMING' | 'LIVE' | 'ENDED'
    meetingLink?: string
    participantsCount?: number
    maxParticipants?: number
    isEnrolled: boolean
}

// ============================================
// NOTIFICATIONS
// ============================================

export interface Notification {
    id: string
    type: 'COURSE_UPDATE' | 'LIVE_SESSION' | 'ACHIEVEMENT' | 'SUBSCRIPTION' | 'SYSTEM'
    title: string
    message: string
    read: boolean
    link?: string
    createdAt: Date
}

// ============================================
// COURSE FILTERS & SEARCH
// ============================================

export interface CourseFilter {
    search?: string
    level?: string[]
    type?: string[]
    priceRange?: 'FREE' | 'PAID' | 'ALL'
    rating?: number // minimum rating
    sortBy?: 'POPULAR' | 'NEWEST' | 'RATING' | 'PRICE_LOW' | 'PRICE_HIGH'
}

// ============================================
// UI STATE
// ============================================

export interface PageState {
    isLoading: boolean
    error: string | null
    isEmpty: boolean
}

export type CourseAccessState = 'FULL_ACCESS' | 'LOCKED' | 'PREVIEW_ONLY'
export type TabType = 'overview' | 'lessons' | 'resources' | 'reviews'

// ============================================
// API RESPONSES
// ============================================

export interface ApiResponse<T> {
    success: boolean
    data?: T
    error?: string
    message?: string
}

export interface PaginatedResponse<T> {
    data: T[]
    total: number
    page: number
    pageSize: number
    totalPages: number
}
