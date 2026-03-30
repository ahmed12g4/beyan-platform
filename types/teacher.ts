// Teacher Dashboard TypeScript Interfaces
// Created: 2026-02-07
// Purpose: Define all data structures for Teacher interface

// ============================================
// USER & TEACHER
// ============================================

export interface Teacher {
    id: string
    name: string
    email: string
    phone?: string
    bio?: string
    avatar?: string | null
    createdAt: Date
    updatedAt: Date
}

// ============================================
// COURSE & LESSON
// ============================================

export interface Course {
    id: string
    title: string
    description: string
    level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' | 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
    type: 'SPEAKING' | 'GRAMMAR' | 'QURAN' | 'VOCABULARY' | 'OTHER'
    schedule?: string // e.g., "Pazartesi, Çarşamba 14:00"
    duration: number // minutes
    totalStudents: number
    activeStudents: number
    totalSessions: number
    completedSessions: number
    color?: string // for calendar display
    createdAt: Date
    updatedAt: Date
}

export interface Lesson {
    id: string
    courseId: string
    course?: Course
    title: string
    description?: string
    scheduledAt: Date
    duration: number // minutes
    status: 'SCHEDULED' | 'LIVE' | 'COMPLETED' | 'CANCELLED'
    attendanceCount?: number
    totalStudents?: number
    meetingLink?: string
    createdAt: Date
    updatedAt: Date
}

// ============================================
// STUDENT & ENROLLMENT
// ============================================

export interface Student {
    id: string
    name: string
    email: string
    phone?: string
    avatar?: string | null
    enrolledCourses: number
    completedLessons: number
    totalLessons: number
    overallProgress: number // 0-100
    joinedAt: Date
}

export interface StudentWithProgress extends Student {
    courseId: string
    courseName: string
    courseProgress: number // 0-100
    lessonsAttended: number
    lessonsTotal: number
    lastAttendance?: Date
}

export interface Enrollment {
    id: string
    studentId: string
    student?: Student
    courseId: string
    course?: Course
    enrolledAt: Date
    completedLessons: number
    totalLessons: number
    progress: number // 0-100
    status: 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'DROPPED'
}

// ============================================
// CONTENT & FILES
// ============================================

export interface ContentFile {
    id: string
    courseId: string
    name: string
    type: 'PDF' | 'VIDEO' | 'AUDIO' | 'PPT' | 'DOCUMENT' | 'OTHER'
    fileType: string // e.g., 'application/pdf'
    url: string
    size: number // bytes
    uploadedBy: string // teacher id
    uploadedAt: Date
    views: number
    downloads: number
}

// ============================================
// CALENDAR & SCHEDULE
// ============================================

export interface CalendarEvent {
    id: string
    lessonId?: string
    title: string
    type: 'LESSON' | 'MEETING' | 'EXAM' | 'HOLIDAY' | 'OTHER'
    date: Date
    startTime: string // e.g., "14:00"
    endTime: string // e.g., "14:45"
    duration: number // minutes
    studentCount?: number
    color?: string
    description?: string
}

export interface DaySchedule {
    date: Date
    dayName: string
    dayNumber: number
    events: CalendarEvent[]
    totalEvents: number
}

// ============================================
// DASHBOARD STATS
// ============================================

export interface DashboardStats {
    totalStudents: number
    activeCourses: number
    upcomingLessons: number
    completedThisMonth: number
    newStudentsThisMonth?: number
}

// ============================================
// NOTIFICATIONS
// ============================================

export interface Notification {
    id: string
    type: 'NEW_STUDENT' | 'LESSON_REMINDER' | 'MESSAGE' | 'SYSTEM' | 'OTHER'
    title: string
    message: string
    read: boolean
    link?: string
    createdAt: Date
}

// ============================================
// UI STATE TYPES
// ============================================

export type ViewMode = 'grid' | 'list'
export type TabType = 'my-courses' | 'live-lessons'
export type CourseTabType = 'overview' | 'students' | 'content'

export interface PageState {
    isLoading: boolean
    error: string | null
    isEmpty: boolean
}

// ============================================
// API RESPONSE WRAPPERS
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

// ============================================
// FILTER & SEARCH
// ============================================

export interface StudentFilter {
    courseId?: string
    search?: string
    minProgress?: number
    maxProgress?: number
    status?: 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'DROPPED'
}

export interface LessonFilter {
    courseId?: string
    status?: 'SCHEDULED' | 'LIVE' | 'COMPLETED' | 'CANCELLED'
    startDate?: Date
    endDate?: Date
}

// ============================================
// FORM DATA
// ============================================

export interface SettingsFormData {
    name: string
    email: string
    phone: string
    bio: string
    avatar?: File | null
    notifications: {
        email: boolean
        sms: boolean
        push: boolean
    }
}
