// ============================================================================
// ADMIN PANEL TYPES
// ============================================================================

// Dashboard Statistics
export interface DashboardStats {
  totalUsers: number
  totalStudents: number
  totalTeachers: number
  totalCourses: number
  totalEnrollments: number
  pendingComments: number
}

// Course Management
export interface AdminCourse {
  id: string
  title: string
  slug: string
  description: string | null
  thumbnail_url: string | null
  is_published: boolean
  created_at: string
  updated_at: string
  enrolledCount: number
}

// Lesson Management
export interface AdminLesson {
  id: string
  course_id: string
  title: string
  slug: string
  content: string | null
  video_url: string | null
  order_index: number
  is_published: boolean
  created_at: string
  updated_at: string
}

export interface LessonFormData {
  title: string
  slug: string
  content?: string
  video_url?: string
  order_index: number
  is_published: boolean
}

// User Management
export interface AdminUser {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  created_at: string
  roleName: string
  enrollmentCount: number
}

export interface UserEnrollment {
  id: string
  course_id: string
  created_at: string
  course: {
    title: string
    slug: string
  }
}

// Comment Moderation
export interface AdminComment {
  id: string
  content: string
  is_approved: boolean
  created_at: string
  user_id: string
  course_id: string
  user: {
    email: string
    full_name?: string
  }
  course: {
    title: string
    slug: string
  }
}

// Notifications
export interface AdminNotification {
  id: string
  user_id: string
  title: string
  message: string
  is_read: boolean
  created_at: string
  user?: {
    email: string
    full_name?: string
  }
}

export interface NotificationFormData {
  title: string
  message: string
  target: 'user' | 'students' | 'teachers'
  targetUserId?: string
}

// Server Action Response
export interface AdminActionResponse {
  success: boolean
  error?: string
  data?: any
}
