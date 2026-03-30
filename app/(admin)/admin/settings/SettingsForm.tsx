'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { updatePlatformSettingsAction, uploadPlatformAsset } from '@/lib/actions/settings'
import { toast } from 'react-hot-toast'
import Image from 'next/image'
import BlogList from '@/components/admin/BlogList'
import { DEFAULT_STUDENT_TERMS, DEFAULT_TEACHER_TERMS } from '@/lib/constants/terms'
import AdminProfileForm from '@/components/admin/AdminProfileForm'
import { dailyTips } from '@/lib/dailyTips'
import { teacherTips } from '@/lib/teacherTips'
import TipsManager from '@/components/admin/TipsManager'
import imageCompression from 'browser-image-compression'

// Define schema locally to avoid circular dependency/import issues
const localSettingsSchema = z.object({
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
    announcement_text_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().or(z.literal('')),
    announcement_marquee: z.boolean().default(false),
    student_terms: z.string().optional().or(z.literal('')),
    teacher_terms: z.string().optional().or(z.literal('')),
    google_analytics_id: z.string().optional().or(z.literal('')),
    meta_pixel_id: z.string().optional().or(z.literal('')),
    student_tips: z.array(z.any()).optional().default([]),
    teacher_tips: z.array(z.any()).optional().default([]),

    // How It Works Section
    how_it_works_title: z.string().max(200).optional().or(z.literal('')),
    how_it_works_subtitle: z.string().max(500).optional().or(z.literal('')),
    how_it_works_section: z.array(z.any()).optional().default([]),

    // Brand Colors
    brand_primary_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#204544'),
    brand_accent_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#FEDD59'),
})

type PlatformSettingsInput = z.infer<typeof localSettingsSchema>

interface SettingsFormProps {
    initialSettings: any
}

export default function SettingsForm({ initialSettings }: SettingsFormProps) {
    const [activeTab, setActiveTab] = useState('profile')
    const [uploading, setUploading] = useState(false)

    const defaultValues: PlatformSettingsInput = {
        site_name: initialSettings?.site_name || '',
        site_description: initialSettings?.site_description || '',
        site_url: initialSettings?.site_url || 'https://www.beyandilakademi.com',
        contact_email: initialSettings?.contact_email || '',
        support_email: initialSettings?.support_email || '',
        max_enrollments_per_user: initialSettings?.max_enrollments_per_user || 10,
        allow_new_registrations: initialSettings?.allow_new_registrations ?? true,
        maintenance_mode: initialSettings?.maintenance_mode ?? false,
        announcement_bar_enabled: initialSettings?.announcement_bar_enabled ?? false,
        announcement_text: initialSettings?.announcement_text || '',
        announcement_color: initialSettings?.announcement_color || '#204544',
        announcement_text_color: initialSettings?.announcement_text_color || '#ffffff',
        announcement_marquee: initialSettings?.announcement_marquee ?? false,


        qr_code_url: initialSettings?.qr_code_url || '',

        logo_url: initialSettings?.logo_url || '',
        favicon_url: initialSettings?.favicon_url || '',

        hero_title: initialSettings?.hero_title || '',
        hero_description: initialSettings?.hero_description || '',
        hero_image_url: initialSettings?.hero_image_url || '',
        hero_cta_text: initialSettings?.hero_cta_text || '',
        hero_cta_link: initialSettings?.hero_cta_link || '',
        hero_cta_visible: initialSettings?.hero_cta_visible ?? false,

        footer_description: initialSettings?.footer_description || '',
        footer_copyright: initialSettings?.footer_copyright || '',
        contact_phone: initialSettings?.contact_phone || '',
        contact_address: initialSettings?.contact_address || '',

        social_links: initialSettings?.social_links || [],
        social_facebook: initialSettings?.social_facebook || '',
        social_instagram: initialSettings?.social_instagram || '',
        social_linkedin: initialSettings?.social_linkedin || '',
        social_whatsapp: initialSettings?.social_whatsapp || '',

        features_section: initialSettings?.features_section || [],
        testimonials_section: initialSettings?.testimonials_section || [],
        gratitude_title: initialSettings?.gratitude_title || 'Öğrencilerimiz Neden Bizi Seviyor?',
        gratitude_section: (initialSettings?.gratitude_section && initialSettings.gratitude_section.length > 0) ? initialSettings.gratitude_section : [
            {
                icon: '<svg className="w-[35px] h-[35px] text-brand-accent" fill="currentColor" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.46 21z" /></svg>',
                text: 'Arapça öğrenmek hiç bu kadar keyifli ve kolay olmamıştı. Beyan Dil Akademi bana cesaret verdi.'
            },
            {
                icon: '<svg className="w-[35px] h-[35px] text-brand-accent" fill="currentColor" viewBox="0 0 24 24"><path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z" /></svg>',
                text: 'Kariyerim için attığım en doğru adım. Modern yöntemlerle hızlıca ilerledim.'
            },
            {
                icon: '<svg className="w-[35px] h-[35px] text-brand-accent" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" /></svg>',
                text: 'Sadece bir dil kursu değil, sıcak bir aile ortamı. Her soruma anında yanıt buldum.'
            }
        ],
        founder_section: initialSettings?.founder_section || {},

        stats_courses_count: initialSettings?.stats_courses_count || 900,
        stats_students_count: initialSettings?.stats_students_count || 75,
        stats_satisfaction_rate: initialSettings?.stats_satisfaction_rate || 100,
        student_terms: initialSettings?.student_terms || DEFAULT_STUDENT_TERMS,
        teacher_terms: initialSettings?.teacher_terms || DEFAULT_TEACHER_TERMS,

        student_tips: (initialSettings?.student_tips && initialSettings.student_tips.length > 0) ? initialSettings.student_tips : dailyTips,
        teacher_tips: (initialSettings?.teacher_tips && initialSettings.teacher_tips.length > 0) ? initialSettings.teacher_tips : teacherTips,

        how_it_works_title: (initialSettings as any)?.how_it_works_title || '',
        how_it_works_subtitle: (initialSettings as any)?.how_it_works_subtitle || '',
        how_it_works_section: (initialSettings as any)?.how_it_works_section || [],

        brand_primary_color: (initialSettings as any)?.brand_primary_color || '#204544',
        brand_accent_color: (initialSettings as any)?.brand_accent_color || '#FEDD59',

        google_analytics_id: initialSettings?.google_analytics_id || '',
        meta_pixel_id: initialSettings?.meta_pixel_id || '',
    }

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        control,
        formState: { errors, isSubmitting },
    } = useForm<PlatformSettingsInput>({
        resolver: zodResolver(localSettingsSchema) as any,
        defaultValues,
    })

    // Watch for previews
    const logoUrl = watch('logo_url')
    const faviconUrl = watch('favicon_url')
    const heroImageUrl = watch('hero_image_url')
    const qrCodeUrl = watch('qr_code_url')
    const founderImageUrl = watch('founder_section.image_url' as any)

    const onSubmit = async (data: any) => {
        try {
            const result = await updatePlatformSettingsAction(data)
            if (result.success) {
                toast.success(result.message || 'Ayarlar güncellendi')
            } else {
                toast.error(result.error || 'Bir hata oluştu')
            }
        } catch (e) {
            toast.error('Beklenmeyen bir hata oluştu')
        }
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: any) => {
        const file = e.target.files?.[0]
        if (!file) return

        setUploading(true)
        try {
            let fileToUpload = file;

            // Auto-compress and convert to WebP for images
            if (file.type.startsWith('image/')) {
                const options = {
                    maxSizeMB: 3, // Increased to 3MB to preserve high quality
                    maxWidthOrHeight: 2560, // Allow higher resolution (up to 2K/1440p)
                    useWebWorker: true,
                    alwaysKeepResolution: true, // Prevent aggressive downscaling
                    initialQuality: 0.85, // Balance out quality and size
                    fileType: 'image/webp' // Always convert to WebP
                }

                try {
                    toast.loading('Görsel optimize ediliyor...', { id: 'optimizeToast' })
                    const compressedBlob = await imageCompression(file, options)
                    const newFileName = file.name.replace(/\.[^/.]+$/, "") + ".webp"
                    fileToUpload = new File([compressedBlob], newFileName, { type: 'image/webp' })
                    toast.dismiss('optimizeToast')
                } catch (compressionError) {
                    console.error('Image compression failed, uploading original:', compressionError)
                    toast.dismiss('optimizeToast')
                }
            }

            const formData = new FormData()
            formData.append('file', fileToUpload)

            const result = await uploadPlatformAsset(formData)
            if (result.success && result.url) {
                setValue(fieldName, result.url)
                toast.success('Görsel başarıyla yüklendi ve optimize edildi')
            } else {
                toast.error(result.error || 'Yükleme başarısız')
            }
        } catch (error: any) {
            console.error('Upload error:', error)
            toast.error(error?.message || 'Bir hata oluştu')
        } finally {
            setUploading(false)
        }
    }

    const tabs = [
        { id: 'profile', label: 'Hesap & Profil', icon: 'fa-id-badge', desc: 'Şifre ve kişisel bilgiler' },
        { id: 'general', label: 'Genel Ayarlar', icon: 'fa-cog', desc: 'Kimlik, İletişim, Sistem' },
        { id: 'design', label: 'Görsel & Tasarım', icon: 'fa-paint-brush', desc: 'Tema, Banner, Arayüz' },
        { id: 'content', label: 'İçerik Yönetimi', icon: 'fa-layer-group', desc: 'Sayılar ve Metinler' },
    ]

    return (
        <div className="flex w-full min-h-[calc(100vh-64px)] bg-[#f4f7f6]">

            {/* Settings Sidebar - Clean Light Theme */}
            <div className="w-[16rem] lg:w-[17rem] xl:w-[18rem] flex-shrink-0 bg-white hidden md:flex flex-col border-r border-gray-200 overflow-y-auto custom-scrollbar" style={{ height: 'calc(100vh - 64px)', position: 'sticky', top: '64px' }}>
                <div className="p-6 pb-3">
                    <h2 className="text-xl font-black text-gray-900 tracking-tight">Ayarlar</h2>
                    <p className="text-gray-500 text-xs font-medium mt-1">Platform detaylarını yönet.</p>
                </div>

                <div className="flex flex-col p-3 gap-1.5 flex-1">
                    {tabs.map((tab) => (
                        <button
                            type="button"
                            key={tab.id}
                            onClick={(e) => { e.preventDefault(); setActiveTab(tab.id); }}
                            className={`group p-3 rounded-lg text-left transition-all duration-300 flex items-center gap-3 w-full outline-none border ${activeTab === tab.id
                                ? 'bg-white border-[#204544]/10 shadow-sm'
                                : 'bg-transparent border-transparent hover:bg-gray-50'
                                }`}
                        >
                            <div className={`flex items-center justify-center w-11 h-11 rounded-lg transition-all shrink-0 ${activeTab === tab.id ? 'bg-[#edf1f1] text-[#204544]' : 'bg-gray-100/80 text-gray-500 group-hover:bg-[#edf1f1] group-hover:text-[#204544]'} `}>
                                <i className={`fas ${tab.icon} text-[19px]`}></i>
                            </div>
                            <div className="flex flex-col">
                                <span className={`font-bold text-[14px] ${activeTab === tab.id ? 'text-[#204544]' : 'text-gray-700 group-hover:text-gray-900'}`}>{tab.label}</span>
                                <span className="text-[11px] mt-0.5 font-medium text-gray-400">{tab.desc}</span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col w-full min-w-0">

                {/* Custom Page Header */}
                <div className="bg-white/80 backdrop-blur-xl border-b border-gray-200 px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-[64px] z-30 shadow-sm">
                    <div>
                        <h1 className="text-lg font-extrabold text-gray-900 tracking-tight">
                            {tabs.find(t => t.id === activeTab)?.label || 'Ayarlar'}
                        </h1>
                        <p className="text-gray-500 text-xs mt-0.5">Sistem ayarlarınızı kaydedin.</p>
                    </div>

                    {activeTab !== 'profile' && (
                        <button
                            type="submit"
                            form="settings-form"
                            disabled={isSubmitting || uploading}
                            className="px-6 py-2.5 bg-[#204544] text-white text-[13px] font-extrabold tracking-wide rounded-lg shadow-md shadow-brand-primary/20 hover:bg-[#15302f] hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 w-full sm:w-auto"
                        >
                            {isSubmitting ? (
                                <><i className="fas fa-spinner fa-spin"></i> Kaydediliyor...</>
                            ) : (
                                <><i className="fas fa-check-circle"></i> Değişiklikleri Kaydet</>
                            )}
                        </button>
                    )}
                </div>

                {/* Form Wrapper */}
                <div className="flex-1 p-6 lg:p-8 max-w-[1200px] mx-auto w-full">
                    {/* ─── Personal Profile Tab ─── */}
                    {activeTab === 'profile' && (
                        <AdminProfileForm />
                    )}

                    {activeTab !== 'profile' && (
                        <form
                            id="settings-form"
                            onSubmit={handleSubmit(onSubmit as any)}
                            className="space-y-8 animate-fadeIn"
                        >

                            {/* ─── General Tab ─── */}
                            {activeTab === 'general' && (
                                <div className="space-y-8">
                                    {/* Site Identity Card */}
                                    <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100/80 hover:shadow-md transition-shadow">
                                        <h3 className="text-xl font-extrabold text-gray-900 mb-6 flex items-center gap-3 pb-4 border-b border-gray-100">
                                            <span className="flex items-center justify-center w-12 h-12 rounded-lg bg-[#edf1f1] text-[#204544]">
                                                <i className="fas fa-id-card text-xl"></i>
                                            </span>
                                            Site Kimliği
                                        </h3>
                                        <div className="grid md:grid-cols-2 gap-8">
                                            <div className="space-y-2.5">
                                                <label className="text-sm font-bold text-gray-700">Site Adı</label>
                                                <input
                                                    {...register('site_name')}
                                                    className="w-full px-5 py-3.5 text-sm bg-gray-50 border border-gray-200/80 rounded-md focus:outline-none focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary transition-all hover:border-gray-300 focus:bg-white"
                                                    placeholder="Beyan Dil Akademi"
                                                />
                                                {errors.site_name && <p className="text-xs text-red-500 font-medium">{errors.site_name.message}</p>}
                                            </div>

                                            <div className="space-y-2.5">
                                                <label className="text-sm font-bold text-gray-700">Site Açıklaması (SEO)</label>
                                                <input
                                                    {...register('site_description')}
                                                    className="w-full px-5 py-3.5 text-sm bg-gray-50 border border-gray-200/80 rounded-md focus:outline-none focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary transition-all hover:border-gray-300 focus:bg-white"
                                                    placeholder="Kısa açıklama..."
                                                />
                                            </div>

                                            <div className="space-y-2.5 md:col-span-2">
                                                <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                                    <i className="fas fa-globe text-brand-primary"></i>
                                                    Site URL (Alan Adı)
                                                    <span className="text-xs font-normal text-gray-400">(E-posta doğrulama linkleri ve sitemap için kullanılır)</span>
                                                </label>
                                                <div className="relative">
                                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">🌐</span>
                                                    <input
                                                        {...register('site_url')}
                                                        type="url"
                                                        className="w-full pl-10 pr-5 py-3.5 text-sm bg-gray-50 border border-gray-200/80 rounded-md focus:outline-none focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary transition-all hover:border-gray-300 focus:bg-white"
                                                        placeholder="https://www.beyandilakademi.com"
                                                    />
                                                </div>
                                                {errors.site_url && <p className="text-xs text-red-500 font-medium">{errors.site_url.message}</p>}
                                                <p className="text-xs text-gray-500">⚠️ Bu ayarı değiştirmek e-posta doğrulama ve şifre sıfırlama linklerini etkiler. İlaç gibi dikkatli kullanın.</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Branding Assets Card */}
                                    <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100/80 hover:shadow-md transition-shadow">
                                        <h3 className="text-xl font-extrabold text-gray-900 mb-6 flex items-center gap-3 pb-4 border-b border-gray-100">
                                            <span className="flex items-center justify-center w-12 h-12 rounded-lg bg-[#edf1f1] text-[#204544]">
                                                <i className="fas fa-paint-brush text-xl"></i>
                                            </span>
                                            Görsel Kimlik
                                        </h3>
                                        <div className="grid md:grid-cols-2 gap-8">
                                            {/* Logo */}
                                            <div className="space-y-3">
                                                <label className="text-sm font-bold text-gray-700 flex justify-between items-center">
                                                    Site Logosu
                                                    {uploading && <span className="text-xs font-semibold text-amber-500 animate-pulse bg-amber-50 px-2 py-1 rounded-md">Yükleniyor...</span>}
                                                </label>
                                                <div className="flex flex-col sm:flex-row items-start gap-4 p-5 bg-gray-50/50 rounded-md border-2 border-dashed border-gray-200 hover:border-brand-primary/30 transition-colors">
                                                    <div className="w-24 h-24 bg-white shadow-sm border border-gray-100 rounded-md flex items-center justify-center overflow-hidden relative group shrink-0">
                                                        {logoUrl ? (
                                                            <Image src={logoUrl} alt="Logo" fill sizes="150px" className="object-contain p-3" />
                                                        ) : (
                                                            <i className="fas fa-image text-gray-300 text-3xl"></i>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 space-y-3">
                                                        <label className="cursor-pointer inline-flex items-center px-5 py-2.5 bg-white border border-gray-200 shadow-sm text-gray-700 font-bold text-xs rounded-md hover:bg-gray-50 hover:text-brand-primary hover:border-brand-primary/30 transition-all">
                                                            <i className="fas fa-cloud-upload-alt mr-2 text-lg text-gray-400"></i> Logo Seç
                                                            <input
                                                                type="file"
                                                                accept="image/*"
                                                                onChange={(e) => handleFileUpload(e, 'logo_url')}
                                                                className="hidden"
                                                            />
                                                        </label>
                                                        <p className="text-xs text-gray-500 font-medium">Format: PNG veya SVG (Şeffaf arkaplan)</p>
                                                        <div className="inline-block mt-1 px-2.5 py-1.5 border-2 border-amber-200 bg-amber-50 text-amber-800 text-[11px] font-bold rounded-md">
                                                            📌 İdeal Boyut: 400x100px (Geniş Dikdörtgen)
                                                        </div>
                                                    </div>
                                                </div>
                                                <input type="hidden" {...register('logo_url')} />
                                            </div>

                                            {/* Favicon */}
                                            <div className="space-y-3">
                                                <label className="text-sm font-bold text-gray-700 flex justify-between items-center">
                                                    Favicon (Tarayıcı İkonu)
                                                </label>
                                                <div className="flex flex-col sm:flex-row items-start gap-4 p-5 bg-gray-50/50 rounded-md border-2 border-dashed border-gray-200 hover:border-brand-primary/30 transition-colors">
                                                    <div className="w-16 h-16 bg-white shadow-sm border border-gray-100 rounded-md flex items-center justify-center overflow-hidden relative shrink-0">
                                                        {faviconUrl ? (
                                                            <Image src={faviconUrl} alt="Favicon" fill sizes="64px" className="object-contain p-2" />
                                                        ) : (
                                                            <i className="fas fa-globe text-gray-300 text-2xl"></i>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 space-y-3">
                                                        <label className="cursor-pointer inline-flex items-center px-5 py-2.5 bg-white border border-gray-200 shadow-sm text-gray-700 font-bold text-xs rounded-md hover:bg-gray-50 hover:text-brand-primary hover:border-brand-primary/30 transition-all">
                                                            <i className="fas fa-cloud-upload-alt mr-2 text-lg text-gray-400"></i> İkon Yükle
                                                            <input
                                                                type="file"
                                                                accept="image/*"
                                                                onChange={(e) => handleFileUpload(e, 'favicon_url')}
                                                                className="hidden"
                                                            />
                                                        </label>
                                                        <p className="text-xs text-gray-500 font-medium">Format: PNG veya ICO (Şeffaf arkaplan)</p>
                                                        <div className="inline-block mt-1 px-2.5 py-1.5 border-2 border-amber-200 bg-amber-50 text-amber-800 text-[11px] font-bold rounded-md">
                                                            📌 İdeal Boyut: 512x512px (Kare Boyut)
                                                        </div>
                                                    </div>
                                                </div>
                                                <input type="hidden" {...register('favicon_url')} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ─── Hero Tab ─── */}
                            {activeTab === 'design' && (
                                <div className="space-y-8">
                                    <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100/80 hover:shadow-md transition-shadow">
                                        <h3 className="text-xl font-extrabold text-gray-900 mb-6 flex items-center gap-3 pb-4 border-b border-gray-100">
                                            <span className="flex items-center justify-center w-12 h-12 rounded-lg bg-[#edf1f1] text-[#204544]">
                                                <i className="fas fa-desktop text-xl"></i>
                                            </span>
                                            Ana Sayfa Giriş Bölümü
                                        </h3>

                                        <div className="grid lg:grid-cols-3 gap-8">
                                            <div className="lg:col-span-2 space-y-6">
                                                <div className="space-y-2.5">
                                                    <label className="text-sm font-bold text-gray-700">Ana Başlık (Hero Title)</label>
                                                    <input
                                                        {...register('hero_title')}
                                                        className="w-full px-5 py-3.5 text-sm bg-gray-50 border border-gray-200/80 rounded-md focus:outline-none focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary transition-all hover:border-gray-300 focus:bg-white"
                                                        placeholder="Örn: Arapça ile Dünyaya Açılın"
                                                    />
                                                </div>

                                                <div className="space-y-2.5">
                                                    <label className="text-sm font-bold text-gray-700">Alt Metin</label>
                                                    <textarea
                                                        {...register('hero_description')}
                                                        rows={4}
                                                        className="w-full px-5 py-3.5 text-sm bg-gray-50 border border-gray-200/80 rounded-md focus:outline-none focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary transition-all hover:border-gray-300 focus:bg-white resize-none"
                                                        placeholder="Örn: Modern ve interaktif dil öğrenme..."
                                                    />
                                                </div>

                                                {/* Hero CTA Settings */}
                                                <div className="pt-6 border-t border-gray-100">
                                                    <h4 className="text-md font-bold text-gray-900 mb-4 flex items-center gap-2">
                                                        <i className="fas fa-mouse-pointer text-brand-primary"></i> Aksiyon Butonu (CTA Button)
                                                    </h4>
                                                    <div className="p-6 bg-gray-50/50 rounded-md border border-gray-200/80 space-y-6">
                                                        <div className="flex items-center justify-between">
                                                            <div>
                                                                <span className="text-sm font-bold text-gray-900 block">Butonu Göster</span>
                                                                <span className="text-xs text-gray-500 mt-1 block">Hero bölümünde başlık altında ekstra bir buton gösterir.</span>
                                                            </div>
                                                            <label className="relative inline-flex items-center cursor-pointer">
                                                                <input type="checkbox" {...register('hero_cta_visible')} className="sr-only peer" />
                                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-primary"></div>
                                                            </label>
                                                        </div>

                                                        {watch('hero_cta_visible') && (
                                                            <div className="grid md:grid-cols-2 gap-6 pt-4 border-t border-gray-200/50 animate-fadeIn">
                                                                <div className="space-y-2.5">
                                                                    <label className="text-sm font-bold text-gray-700">Buton Metni</label>
                                                                    <input
                                                                        {...register('hero_cta_text')}
                                                                        className="w-full px-5 py-3 text-sm bg-white border border-gray-200/80 rounded-md focus:outline-none focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary transition-all hover:border-gray-300"
                                                                        placeholder="Örn: Hemen Başla"
                                                                    />
                                                                </div>
                                                                <div className="space-y-2.5">
                                                                    <label className="text-sm font-bold text-gray-700">Buton Linki</label>
                                                                    <input
                                                                        {...register('hero_cta_link')}
                                                                        className="w-full px-5 py-3 text-sm bg-white border border-gray-200/80 rounded-md focus:outline-none focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary transition-all hover:border-gray-300"
                                                                        placeholder="Örn: /kayit veya https://..."
                                                                    />
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-3 lg:border-l lg:border-gray-100 lg:pl-8">
                                                <label className="text-sm font-bold text-gray-700 flex justify-between items-center">
                                                    Arkaplan Görseli
                                                    {uploading && <span className="text-xs font-semibold text-amber-500 animate-pulse bg-amber-50 px-2 py-1 rounded-md">Yükleniyor...</span>}
                                                </label>
                                                <div className="w-full aspect-[4/3] bg-gray-50/50 rounded-md border-2 border-dashed border-gray-200 hover:border-brand-primary/40 transition-colors flex flex-col items-center justify-center overflow-hidden relative group">
                                                    {heroImageUrl ? (
                                                        <>
                                                            <Image src={heroImageUrl} alt="Hero" fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
                                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                                                                <label className="cursor-pointer px-6 py-3 bg-white text-gray-900 rounded-md text-sm font-bold shadow-md hover:scale-105 transition-transform flex items-center gap-2">
                                                                    <i className="fas fa-camera"></i> Değiştir
                                                                    <input
                                                                        type="file"
                                                                        accept="image/*"
                                                                        onChange={(e) => handleFileUpload(e, 'hero_image_url')}
                                                                        className="hidden"
                                                                    />
                                                                </label>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <label className="cursor-pointer flex flex-col items-center gap-3 p-6 text-center w-full h-full justify-center">
                                                            <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 mb-2 group-hover:bg-blue-100 transition-colors">
                                                                <i className="fas fa-cloud-upload-alt text-2xl"></i>
                                                            </div>
                                                            <span className="text-sm font-bold text-gray-700 group-hover:text-blue-600 transition-colors">Görsel Yükle</span>
                                                            <input
                                                                type="file"
                                                                accept="image/*"
                                                                onChange={(e) => handleFileUpload(e, 'hero_image_url')}
                                                                className="hidden"
                                                            />
                                                        </label>
                                                    )}
                                                </div>
                                                <div className="mt-2 text-center">
                                                    <span className="inline-block px-2.5 py-1.5 border-2 border-amber-200 bg-amber-50 text-amber-800 text-[11px] font-bold rounded-md w-full">
                                                        📌 İdeal Boyut: 1920x1080px (Geniş Yatay)
                                                    </span>
                                                </div>
                                                <input type="hidden" {...register('hero_image_url')} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ─── Contact Tab ─── */}
                            {activeTab === 'general' && (
                                <div className="space-y-8">
                                    {/* Contact Info Card */}
                                    <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100/80 hover:shadow-md transition-shadow">
                                        <h3 className="text-xl font-extrabold text-gray-900 mb-6 flex items-center gap-3 pb-4 border-b border-gray-100">
                                            <span className="flex items-center justify-center w-12 h-12 rounded-lg bg-[#edf1f1] text-[#204544]">
                                                <i className="fas fa-address-book text-xl"></i>
                                            </span>
                                            İletişim Bilgileri
                                        </h3>
                                        <div className="grid md:grid-cols-2 gap-8">
                                            <div className="space-y-2.5">
                                                <label className="text-sm font-bold text-gray-700">İletişim E-posta</label>
                                                <div className="relative group">
                                                    <span className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-brand-primary transition-colors"><i className="fas fa-envelope"></i></span>
                                                    <input
                                                        {...register('contact_email')}
                                                        className="w-full pl-11 pr-5 py-3.5 text-sm bg-gray-50 border border-gray-200/80 rounded-md focus:outline-none focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary transition-all hover:border-gray-300 focus:bg-white"
                                                        placeholder="info@ornek.com"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2.5">
                                                <label className="text-sm font-bold text-gray-700">Destek E-posta</label>
                                                <div className="relative group">
                                                    <span className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-brand-primary transition-colors"><i className="fas fa-headset"></i></span>
                                                    <input
                                                        {...register('support_email')}
                                                        className="w-full pl-11 pr-5 py-3.5 text-sm bg-gray-50 border border-gray-200/80 rounded-md focus:outline-none focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary transition-all hover:border-gray-300 focus:bg-white"
                                                        placeholder="destek@ornek.com"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2.5">
                                                <label className="text-sm font-bold text-gray-700">Telefon</label>
                                                <div className="relative group">
                                                    <span className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-brand-primary transition-colors"><i className="fas fa-phone"></i></span>
                                                    <input
                                                        {...register('contact_phone')}
                                                        className="w-full pl-11 pr-5 py-3.5 text-sm bg-gray-50 border border-gray-200/80 rounded-md focus:outline-none focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary transition-all hover:border-gray-300 focus:bg-white"
                                                        placeholder="+90 555..."
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2.5 md:col-span-2">
                                                <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                                    Adres <span className="text-xs text-gray-400 font-normal">(Footer'da görünür)</span>
                                                </label>
                                                <div className="relative group">
                                                    <span className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-brand-primary transition-colors"><i className="fas fa-map-pin"></i></span>
                                                    <input
                                                        {...register('contact_address')}
                                                        className="w-full pl-11 pr-5 py-3.5 text-sm bg-gray-50 border border-gray-200/80 rounded-md focus:outline-none focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary transition-all hover:border-gray-300 focus:bg-white"
                                                        placeholder="Örn: Maslak Mah. Büyükdere Cad. No:1 Sarıyer/İstanbul"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2.5 md:col-span-2">
                                                <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                                    Footer Copyright Metni <span className="text-xs text-gray-400 font-normal">(Alt kısımdaki telif hakkı yazısı)</span>
                                                </label>
                                                <div className="relative group">
                                                    <span className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-brand-primary transition-colors"><i className="fas fa-copyright"></i></span>
                                                    <input
                                                        {...register('footer_copyright')}
                                                        className="w-full pl-11 pr-5 py-3.5 text-sm bg-gray-50 border border-gray-200/80 rounded-md focus:outline-none focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary transition-all hover:border-gray-300 focus:bg-white"
                                                        placeholder="© 2024 Beyan Dil Akademi. Tüm hakları saklıdır."
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* QR Code Upload Section */}
                                        <div className="space-y-4 pt-8 border-t border-gray-100 mt-8">
                                            <label className="text-sm font-bold text-gray-700 flex justify-between items-center">
                                                Hızlı Erişim QR Kodu
                                                {uploading && <span className="text-xs font-semibold text-amber-500 animate-pulse bg-amber-50 px-2 py-1 rounded-md">Yükleniyor...</span>}
                                            </label>
                                            <div className="flex flex-col sm:flex-row items-start gap-5 p-6 bg-gray-50/50 rounded-md border-2 border-dashed border-gray-200 hover:border-brand-primary/30 transition-colors">
                                                <div className="w-24 h-24 bg-white shadow-sm border border-gray-100 rounded-md flex items-center justify-center overflow-hidden relative group shrink-0">
                                                    {qrCodeUrl ? (
                                                        <Image src={qrCodeUrl} alt="QR" fill sizes="100px" className="object-contain p-2" />
                                                    ) : (
                                                        <i className="fas fa-qrcode text-gray-300 text-3xl"></i>
                                                    )}
                                                </div>
                                                <div className="flex-1 space-y-3">
                                                    <label className="cursor-pointer inline-flex items-center px-5 py-2.5 bg-white border border-gray-200 shadow-sm text-gray-700 font-bold text-xs rounded-md hover:bg-gray-50 hover:text-brand-primary hover:border-brand-primary/30 transition-all">
                                                        <i className="fas fa-camera mr-2 text-lg text-gray-400"></i> QR Değiştir
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={(e) => handleFileUpload(e, 'qr_code_url')}
                                                            className="hidden"
                                                        />
                                                    </label>
                                                    <p className="text-xs text-gray-500 font-medium leading-relaxed">WhatsApp vb. İletişim QR kodu.</p>
                                                    <div className="inline-block mt-1 px-2.5 py-1.5 border-2 border-amber-200 bg-amber-50 text-amber-800 text-[11px] font-bold rounded-md">
                                                        📌 İdeal Boyut: 500x500px (Kare Boyut)
                                                    </div>
                                                </div>
                                            </div>
                                            <input type="hidden" {...register('qr_code_url')} />
                                        </div>
                                    </div>


                                </div>
                            )}

                            {/* ─── Content Tab ─── */}
                            {activeTab === 'content' && (
                                <div className="space-y-8 animate-fadeIn">

                                    {/* Stats Section */}
                                    <div className="bg-white p-8 rounded-lg border border-gray-100/80 shadow-sm hover:shadow-md transition-shadow">
                                        <h3 className="text-xl font-extrabold text-gray-900 mb-6 flex items-center gap-3 pb-4 border-b border-gray-100">
                                            <span className="flex items-center justify-center w-12 h-12 rounded-lg bg-[#edf1f1] text-[#204544]">
                                                <i className="fas fa-chart-line text-xl"></i>
                                            </span>
                                            İstatistikler
                                        </h3>
                                        <div className="grid md:grid-cols-3 gap-6 block mt-4 bg-gray-50/50 p-6 rounded-md border border-gray-100">
                                            <div className="space-y-2.5">
                                                <label className="text-sm font-bold text-gray-700">Eğitim Dersi (+)</label>
                                                <input
                                                    type="number"
                                                    {...register('stats_courses_count')}
                                                    className="w-full px-5 py-3.5 text-sm bg-white border border-gray-200/80 rounded-md focus:outline-none focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary transition-all hover:border-gray-300"
                                                    placeholder="900"
                                                />
                                                <p className="text-xs text-gray-500 font-medium">Ana sayfada <span className="font-bold text-gray-700">900+</span> şeklinde görünür</p>
                                            </div>
                                            <div className="space-y-2.5">
                                                <label className="text-sm font-bold text-gray-700">Eğitim Alan Öğrenci (+)</label>
                                                <input
                                                    type="number"
                                                    {...register('stats_students_count')}
                                                    className="w-full px-5 py-3.5 text-sm bg-white border border-gray-200/80 rounded-md focus:outline-none focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary transition-all hover:border-gray-300"
                                                    placeholder="75"
                                                />
                                                <p className="text-xs text-gray-500 font-medium">Ana sayfada <span className="font-bold text-gray-700">75+</span> şeklinde görünür</p>
                                            </div>
                                            <div className="space-y-2.5">
                                                <label className="text-sm font-bold text-gray-700">Memnuniyet Oranı (%)</label>
                                                <input
                                                    type="number"
                                                    {...register('stats_satisfaction_rate')}
                                                    className="w-full px-5 py-3.5 text-sm bg-white border border-gray-200/80 rounded-md focus:outline-none focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary transition-all hover:border-gray-300"
                                                    placeholder="100"
                                                />
                                                <p className="text-xs text-gray-500 font-medium">Ana sayfada <span className="font-bold text-gray-700">%100</span> şeklinde görünür</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Founder Section */}
                                    <div className="bg-white p-8 rounded-lg border border-gray-100/80 shadow-sm hover:shadow-md transition-shadow">
                                        <h3 className="text-xl font-extrabold text-gray-900 mb-6 flex items-center gap-3 pb-4 border-b border-gray-100">
                                            <span className="flex items-center justify-center w-12 h-12 rounded-lg bg-[#edf1f1] text-[#204544]">
                                                <i className="fas fa-user-tie text-xl"></i>
                                            </span>
                                            Kurucu Bilgileri
                                        </h3>

                                        <div className="grid md:grid-cols-2 gap-8">
                                            <div className="space-y-6">
                                                <div className="space-y-2.5">
                                                    <label className="text-sm font-bold text-gray-700">Ad Soyad</label>
                                                    <input
                                                        {...register('founder_section.name' as any)}
                                                        className="w-full px-5 py-3.5 text-sm bg-gray-50 border border-gray-200/80 rounded-md focus:outline-none focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary transition-all hover:border-gray-300 focus:bg-white"
                                                        placeholder="Ziyad Dalil"
                                                    />
                                                </div>
                                                <div className="space-y-2.5">
                                                    <label className="text-sm font-bold text-gray-700">Ünvan / Başlık</label>
                                                    <input
                                                        {...register('founder_section.title' as any)}
                                                        className="w-full px-5 py-3.5 text-sm bg-gray-50 border border-gray-200/80 rounded-md focus:outline-none focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary transition-all hover:border-gray-300 focus:bg-white"
                                                        placeholder="Merhaba, Ben Ziyad Dalil"
                                                    />
                                                </div>
                                            </div>

                                            {/* Founder Image Upload */}
                                            <div className="space-y-3 lg:border-l lg:border-gray-100 lg:pl-8">
                                                <label className="text-sm font-bold text-gray-700 flex justify-between items-center">
                                                    Kurucu Fotoğrafı
                                                    {uploading && <span className="text-xs font-semibold text-amber-500 animate-pulse bg-amber-50 px-2 py-1 rounded-md">Yükleniyor...</span>}
                                                </label>
                                                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 p-5 bg-gray-50/50 rounded-md border-2 border-dashed border-gray-200 hover:border-brand-primary/30 transition-colors">
                                                    <div className="w-28 h-36 bg-white shadow-sm border border-gray-100 rounded-md flex items-center justify-center overflow-hidden relative shrink-0">
                                                        {founderImageUrl ? (
                                                            <Image
                                                                src={founderImageUrl}
                                                                alt="Founder"
                                                                fill
                                                                sizes="100px"
                                                                className="object-cover"
                                                            />
                                                        ) : (
                                                            <i className="fas fa-user text-gray-300 text-4xl"></i>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 w-full text-center sm:text-left space-y-3">
                                                        <label className="cursor-pointer inline-flex items-center px-4 py-2.5 bg-white border border-gray-200 shadow-sm text-gray-700 font-bold text-xs rounded-md hover:bg-gray-50 hover:text-brand-primary hover:border-brand-primary/30 transition-all justify-center w-full sm:w-auto">
                                                            <i className="fas fa-camera mr-2 text-lg text-gray-400"></i> Dosya Seç
                                                            <input
                                                                type="file"
                                                                accept="image/*"
                                                                onChange={(e) => handleFileUpload(e, 'founder_section.image_url')}
                                                                className="hidden"
                                                            />
                                                        </label>
                                                        <p className="text-xs text-gray-500 font-medium">Kurucu portre fotoğrafı.</p>
                                                        <div className="inline-block mt-1 px-2.5 py-1.5 border-2 border-amber-200 bg-amber-50 text-amber-800 text-[11px] font-bold rounded-md">
                                                            📌 İdeal Boyut: 600x800px (Dikey Portre)
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-6 pt-6 mt-6 border-t border-gray-100">
                                            <div className="space-y-2.5">
                                                <label className="text-sm font-bold text-gray-700">Biyografi (Paragraf 1)</label>
                                                <textarea
                                                    {...register('founder_section.bio_paragraph_1' as any)}
                                                    rows={3}
                                                    className="w-full px-5 py-3.5 text-sm bg-gray-50 border border-gray-200/80 rounded-md focus:outline-none focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary transition-all hover:border-gray-300 focus:bg-white resize-none"
                                                    placeholder="Arapça öğretme serüvenim..."
                                                />
                                            </div>
                                            <div className="space-y-2.5">
                                                <label className="text-sm font-bold text-gray-700">Biyografi (Paragraf 2)</label>
                                                <textarea
                                                    {...register('founder_section.bio_paragraph_2' as any)}
                                                    rows={3}
                                                    className="w-full px-5 py-3.5 text-sm bg-gray-50 border border-gray-200/80 rounded-md focus:outline-none focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary transition-all hover:border-gray-300 focus:bg-white resize-none"
                                                    placeholder="Bu vizyonla..."
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Gratitude (Why Students Love Us) Section */}
                                    <div className="bg-white p-8 rounded-lg border border-gray-100/80 shadow-sm hover:shadow-md transition-shadow">
                                        <h3 className="text-xl font-extrabold text-gray-900 mb-6 flex items-center gap-3 pb-4 border-b border-gray-100">
                                            <span className="flex items-center justify-center w-12 h-12 rounded-lg bg-[#edf1f1] text-[#204544]">
                                                <i className="fas fa-star text-xl"></i>
                                            </span>
                                            Memnuniyet ve Geri Bildirimler
                                        </h3>

                                        <div className="space-y-6">
                                            <div className="space-y-2.5">
                                                <label className="text-sm font-bold text-gray-700">Bölüm Başlığı</label>
                                                <input
                                                    {...register('gratitude_title')}
                                                    className="w-full px-5 py-3.5 text-sm bg-gray-50 border border-gray-200/80 rounded-md focus:outline-none focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary transition-all hover:border-gray-300 focus:bg-white"
                                                    placeholder="Örn: Öğrencilerimiz Neden Bizi Seviyor?"
                                                />
                                            </div>

                                            <div className="grid lg:grid-cols-3 gap-6 pt-2">
                                                {[0, 1, 2].map((index) => (
                                                    <div key={index} className="p-6 bg-gray-50/50 rounded-md border border-gray-200/80 space-y-5 hover:border-brand-primary/30 hover:bg-white transition-colors group">
                                                        <h4 className="text-sm font-extrabold text-gray-900 flex items-center gap-3">
                                                            <span className="w-7 h-7 rounded-lg bg-brand-accent text-gray-900 flex items-center justify-center text-xs shadow-sm shadow-yellow-500/20 group-hover:scale-110 transition-transform">{index + 1}</span>
                                                            Geri Bildirim {index + 1}
                                                        </h4>

                                                        <div className="space-y-2.5">
                                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">İkon (SVG/HTML)</label>
                                                            <textarea
                                                                {...register(`gratitude_section.${index}.icon` as any)}
                                                                rows={3}
                                                                className="w-full px-4 py-3 text-[11px] font-mono bg-white border border-gray-200/80 rounded-md focus:outline-none focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary hover:border-gray-300"
                                                                placeholder="<svg>...</svg>"
                                                            />
                                                        </div>

                                                        <div className="space-y-2.5">
                                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Metin</label>
                                                            <textarea
                                                                {...register(`gratitude_section.${index}.text` as any)}
                                                                rows={4}
                                                                className="w-full px-4 py-3 text-sm bg-white border border-gray-200/80 rounded-md focus:outline-none focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary hover:border-gray-300 resize-none"
                                                                placeholder="Öğrenci yorumu veya özellik..."
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>


                                </div>
                            )}


                            {/* ─── Footer Tab ─── */}
                            {activeTab === 'design' && (
                                <div className="space-y-8 animate-fadeIn">
                                    <div className="bg-white p-8 rounded-lg border border-gray-100/80 shadow-sm hover:shadow-md transition-shadow">
                                        <h3 className="text-xl font-extrabold text-gray-900 mb-6 flex items-center gap-3 pb-4 border-b border-gray-100">
                                            <span className="flex items-center justify-center w-12 h-12 rounded-lg bg-[#edf1f1] text-[#204544]">
                                                <i className="fas fa-layer-group text-xl"></i>
                                            </span>
                                            Footer İçeriği
                                        </h3>

                                        <div className="space-y-6 mt-6">
                                            <div className="space-y-2.5">
                                                <label className="text-sm font-bold text-gray-700">Footer Açıklama Metni</label>
                                                <textarea
                                                    {...register('footer_description')}
                                                    rows={3}
                                                    className="w-full px-5 py-3.5 text-sm bg-gray-50 border border-gray-200/80 rounded-md focus:outline-none focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary transition-all hover:border-gray-300 resize-none focus:bg-white"
                                                    placeholder="Modern metodlarla Arapça eğitimi..."
                                                />
                                            </div>
                                            <div className="space-y-2.5">
                                                <label className="text-sm font-bold text-gray-700">Telif Hakkı Yazısı (Copyright)</label>
                                                <input
                                                    {...register('footer_copyright')}
                                                    className="w-full px-5 py-3.5 text-sm bg-gray-50 border border-gray-200/80 rounded-md focus:outline-none focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary transition-all hover:border-gray-300 focus:bg-white"
                                                    placeholder="© 2024 Beyan Dil Akademi. Tüm hakları saklıdır."
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white p-8 rounded-lg border border-gray-100/80 shadow-sm hover:shadow-md transition-shadow">
                                        <h3 className="text-xl font-extrabold text-gray-900 mb-6 flex items-center gap-3 pb-4 border-b border-gray-100">
                                            <span className="flex items-center justify-center w-12 h-12 rounded-lg bg-[#edf1f1] text-[#204544]">
                                                <i className="fas fa-share-alt text-xl"></i>
                                            </span>
                                            Sosyal Medya Linkleri
                                        </h3>

                                        <div className="grid md:grid-cols-2 gap-8 mt-6">
                                            <div className="space-y-2.5">
                                                <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                                    <i className="fab fa-facebook text-blue-600"></i> Facebook
                                                </label>
                                                <input
                                                    {...register('social_facebook')}
                                                    className="w-full px-5 py-3.5 text-sm bg-gray-50 border border-gray-200/80 rounded-md focus:outline-none focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary transition-all hover:border-gray-300 focus:bg-white"
                                                    placeholder="https://facebook.com/..."
                                                />
                                            </div>
                                            <div className="space-y-2.5">
                                                <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                                    <i className="fab fa-instagram text-pink-600"></i> Instagram
                                                </label>
                                                <input
                                                    {...register('social_instagram')}
                                                    className="w-full px-5 py-3.5 text-sm bg-gray-50 border border-gray-200/80 rounded-md focus:outline-none focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary transition-all hover:border-gray-300 focus:bg-white"
                                                    placeholder="https://instagram.com/..."
                                                />
                                            </div>
                                            <div className="space-y-2.5">
                                                <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                                    <i className="fab fa-linkedin text-blue-700"></i> LinkedIn
                                                </label>
                                                <input
                                                    {...register('social_linkedin')}
                                                    className="w-full px-5 py-3.5 text-sm bg-gray-50 border border-gray-200/80 rounded-md focus:outline-none focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary transition-all hover:border-gray-300 focus:bg-white"
                                                    placeholder="https://linkedin.com/in/..."
                                                />
                                            </div>
                                            <div className="space-y-2.5">
                                                <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                                    <i className="fab fa-whatsapp text-green-500"></i> WhatsApp
                                                </label>
                                                <input
                                                    {...register('social_whatsapp')}
                                                    className="w-full px-5 py-3.5 text-sm bg-gray-50 border border-gray-200/80 rounded-md focus:outline-none focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary transition-all hover:border-gray-300 focus:bg-white"
                                                    placeholder="https://wa.me/..."
                                                />
                                            </div>

                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ─── Blog Tab ─── */}
                            {activeTab === 'content' && (
                                <div className="bg-white p-8 rounded-lg border border-gray-100/80 shadow-sm hover:shadow-md transition-shadow animate-fadeIn">
                                    <div className="mb-6 pb-4 border-b border-gray-100 flex items-center gap-4">
                                        <span className="flex items-center justify-center w-12 h-12 rounded-lg bg-[#edf1f1] text-[#204544] shrink-0">
                                            <i className="fas fa-newspaper text-xl"></i>
                                        </span>
                                        <div>
                                            <h3 className="text-xl font-extrabold text-gray-900">Blog Yönetimi</h3>
                                            <p className="text-sm font-medium text-gray-500 mt-0.5">Sitenizdeki blog yazılarını buradan yönetebilirsiniz.</p>
                                        </div>
                                    </div>
                                    <BlogList />
                                </div>
                            )}

                            {/* ─── Tips Tab ─── */}
                            {activeTab === 'content' && (
                                <div className="space-y-8 animate-fadeIn">
                                    <TipsManager
                                        control={control}
                                        name="student_tips"
                                        title="Öğrenci İpuçları"
                                        description="Öğrenci panelinde her gün sırayla değişerek gösterilecek olan motivasyon ve tavsiye ipuçları."
                                        icon="fa-graduation-cap"
                                        colorClass="text-brand-primary bg-brand-primary"
                                    />

                                    <TipsManager
                                        control={control}
                                        name="teacher_tips"
                                        title="Eğitmen İpuçları"
                                        description="Eğitmen panelinde her gün sırayla değişerek gösterilecek olan eğitim metodları ve motivasyon sözleri."
                                        icon="fa-chalkboard-teacher"
                                        colorClass="text-indigo-600 bg-indigo-500"
                                    />
                                </div>
                            )}


                            {/* ─── Legal Tab ─── */}
                            {activeTab === 'general' && (
                                <div className="space-y-8 animate-fadeIn">
                                    <div className="bg-white p-8 rounded-lg border border-gray-100/80 shadow-sm hover:shadow-md transition-shadow">
                                        <h3 className="text-xl font-extrabold text-gray-900 mb-6 flex items-center gap-3 pb-4 border-b border-gray-100">
                                            <span className="flex items-center justify-center w-12 h-12 rounded-lg bg-[#edf1f1] text-[#204544]">
                                                <i className="fas fa-gavel text-xl"></i>
                                            </span>
                                            Kullanım Şartları
                                        </h3>
                                        <div className="space-y-8 mt-6">
                                            <div className="space-y-2.5">
                                                <label className="text-sm font-bold text-gray-700">Öğrenci Kullanım Şartları</label>
                                                <textarea
                                                    {...register('student_terms')}
                                                    rows={8}
                                                    className="w-full px-5 py-3.5 text-sm bg-gray-50 border border-gray-200/80 rounded-md focus:outline-none focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary transition-all hover:border-gray-300 font-sans focus:bg-white resize-none"
                                                    placeholder="Öğrenci kayıt sayfasında görünecek şartlar..."
                                                />
                                                <p className="text-xs text-gray-500 font-medium">Boş bırakılırsa varsayılan şartlar gösterilir.</p>
                                            </div>

                                            <div className="space-y-2.5">
                                                <label className="text-sm font-bold text-gray-700">Eğitmen Kullanım Şartları</label>
                                                <textarea
                                                    {...register('teacher_terms')}
                                                    rows={8}
                                                    className="w-full px-5 py-3.5 text-sm bg-gray-50 border border-gray-200/80 rounded-md focus:outline-none focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary transition-all hover:border-gray-300 font-sans focus:bg-white resize-none"
                                                    placeholder="Eğitmen başvuru sayfasında görünecek şartlar..."
                                                />
                                                <p className="text-xs text-gray-500 font-medium">Boş bırakılırsa varsayılan şartlar gösterilir.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}


                            {/* ─── Technical Tab ─── */}
                            {activeTab === 'general' && (
                                <div className="space-y-8 animate-fadeIn">
                                    <div className="p-8 bg-white border border-gray-100/80 shadow-sm hover:shadow-md transition-shadow rounded-lg space-y-6 shadow-sm">
                                        <h3 className="text-lg font-extrabold text-gray-900 flex items-center gap-3">
                                            <span className="w-10 h-10 rounded-lg bg-[#edf1f1] text-[#204544] flex items-center justify-center shadow-sm">
                                                <i className="fas fa-server"></i>
                                            </span>
                                            Sistem Kontrolü
                                        </h3>
                                        <div className="grid md:grid-cols-2 gap-4">
                                            <label className="flex items-center justify-between p-5 bg-white rounded-md border border-orange-100 shadow-sm hover:shadow hover:border-orange-300 transition-all cursor-pointer group">
                                                <div>
                                                    <span className="text-sm font-bold text-gray-900 block group-hover:text-orange-700 transition-colors">Bakım Modu</span>
                                                    <span className="text-xs text-gray-500 font-medium mt-0.5 block">Siteyi ziyaretçilere kapatır, sadece yöneticiler girebilir.</span>
                                                </div>
                                                <div className="relative inline-flex items-center cursor-pointer shrink-0">
                                                    <input type="checkbox" {...register('maintenance_mode')} className="sr-only peer" />
                                                    <div className="w-12 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                                                </div>
                                            </label>

                                            <label className="flex items-center justify-between p-5 bg-white rounded-md border border-orange-100 shadow-sm hover:shadow hover:border-orange-300 transition-all cursor-pointer group">
                                                <div>
                                                    <span className="text-sm font-bold text-gray-900 block group-hover:text-green-600 transition-colors">Yeni Üye Kaydı</span>
                                                    <span className="text-xs text-gray-500 font-medium mt-0.5 block">Alımları durdurmak için kayıtları kapatabilirsiniz.</span>
                                                </div>
                                                <div className="relative inline-flex items-center cursor-pointer shrink-0">
                                                    <input type="checkbox" {...register('allow_new_registrations')} className="sr-only peer" />
                                                    <div className="w-12 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                                                </div>
                                            </label>
                                        </div>
                                    </div>

                                    <div className="p-8 bg-white border border-gray-100/80 shadow-sm hover:shadow-md transition-shadow rounded-lg space-y-6 shadow-sm">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-lg font-extrabold text-blue-900 flex items-center gap-3">
                                                <span className="w-10 h-10 rounded-lg bg-[#edf1f1] text-[#204544] flex items-center justify-center shadow-sm">
                                                    <i className="fas fa-bullhorn"></i>
                                                </span>
                                                Duyuru Çubuğu
                                            </h3>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" {...register('announcement_bar_enabled')} className="sr-only peer" />
                                                <div className="w-12 h-6 bg-gray-300/80 shadow-inner peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                            </label>
                                        </div>

                                        <div className={`grid gap-6 transition-all duration-300 ${!watch('announcement_bar_enabled') ? 'opacity-40 pointer-events-none grayscale' : ''}`}>
                                            <div className="grid lg:grid-cols-4 gap-6">
                                                <div className="lg:col-span-3 space-y-2.5">
                                                    <label className="text-sm font-bold text-gray-700">Duyuru Metni</label>
                                                    <input {...register('announcement_text')} className="w-full px-5 py-3.5 text-sm bg-white border border-gray-200/80 rounded-md focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all hover:border-gray-300" placeholder="Kayıtlarımız başlamıştır!..." />
                                                </div>
                                                <div className="space-y-2.5">
                                                    <label className="text-sm font-bold text-gray-700">Arka Plan</label>
                                                    <div className="flex items-center gap-3 bg-white p-2.5 rounded-md border border-gray-200/80 w-full hover:border-gray-300 transition-colors">
                                                        <input type="color" {...register('announcement_color')} className="w-8 h-8 rounded-lg cursor-pointer bg-white shrink-0 border-0" />
                                                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wide truncate">{watch('announcement_color')}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 pt-6 border-t border-blue-200/50">
                                                <div className="flex items-center gap-4 bg-white p-4 rounded-md border border-gray-200/80 shadow-sm hover:border-blue-300 transition-colors">
                                                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                                                        <input type="checkbox" {...register('announcement_marquee')} className="sr-only peer" />
                                                        <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                                                    </label>
                                                    <div>
                                                        <span className="text-sm font-bold text-gray-800 block">Kayan Yazı</span>
                                                        <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider mt-0.5">Marquee Animasyonu</span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-4 bg-white p-3 rounded-md border border-gray-200/80 shadow-sm hover:border-blue-300 transition-colors">
                                                    <input type="color" {...register('announcement_text_color')} className="w-10 h-10 rounded-lg cursor-pointer bg-white shrink-0 border-0" />
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-gray-800 block">Metin Rengi</span>
                                                        <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider mt-0.5">{watch('announcement_text_color')}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-8 bg-white border border-gray-100/80 shadow-sm hover:shadow-md transition-shadow rounded-lg space-y-6 shadow-sm">
                                        <h3 className="text-lg font-extrabold text-green-900 flex items-center gap-3">
                                            <span className="w-10 h-10 rounded-lg bg-[#edf1f1] text-[#204544] flex items-center justify-center shadow-sm">
                                                <i className="fas fa-chart-pie"></i>
                                            </span>
                                            Analiz ve İzleme (Analytics)
                                        </h3>
                                        <p className="text-sm text-green-800 font-medium">Sitendeki trafiği analiz etmek için doğrudan kimliklerinizi (ID) girebilirsiniz.</p>

                                        <div className="grid md:grid-cols-2 gap-6 mt-4">
                                            <div className="space-y-2.5">
                                                <label className="text-sm font-bold text-green-900">Google Analytics ID</label>
                                                <input
                                                    {...register('google_analytics_id')}
                                                    className="w-full px-5 py-3.5 text-sm bg-white/80 border border-green-200 rounded-md focus:outline-none focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all backdrop-blur-sm"
                                                    placeholder="Örn: G-XXXXXXXXXX"
                                                />
                                                <p className="text-xs text-green-700 font-medium opacity-80">G- ile başlar. Boş bırakırsanız çalışmaz.</p>
                                            </div>
                                            <div className="space-y-2.5">
                                                <label className="text-sm font-bold text-green-900">Meta/Facebook Pixel ID</label>
                                                <input
                                                    {...register('meta_pixel_id')}
                                                    className="w-full px-5 py-3.5 text-sm bg-white/80 border border-green-200 rounded-md focus:outline-none focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all backdrop-blur-sm"
                                                    placeholder="Örn: 123456789012345"
                                                />
                                                <p className="text-xs text-green-700 font-medium opacity-80">Rakamlardan oluşur. Boş bırakırsanız çalışmaz.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ─── How It Works Tab ─── */}
                            {activeTab === 'design' && (
                                <div className="space-y-8 animate-fadeIn">
                                    {/* Section Header Settings */}
                                    <div className="bg-white p-8 rounded-lg border border-gray-100/80 shadow-sm hover:shadow-md transition-shadow">
                                        <h3 className="text-xl font-extrabold text-gray-900 mb-6 flex items-center gap-3 pb-4 border-b border-gray-100">
                                            <span className="flex items-center justify-center w-12 h-12 rounded-lg bg-[#edf1f1] text-[#204544]">
                                                <i className="fas fa-list-ol text-xl"></i>
                                            </span>
                                            &quot;Nasıl Çalışır&quot; Bölümü
                                        </h3>
                                        <p className="text-sm text-gray-500 -mt-2 mb-6">
                                            Ana sayfadaki adım adım açıklama bölümünü buradan düzenleyebilirsiniz. Boş bırakılan alanlarda varsayılan içerik gösterilir.
                                        </p>

                                        <div className="grid md:grid-cols-2 gap-6">
                                            <div className="space-y-2.5">
                                                <label className="text-sm font-bold text-gray-700">Bölüm Başlığı</label>
                                                <input
                                                    {...register('how_it_works_title' as any)}
                                                    className="w-full px-5 py-3.5 text-sm bg-gray-50 border border-gray-200/80 rounded-md focus:outline-none focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary transition-all hover:border-gray-300 focus:bg-white"
                                                    placeholder="Eğitim süreciniz nasıl ilerler:"
                                                />
                                            </div>
                                            <div className="space-y-2.5">
                                                <label className="text-sm font-bold text-gray-700">Bölüm Alt Başlığı</label>
                                                <input
                                                    {...register('how_it_works_subtitle' as any)}
                                                    className="w-full px-5 py-3.5 text-sm bg-gray-50 border border-gray-200/80 rounded-md focus:outline-none focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary transition-all hover:border-gray-300 focus:bg-white"
                                                    placeholder="Birkaç basit adımda öğrenmeye başlayın."
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Steps Cards */}
                                    <div className="bg-white p-8 rounded-lg border border-gray-100/80 shadow-sm hover:shadow-md transition-shadow">
                                        <h4 className="text-lg font-extrabold text-gray-900 mb-2 flex items-center gap-3 pb-4 border-b border-gray-100">
                                            <span className="flex items-center justify-center w-10 h-10 rounded-lg bg-[#edf1f1] text-[#204544]">
                                                <i className="fas fa-shoe-prints text-lg"></i>
                                            </span>
                                            Adımlar (3 Adım)
                                        </h4>
                                        <p className="text-xs text-gray-400 font-medium mb-6">
                                            Başlık &amp; açıklama boş bırakılırsa varsayılan metin kullanılır. Görsel yüklemezseniz otomatik ikon gösterilir.
                                        </p>

                                        <div className="grid lg:grid-cols-3 gap-6">
                                            {[0, 1, 2].map((index) => {
                                                const stepImageUrl = watch(`how_it_works_section.${index}.image` as any);
                                                return (
                                                    <div
                                                        key={index}
                                                        className="p-6 bg-gray-50/50 rounded-lg border border-gray-200/80 space-y-5 hover:border-brand-primary/30 hover:bg-white transition-colors group"
                                                    >
                                                        {/* Step badge + label */}
                                                        <h5 className="text-sm font-extrabold text-gray-900 flex items-center gap-3">
                                                            <span
                                                                className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black shadow-sm group-hover:scale-110 transition-transform bg-brand-primary text-white"
                                                            >
                                                                {index + 1}
                                                            </span>
                                                            Adım {index + 1}
                                                        </h5>

                                                        {/* Title */}
                                                        <div className="space-y-2">
                                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Adım Başlığı</label>
                                                            <input
                                                                {...register(`how_it_works_section.${index}.title` as any)}
                                                                className="w-full px-4 py-3 text-sm bg-white border border-gray-200/80 rounded-md focus:outline-none focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary hover:border-gray-300 transition-all"
                                                                placeholder={[
                                                                    'Akademik Kadromuzu İnceleyin',
                                                                    'Canlı Derslerle Dile Hakim Olun',
                                                                    'Başarınızı Somutlaştırın'
                                                                ][index]}
                                                            />
                                                        </div>

                                                        {/* Description */}
                                                        <div className="space-y-2">
                                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Açıklama</label>
                                                            <textarea
                                                                {...register(`how_it_works_section.${index}.description` as any)}
                                                                rows={3}
                                                                className="w-full px-4 py-3 text-sm bg-white border border-gray-200/80 rounded-md focus:outline-none focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary hover:border-gray-300 resize-none transition-all"
                                                                placeholder={[
                                                                    'Dil hedeflerinize ve öğrenme hızınıza en uygun, alanında uzman eğitmeni...',
                                                                    'Modern dijital sınıflarımızda, sadece size özel hazırlanan müfredat ile...',
                                                                    'Düzenli gelişim raporları ve başarı sertifikaları ile eğitim yolculuğunuzu...'
                                                                ][index]}
                                                            />
                                                        </div>

                                                        {/* Image upload */}
                                                        <div className="space-y-2 pt-3 border-t border-gray-100">
                                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                                                <i className="fas fa-image text-brand-primary"></i>
                                                                Özel Görsel <span className="normal-case font-normal text-gray-400">(isteğe bağlı)</span>
                                                            </label>

                                                            {/* Preview */}
                                                            {stepImageUrl && (
                                                                <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden border border-gray-200 mb-2">
                                                                    <img
                                                                        src={stepImageUrl}
                                                                        alt={`Adım ${index + 1}`}
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setValue(`how_it_works_section.${index}.image` as any, '')}
                                                                        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors shadow-md text-xs"
                                                                    >
                                                                        <i className="fas fa-times"></i>
                                                                    </button>
                                                                </div>
                                                            )}

                                                            <label className={`cursor-pointer flex items-center gap-2 px-4 py-2.5 rounded-md border text-xs font-bold transition-all
                                                                ${stepImageUrl
                                                                    ? 'border-gray-200 text-gray-500 hover:text-brand-primary hover:border-brand-primary/30'
                                                                    : 'border-dashed border-gray-300 text-gray-500 hover:border-brand-primary hover:text-brand-primary hover:bg-brand-primary/5'
                                                                }`}>
                                                                <i className="fas fa-cloud-upload-alt text-base"></i>
                                                                {stepImageUrl ? 'Görseli Değiştir' : 'Görsel Yükle'}
                                                                {uploading && <span className="ml-auto text-amber-500 animate-pulse">Yükleniyor...</span>}
                                                                <input
                                                                    type="file"
                                                                    accept="image/*"
                                                                    onChange={(e) => handleFileUpload(e, `how_it_works_section.${index}.image`)}
                                                                    className="hidden"
                                                                />
                                                            </label>
                                                            <p className="text-[11px] text-gray-400">
                                                                Boş bırakılırsa otomatik ikon gösterilir · Tüm Formatlar · Yüksek Kalite Oto-Sıkıştırma
                                                            </p>
                                                            <input type="hidden" {...register(`how_it_works_section.${index}.image` as any)} />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            )}


                            {/* ────────────────────────────────────────────────
                                TAB: Marka Renkleri
                            ──────────────────────────────────────────────── */}
                            {activeTab === 'design' && (() => {
                                const primaryColor = watch('brand_primary_color') || '#204544'
                                const accentColor = watch('brand_accent_color') || '#FEDD59'
                                return (
                                    <div className="space-y-8">
                                        <div>
                                            <h2 className="text-xl font-bold text-gray-900 mb-1">Marka Renkleri</h2>
                                            <p className="text-sm text-gray-500 mb-6">
                                                Platformun ana renk paletini buradan özelleştirin. Değişiklikler kaydedildikten sonra tüm sayfalara otomatik olarak uygulanır.
                                            </p>

                                            {/* Live Preview Card */}
                                            <div className="rounded-lg border border-gray-200 overflow-hidden shadow-sm mb-8">
                                                <div className="px-5 py-4 text-sm font-semibold text-gray-600 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
                                                    <i className="fas fa-eye text-gray-400"></i>
                                                    Canlı Ön İzleme
                                                </div>
                                                <div className="p-6 bg-white flex flex-col sm:flex-row gap-4 items-stretch">
                                                    {/* Navbar preview */}
                                                    <div className="flex-1 rounded-lg overflow-hidden border border-gray-100 shadow-sm">
                                                        <div className="px-4 py-3 flex items-center gap-3" style={{ backgroundColor: primaryColor }}>
                                                            <div className="w-6 h-6 rounded-full bg-white/30"></div>
                                                            <span className="text-white text-sm font-bold">Beyan Dil Akademi</span>
                                                            <div className="ml-auto px-3 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: accentColor, color: '#1a1a1a' }}>
                                                                Aktif
                                                            </div>
                                                        </div>
                                                        <div className="p-4 bg-gray-50 space-y-2">
                                                            <div className="h-2 rounded bg-gray-200 w-3/4"></div>
                                                            <div className="h-2 rounded bg-gray-200 w-1/2"></div>
                                                            <div className="mt-3 inline-flex px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: primaryColor }}>
                                                                Giriş Yap
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {/* Color swatches */}
                                                    <div className="flex sm:flex-col gap-3 justify-center">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-12 h-12 rounded-lg shadow-md border border-gray-200 flex-shrink-0" style={{ backgroundColor: primaryColor }}></div>
                                                            <div>
                                                                <p className="text-xs font-semibold text-gray-700">Primary</p>
                                                                <p className="text-xs text-gray-400 font-mono">{primaryColor}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-12 h-12 rounded-lg shadow-md border border-gray-200 flex-shrink-0" style={{ backgroundColor: accentColor }}></div>
                                                            <div>
                                                                <p className="text-xs font-semibold text-gray-700">Accent</p>
                                                                <p className="text-xs text-gray-400 font-mono">{accentColor}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Color Pickers */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {/* Primary Color */}
                                                <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm space-y-4">
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <h3 className="font-semibold text-gray-800 text-sm">Ana Renk (Primary)</h3>
                                                            <p className="text-xs text-gray-500 mt-0.5">Navbar, butonlar, başlıklar</p>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => setValue('brand_primary_color', '#204544')}
                                                            className="text-xs text-gray-400 hover:text-gray-600 underline transition-colors"
                                                        >
                                                            Varsayılan
                                                        </button>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <div className="relative">
                                                            <input
                                                                type="color"
                                                                {...register('brand_primary_color')}
                                                                className="w-14 h-14 rounded-lg cursor-pointer border-2 border-gray-200 p-0.5 bg-transparent"
                                                                style={{ colorScheme: 'light' }}
                                                            />
                                                        </div>
                                                        <div className="flex-1">
                                                            <label className="text-xs text-gray-500 font-medium mb-1 block">Hex Kodu</label>
                                                            <input
                                                                type="text"
                                                                placeholder="#204544"
                                                                maxLength={7}
                                                                {...register('brand_primary_color')}
                                                                className="w-full px-3 py-2 text-sm font-mono border border-gray-200 rounded-lg focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20"
                                                            />
                                                            {errors.brand_primary_color && (
                                                                <p className="text-xs text-red-500 mt-1">{errors.brand_primary_color.message as string}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {/* Darker variants preview */}
                                                    <div className="flex gap-2 pt-1">
                                                        {['ff', 'cc', '99', '66', '33'].map((opacity, i) => (
                                                            <div key={i} className="flex-1 h-6 rounded" style={{ backgroundColor: primaryColor, opacity: (5 - i) * 0.2 + 0.2 }}></div>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Accent Color */}
                                                <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm space-y-4">
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <h3 className="font-semibold text-gray-800 text-sm">Vurgu Rengi (Accent)</h3>
                                                            <p className="text-xs text-gray-500 mt-0.5">Rozetler, vurgular, aktif öğeler</p>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => setValue('brand_accent_color', '#FEDD59')}
                                                            className="text-xs text-gray-400 hover:text-gray-600 underline transition-colors"
                                                        >
                                                            Varsayılan
                                                        </button>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <div className="relative">
                                                            <input
                                                                type="color"
                                                                {...register('brand_accent_color')}
                                                                className="w-14 h-14 rounded-lg cursor-pointer border-2 border-gray-200 p-0.5 bg-transparent"
                                                                style={{ colorScheme: 'light' }}
                                                            />
                                                        </div>
                                                        <div className="flex-1">
                                                            <label className="text-xs text-gray-500 font-medium mb-1 block">Hex Kodu</label>
                                                            <input
                                                                type="text"
                                                                placeholder="#FEDD59"
                                                                maxLength={7}
                                                                {...register('brand_accent_color')}
                                                                className="w-full px-3 py-2 text-sm font-mono border border-gray-200 rounded-lg focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20"
                                                            />
                                                            {errors.brand_accent_color && (
                                                                <p className="text-xs text-red-500 mt-1">{errors.brand_accent_color.message as string}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2 pt-1">
                                                        {['ff', 'cc', '99', '66', '33'].map((opacity, i) => (
                                                            <div key={i} className="flex-1 h-6 rounded" style={{ backgroundColor: accentColor, opacity: (5 - i) * 0.2 + 0.2 }}></div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Reset All */}
                                            <div className="flex justify-end mt-4">
                                                <button
                                                    type="button"
                                                    onClick={() => { setValue('brand_primary_color', '#204544'); setValue('brand_accent_color', '#FEDD59') }}
                                                    className="text-sm text-gray-500 hover:text-red-500 transition-colors flex items-center gap-2"
                                                >
                                                    <i className="fas fa-rotate-left text-xs"></i>
                                                    Tüm Renkleri Varsayılana Sıfırla
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })()}
                        </form>
                    )}
                </div>
            </div>
        </div>
    )
}
