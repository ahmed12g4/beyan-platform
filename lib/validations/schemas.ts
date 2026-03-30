import { z } from 'zod'

// ─── Auth Schemas ───

export const loginSchema = z.object({
    email: z
        .string()
        .min(1, 'E-posta adresi gerekli')
        .email('Geçerli bir e-posta adresi girin'),
    password: z
        .string()
        .min(6, 'Şifre en az 6 karakter olmalı'),
})

export const registerSchema = z.object({
    full_name: z
        .string()
        .min(2, 'Ad en az 2 karakter olmalı')
        .max(100, 'Ad en fazla 100 karakter olabilir'),
    email: z
        .string()
        .min(1, 'E-posta adresi gerekli')
        .email('Geçerli bir e-posta adresi girin'),
    password: z
        .string()
        .min(6, 'Şifre en az 6 karakter olmalı')
        .max(72, 'Şifre en fazla 72 karakter olabilir'),
    confirmPassword: z
        .string()
        .min(1, 'Şifre tekrarı gerekli'),
    role: z
        .enum(['student', 'teacher'] as const, {
            message: 'Geçerli bir rol seçin',
        })
        .default('student'),
    phone: z
        .string()
        .min(1, 'Telefon numarası gerekli')
        .transform((val) => val.replace(/[^0-9]/g, '')) // Remove non-digits (spaces, parens, etc.)
        .pipe(
            z.string()
                .min(7, 'Telefon numarası en az 7 rakam olmalı')
                .max(15, 'Telefon numarası en fazla 15 rakam olabilir')
                .regex(/^(?!.*(\d)\1{5,})/, 'Geçersiz telefon numarası (aşırı tekrar içeremez)')
        ),
    expertise: z.string().max(100).optional(),
    bio: z.string().max(500).optional(),
}).refine((data) => data.password === data.confirmPassword, {
    message: 'Şifreler eşleşmiyor',
    path: ['confirmPassword'],
})

export const forgotPasswordSchema = z.object({
    email: z
        .string()
        .min(1, 'E-posta adresi gerekli')
        .email('Geçerli bir e-posta adresi girin'),
})

export const resetPasswordSchema = z.object({
    password: z
        .string()
        .min(6, 'Şifre en az 6 karakter olmalı')
        .max(72, 'Şifre en fazla 72 karakter olabilir'),
    confirmPassword: z
        .string()
        .min(1, 'Şifre tekrarı gerekli'),
}).refine((data) => data.password === data.confirmPassword, {
    message: 'Şifreler eşleşmiyor',
    path: ['confirmPassword'],
})

export const changePasswordSchema = z.object({
    currentPassword: z
        .string()
        .min(1, 'Mevcut şifre gerekli'),
    newPassword: z
        .string()
        .min(6, 'Yeni şifre en az 6 karakter olmalı')
        .max(72, 'Şifre en fazla 72 karakter olabilir'),
    confirmNewPassword: z
        .string()
        .min(1, 'Şifre tekrarı gerekli'),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'Şifreler eşleşmiyor',
    path: ['confirmNewPassword'],
})

// ─── Profile Schemas ───

export const updateProfileSchema = z.object({
    full_name: z
        .string()
        .min(2, 'Ad en az 2 karakter olmalı')
        .max(100, 'Ad en fazla 100 karakter olabilir'),
    phone: z
        .string()
        .transform((val) => val.replace(/[^0-9]/g, ''))
        .pipe(
            z.string()
                .max(15, 'Telefon numarası en fazla 15 rakam olabilir')
        )
        .optional()
        .or(z.literal('')),
    bio: z
        .string()
        .max(500, 'Biyografi en fazla 500 karakter olabilir')
        .optional()
        .or(z.literal('')),
})

// ─── Course Schemas ───

export const courseSchema = z.object({
    title: z
        .string()
        .min(3, 'Kurs başlığı en az 3 karakter olmalı')
        .max(200, 'Kurs başlığı en fazla 200 karakter olabilir'),
    slug: z
        .string()
        .min(3, 'Slug en az 3 karakter olmalı')
        .max(200, 'Slug en fazla 200 karakter olabilir')
        .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug sadece küçük harf, rakam ve tire içerebilir'),
    description: z
        .string()
        .max(2000, 'Açıklama en fazla 2000 karakter olabilir')
        .optional()
        .or(z.literal('')),
    level: z
        .enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2'])
        .optional()
        .nullable(),
    course_type: z
        .enum(['GENERAL', 'CONVERSATION', 'BUSINESS', 'GRAMMAR', 'QURAN', 'VOCABULARY', 'OTHER']),
    price: z
        .number()
        .min(0, 'Fiyat negatif olamaz'),
    duration_weeks: z
        .number()
        .int()
        .min(1, 'Süre en az 1 hafta olmalı')
        .max(104, 'Süre en fazla 104 hafta olabilir')
        .optional()
        .nullable(),
    schedule: z
        .string()
        .max(200)
        .optional()
        .or(z.literal('')),
    color: z
        .string()
        .regex(/^#[0-9A-Fa-f]{6}$/, 'Geçerli bir hex renk kodu girin'),
    is_published: z.boolean(),
    thumbnail_url: z
        .string()
        .url('Geçerli bir URL girin')
        .optional()
        .nullable()
        .or(z.literal('')),
    max_students: z
        .number()
        .int()
        .min(1)
        .optional()
        .nullable(),
})

// ─── Lesson Schemas ───

export const lessonSchema = z.object({
    title: z
        .string()
        .min(3, 'Ders başlığı en az 3 karakter olmalı')
        .max(200, 'Ders başlığı en fazla 200 karakter olabilir'),
    description: z
        .string()
        .max(2000, 'Açıklama en fazla 2000 karakter olabilir')
        .optional()
        .or(z.literal('')),
    order_index: z
        .number()
        .int()
        .min(0, 'Sıra negatif olamaz')
        .default(0),
    duration_minutes: z
        .number()
        .int()
        .min(1, 'Süre en az 1 dakika olmalı')
        .max(480, 'Süre en fazla 480 dakika olabilir')
        .default(45),
    lesson_type: z
        .enum(['VIDEO', 'LIVE', 'QUIZ', 'READING', 'ASSIGNMENT'])
        .default('VIDEO'),
    video_url: z
        .string()
        .url('Geçerli bir URL girin')
        .optional()
        .or(z.literal('')),
    scheduled_at: z
        .string()
        .datetime()
        .optional()
        .or(z.literal('')),
    meeting_link: z
        .string()
        .url('Geçerli bir URL girin')
        .optional()
        .or(z.literal('')),
    is_published: z.boolean().default(false),
    is_free_preview: z.boolean().default(false),
})

// ─── Comment Schemas ───

export const commentSchema = z.object({
    content: z
        .string()
        .min(3, 'Yorum en az 3 karakter olmalı')
        .max(1000, 'Yorum en fazla 1000 karakter olabilir'),
    rating: z
        .number()
        .int()
        .min(1, 'Puan en az 1 olmalı')
        .max(5, 'Puan en fazla 5 olabilir')
        .optional()
        .nullable(),
})

// ─── Notification Schemas ───

export const notificationSchema = z.object({
    title: z
        .string()
        .min(3, 'Başlık en az 3 karakter olmalı')
        .max(200, 'Başlık en fazla 200 karakter olabilir'),
    message: z
        .string()
        .min(3, 'Mesaj en az 3 karakter olmalı')
        .max(500, 'Mesaj en fazla 500 karakter olabilir'),
    type: z
        .enum(['ENROLLMENT', 'COURSE_UPDATE', 'LIVE_SESSION', 'ACHIEVEMENT', 'COMMENT', 'SUBSCRIPTION', 'SYSTEM'])
        .default('SYSTEM'),
    link: z
        .string()
        .max(500)
        .optional()
        .or(z.literal('')),
})

export const sendNotificationSchema = z.object({
    title: z
        .string()
        .min(3, 'Başlık en az 3 karakter olmalı')
        .max(200),
    message: z
        .string()
        .min(3, 'Mesaj en az 3 karakter olmalı')
        .max(500),
    target: z.enum(['user', 'students', 'teachers', 'all']),
    targetUserId: z.string().uuid().optional(),
}).refine(
    (data) => data.target !== 'user' || data.targetUserId,
    {
        message: 'Kullanıcı seçilmeli',
        path: ['targetUserId'],
    }
)

// ─── Platform Settings Schema ───

// ─── Platform Settings Schema Moved to settings-schema.ts ───

// ─── Admin User Update Schema ───

export const adminUpdateUserSchema = z.object({
    full_name: z.string().min(2).max(100).optional(),
    role: z.enum(['student', 'teacher', 'admin']).optional(),
    is_active: z.boolean().optional(),
})

// ─── Type Exports ───

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
export type CourseInput = z.infer<typeof courseSchema>
export type LessonInput = z.infer<typeof lessonSchema>
export type CommentInput = z.infer<typeof commentSchema>
export type NotificationInput = z.infer<typeof notificationSchema>
export type SendNotificationInput = z.infer<typeof sendNotificationSchema>
// export type PlatformSettingsInput = z.infer<typeof platformSettingsSchema> // Moved
export type AdminUpdateUserInput = z.infer<typeof adminUpdateUserSchema>
