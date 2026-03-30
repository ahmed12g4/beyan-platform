/**
 * Beyan Academy v2 - Core Types
 * Defined according to the new 3-tier learning model.
 */

// --- Shared Types ---
export type SessionStatus = 'SCHEDULED' | 'LIVE' | 'COMPLETED' | 'CANCELLED';

export interface Teacher {
    id: string;
    full_name: string;
    avatar_url?: string;
}

// --- 1. Private Lessons (الدروس الفردية) ---
export interface PrivatePackage {
    id: string;
    student_id: string;
    total_lessons: number;
    remaining_lessons: number;
    teacher: Teacher;
    status: 'ACTIVE' | 'EXPIRED' | 'COMPLETED';
}

export interface PrivateSession {
    id: string;
    package_id: string;
    scheduled_at: Date;
    duration_minutes: number; // Fixed at 50 for v2
    status: SessionStatus;
    meeting_link?: string;
    teacher: Teacher;
}

// --- 2. Groups (الجروبات) ---
export interface Group {
    id: string;
    title: string;
    teacher: Teacher;
    start_date: Date;
    end_date: Date;
    days_of_week: number[]; // 0-6 (Sunday-Saturday)
    session_time: string; // HH:mm
    session_duration: number;
    total_seats: number;
    available_seats: number;
    price: number;
    status: 'UPCOMING' | 'ONGOING' | 'FINISHED';
}

export interface GroupSession {
    id: string;
    group_id: string;
    title: string;
    scheduled_at: Date;
    duration_minutes: number;
    status: SessionStatus;
    meeting_link?: string;
}

// --- 3. Recorded Courses (الدورات المسجلة) ---
export interface RecordedCourse {
    id: string;
    title: string;
    description: string;
    thumbnail_url?: string;
    teacher: Teacher;
    total_lessons: number;
    completed_lessons: number;
    progress_percentage: number;
    price: number;
    status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
}

export interface Certificate {
    id: string;
    course_id: string;
    course_title: string;
    earned_at: Date;
    certificate_url: string;
}
