import { z } from 'zod'

// ─── Platform Settings Schema ───

export const platformSettingsSchema = z.object({
    site_name: z.string().min(1, 'Site adı gerekli').max(100),
    site_description: z.string().max(500).optional().or(z.literal('')),
    site_url: z.string().url('Geçerli bir URL girin (https://...)').optional().or(z.literal('')),
    contact_email: z.string().email('Geçerli bir e-posta girin').optional().or(z.literal('')),
    support_email: z.string().email('Geçerli bir e-posta girin').optional().or(z.literal('')),
    max_enrollments_per_user: z.number().int().min(1).max(100).default(10),
    allow_new_registrations: z.boolean().default(true),
    maintenance_mode: z.boolean().default(false),
    announcement_bar_enabled: z.boolean().default(false),
    announcement_text: z.string().max(500).optional().or(z.literal('')),
    announcement_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#204544'),
    announcement_text_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().or(z.literal('')),
    announcement_marquee: z.boolean().default(false),


    // Visuals
    logo_url: z.string().optional().nullable().or(z.literal('')),
    favicon_url: z.string().optional().nullable().or(z.literal('')),

    // Hero Section
    hero_title: z.string().max(200).optional().or(z.literal('')),
    hero_description: z.string().max(1000).optional().or(z.literal('')),
    hero_image_url: z.string().optional().nullable().or(z.literal('')),
    hero_cta_text: z.string().max(50).optional().or(z.literal('')),
    hero_cta_link: z.string().max(200).optional().or(z.literal('')),
    hero_cta_visible: z.boolean().default(false),

    // Content Section (JSON defaults)
    social_links: z.array(z.any()).optional().default([]),
    features_section: z.array(z.any()).optional().default([]),
    testimonials_section: z.array(z.any()).optional().default([]),
    gratitude_title: z.string().max(200).optional().or(z.literal('')),
    gratitude_section: z.array(z.any()).optional().default([]),
    founder_section: z.record(z.any()).optional().default({}),

    // Footer & Contact
    footer_description: z.string().max(500).optional().or(z.literal('')),
    footer_copyright: z.string().max(200).optional().or(z.literal('')),
    contact_phone: z.string().max(50).optional().or(z.literal('')),
    contact_address: z.string().max(500).optional().or(z.literal('')),
    qr_code_url: z.string().optional().nullable().or(z.literal('')),

    // Social Media
    social_facebook: z.string().optional().or(z.literal('')),
    social_instagram: z.string().optional().or(z.literal('')),
    social_linkedin: z.string().optional().or(z.literal('')),
    social_whatsapp: z.string().optional().or(z.literal('')),


    // Stats
    stats_courses_count: z.coerce.number().optional().default(900),
    stats_students_count: z.coerce.number().optional().default(75),
    stats_satisfaction_rate: z.coerce.number().optional().default(100),

    // Terms of Use
    student_terms: z.string().optional().or(z.literal('')),
    teacher_terms: z.string().optional().or(z.literal('')),

    // Analytics
    google_analytics_id: z.string().optional().or(z.literal('')),
    meta_pixel_id: z.string().optional().or(z.literal('')),

    // Daily Tips
    student_tips: z.array(z.any()).optional().default([]),
    teacher_tips: z.array(z.any()).optional().default([]),

    // How It Works Section
    how_it_works_title: z.string().max(200).optional().or(z.literal('')),
    how_it_works_subtitle: z.string().max(500).optional().or(z.literal('')),
    how_it_works_section: z.array(z.any()).optional().default([]),

    // ── Brand Colors ─────────────────────────────────────────────────────
    brand_primary_color: z
        .string()
        .regex(/^#[0-9A-Fa-f]{6}$/, 'Geçerli bir hex renk kodu girin (örn: #204544)')
        .default('#204544'),
    brand_accent_color: z
        .string()
        .regex(/^#[0-9A-Fa-f]{6}$/, 'Geçerli bir hex renk kodu girin (örn: #FEDD59)')
        .default('#FEDD59'),
})

export type PlatformSettingsInput = z.infer<typeof platformSettingsSchema>
