'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { courseSchema, CourseInput } from '@/lib/validations/schemas'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { createCourseAction, updateCourseAction } from '@/lib/actions/courses'
import imageCompression from 'browser-image-compression'


interface CourseFormProps {
    initialData?: CourseInput & { id?: string }
    isEditing?: boolean
    teacherId: string
}

export default function CourseForm({ initialData, isEditing = false, teacherId }: CourseFormProps) {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)

    const form = useForm<CourseInput>({
        resolver: zodResolver(courseSchema),
        defaultValues: initialData || {
            title: '',
            slug: '',
            description: '',
            level: 'A1',
            course_type: 'GENERAL',
            price: 0,
            duration_weeks: 12,
            schedule: '',
            color: '#204544',
            is_published: false,
            max_students: 20
        }
    })

    const { register, handleSubmit, formState: { errors }, watch, setValue } = form

    // Auto-generate slug from title if not editing
    const title = watch('title')
    const currentSlug = watch('slug')

    // Use useEffect to avoid "Too many re-renders"
    // Only update if: not editing, title exists, slug is empty OR slug was auto-generated from previous title
    // But for simplicity, let's just do it if not editing and slug is empty


    // We use a useEffect to listen to title changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const [lastAutoSlug, setLastAutoSlug] = useState('')

    // Using useEffect to handle side effects


    useEffect(() => {
        if (isEditing || !title) return

        const newSlug = title
            .toLowerCase()
            .replace(/ /g, '-')
            .replace(/[^\w-]+/g, '')

        // Only update if the current slug is empty or matches the previous auto-generated one
        // This allows user to manually override it without it being overwritten
        if (!currentSlug || currentSlug === lastAutoSlug) {
            setValue('slug', newSlug)
            setLastAutoSlug(newSlug)
        }
    }, [title, isEditing, setValue, currentSlug, lastAutoSlug])



    const onSubmit = async (data: CourseInput) => {
        setIsLoading(true)

        try {
            let result;

            if (isEditing && initialData?.id) {
                // Update
                result = await updateCourseAction(initialData.id, data)
            } else {
                // Create — teacherId is obtained from auth session automatically
                result = await createCourseAction(data)
            }

            if (!result.success) {
                toast.error(result.error || 'Bir hata oluştu')
                console.error('Course Action Failed:', result.error)
                return
            }

            toast.success(result.message || 'İşlem başarılı!')

            if (!isEditing) {
                router.push('/teacher/courses')
            }
            router.refresh()

        } catch (error: any) {
            console.error('Unexpected Submit Error:', error)
            toast.error('Beklenmedik bir hata oluştu.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 animate-fadeIn">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-6">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">
                        {isEditing ? 'Kursu Düzenle' : 'Yeni Kurs Oluştur'}
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                        {isEditing ? 'Mevcut kurs bilgilerini güncelleyin.' : 'Yeni bir eğitim programı başlatın.'}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Link
                        href="/teacher/courses"
                        className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                    >
                        İptal
                    </Link>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="px-6 py-2 bg-brand-primary text-white rounded-lg text-sm font-bold hover:bg-brand-primary-dark transition-all shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed min-w-[140px] justify-center"
                    >
                        {isLoading ? (
                            <div className="flex items-center gap-2">
                                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span>Kaydediliyor...</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <i className="fas fa-save"></i>
                                <span>{isEditing ? 'Kaydet' : 'Oluştur'}</span>
                            </div>
                        )}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Main Info */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Basic Info Card */}
                    <div className="bg-white p-6 rounded-lg border border-gray-100 shadow-sm">
                        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                            <span className="w-8 h-8 rounded-lg bg-brand-accent/20 flex items-center justify-center text-brand-primary">
                                <i className="fas fa-info"></i>
                            </span>
                            Temel Bilgiler
                        </h3>

                        <div className="space-y-6">
                            {/* Thumbnail Upload */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Kurs Fotoğrafı</label>
                                <div className="flex items-start gap-6">
                                    <div className="relative w-40 h-28 rounded-lg bg-gray-50 border-2 border-dashed border-gray-200 overflow-hidden flex items-center justify-center group shrink-0">
                                        {watch('thumbnail_url') ? (
                                            <>
                                                <img
                                                    src={watch('thumbnail_url') || ''}
                                                    alt="Thumbnail Preview"
                                                    className="w-full h-full object-cover"
                                                />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => setValue('thumbnail_url', '')}
                                                        className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                                                    >
                                                        <i className="fas fa-trash"></i>
                                                    </button>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="text-center p-4">
                                                <i className="fas fa-image text-gray-300 text-2xl mb-1"></i>
                                                <p className="text-[10px] text-gray-400">Görsel seçilmedi</p>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <input
                                            type="file"
                                            id="thumbnail-upload"
                                            className="hidden"
                                            accept="image/jpeg,image/png,image/webp"
                                            onChange={async (e) => {
                                                const file = e.target.files?.[0]
                                                if (!file) return

                                                if (file.size > 10 * 1024 * 1024) {
                                                    toast.error('Orijinal görsel boyutu 10MB\'dan küçük olmalı')
                                                    return
                                                }

                                                const loadingToast = toast.loading('Fotoğraf optimize ediliyor ve yükleniyor...')
                                                try {
                                                    const { createClient } = await import('@/lib/supabase/client')
                                                    const supabase = createClient()

                                                    // Auto-compress and convert to WebP
                                                    const options = {
                                                        maxSizeMB: 3, // Preserve high quality up to 3MB
                                                        maxWidthOrHeight: 2560, // Allow up to 2K resolution
                                                        useWebWorker: true,
                                                        alwaysKeepResolution: true, // Prevent aggressive downscaling
                                                        initialQuality: 0.85, // Balance out quality and size
                                                        fileType: 'image/webp' // Always convert to WebP
                                                    }

                                                    let fileToUpload = file;
                                                    try {
                                                        const compressedBlob = await imageCompression(file, options)
                                                        const newFileName = file.name.replace(/\.[^/.]+$/, "") + ".webp"
                                                        fileToUpload = new File([compressedBlob], newFileName, { type: 'image/webp' })
                                                    } catch (compressionError) {
                                                        console.error('Image compression failed, uploading original:', compressionError)
                                                    }

                                                    const ext = fileToUpload.name.split('.').pop()
                                                    const fileName = `${teacherId}/${Date.now()}.${ext}`

                                                    const { error: uploadError } = await supabase.storage
                                                        .from('course-thumbnails')
                                                        .upload(fileName, fileToUpload)

                                                    if (uploadError) throw uploadError

                                                    const { data: { publicUrl } } = supabase.storage
                                                        .from('course-thumbnails')
                                                        .getPublicUrl(fileName)

                                                    setValue('thumbnail_url', publicUrl)
                                                    toast.success('Fotoğraf yüklendi', { id: loadingToast })
                                                } catch (error: any) {
                                                    console.error('Upload Error:', error)
                                                    toast.error(`Yükleme hatası: ${error.message}`, { id: loadingToast })
                                                }
                                            }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => document.getElementById('thumbnail-upload')?.click()}
                                            className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-2 mb-2"
                                        >
                                            <i className="fas fa-cloud-upload-alt"></i>
                                            {watch('thumbnail_url') ? 'Fotoğrafı Değiştir' : 'Fotoğraf Seç'}
                                        </button>
                                        <p className="text-xs text-gray-500 leading-relaxed mb-2">
                                            Yüklenen görsel otomatik olarak yüksek kaliteli olarak kaydedilir.
                                        </p>
                                        <div className="inline-block px-2.5 py-1.5 border-2 border-amber-200 bg-amber-50 text-amber-800 text-[11px] font-bold rounded-md uppercase tracking-wider">
                                            📌 İdeal Boyut: 800x600px (Geniş Dikdörtgen, 16:9 Oranı)
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-100 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Kurs Başlığı</label>
                                    <input
                                        {...register('title')}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all outline-none"
                                        placeholder="Örn: Başlangıç Seviye Arapça"
                                    />
                                    {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">URL Yolu (Slug)</label>
                                    <input
                                        {...register('slug')}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all outline-none text-gray-600"
                                        placeholder="orn-baslangic-seviye-arapca"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Kurs sayfasının adresi olacak. Otomatik doldurulur, gerekirse düzenleyin.</p>
                                    {errors.slug && <p className="text-red-500 text-xs mt-1">{errors.slug.message}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
                                    <textarea
                                        {...register('description')}
                                        rows={4}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all outline-none resize-none"
                                        placeholder="Kursun içeriği hakkında detaylı bilgi verin..."
                                    />
                                    {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Details Card */}
                    <div className="bg-white p-6 rounded-lg border border-gray-100 shadow-sm">
                        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                            <span className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                                <i className="fas fa-list"></i>
                            </span>
                            Detaylar
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Seviye</label>
                                <select
                                    {...register('level')}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all outline-none"
                                >
                                    <option value="A1">A1 (Başlangıç)</option>
                                    <option value="A2">A2 (Temel)</option>
                                    <option value="B1">B1 (Orta)</option>
                                    <option value="B2">B2 (İyi)</option>
                                    <option value="C1">C1 (İleri)</option>
                                    <option value="C2">C2 (Uzman)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Kurs Türü</label>
                                <select
                                    {...register('course_type')}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all outline-none"
                                >
                                    <option value="GENERAL">Genel Arapça</option>
                                    <option value="CONVERSATION">Konuşma Pratiği</option>
                                    <option value="BUSINESS">İş Arapçası</option>
                                    <option value="GRAMMAR">Gramer / Dilbilgisi</option>
                                    <option value="QURAN">Kuran Arapçası</option>
                                    <option value="VOCABULARY">Kelime Bilgisi</option>
                                    <option value="OTHER">Diğer</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Süre (Hafta)</label>
                                <input
                                    type="number"
                                    {...register('duration_weeks', { valueAsNumber: true })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all outline-none"
                                />
                                {errors.duration_weeks && <p className="text-red-500 text-xs mt-1">{errors.duration_weeks.message}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Maksimum Öğrenci</label>
                                <input
                                    type="number"
                                    {...register('max_students', { valueAsNumber: true })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all outline-none"
                                />
                                {errors.max_students && <p className="text-red-500 text-xs mt-1">{errors.max_students.message}</p>}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Settings */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-lg border border-gray-100 shadow-sm">
                        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                            <span className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center text-green-600">
                                <i className="fas fa-cog"></i>
                            </span>
                            Ayarlar
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Fiyat (₺)</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">₺</span>
                                    <input
                                        type="number"
                                        {...register('price', { valueAsNumber: true })}
                                        className="w-full pl-8 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all outline-none font-bold text-gray-900"
                                        placeholder="0"
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-1">Ücretsiz kurs için 0 girin.</p>
                                {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price.message}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Program / Gün & Saat</label>
                                <input
                                    {...register('schedule')}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all outline-none"
                                    placeholder="Örn: Pzt-Çar 19:00"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Renk Teması</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="color"
                                        {...register('color')}
                                        className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer"
                                    />
                                    <span className="text-sm text-gray-500">{watch('color')}</span>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-100">
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        {...register('is_published')}
                                        className="w-5 h-5 rounded border-gray-300 text-brand-primary focus:ring-brand-primary cursor-pointer"
                                    />
                                    <div>
                                        <span className="block text-sm font-medium text-gray-900 group-hover:text-brand-primary transition-colors">Yayında</span>
                                        <span className="block text-xs text-gray-500">İşaretlenirse öğrenciler kursu görebilir.</span>
                                    </div>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </form>
    )
}
