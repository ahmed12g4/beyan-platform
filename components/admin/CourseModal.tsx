'use client'

import { useState, useEffect } from 'react'
import { CourseInput, courseSchema } from '@/lib/validations/schemas'
import {
    createAdminCourseAction,
    updateAdminCourseAction,
    getFreeCourseEnrollments,
    grantFreeCourseAccess,
    revokeFreeCourseAccess,
    searchStudents
} from '@/lib/actions/admin-course'
import { toast } from 'react-hot-toast'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

const slugify = (text: string) => {
    const trMap: { [key: string]: string } = {
        'ç': 'c', 'ğ': 'g', 'ı': 'i', 'ö': 'o', 'ş': 's', 'ü': 'u',
        'Ç': 'c', 'Ğ': 'g', 'İ': 'i', 'Ö': 'o', 'Ş': 's', 'Ü': 'u'
    };
    return text
        .toString()
        .split('')
        .map(c => trMap[c] || c)
        .join('')
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
}

interface CourseModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
    course?: any // If providing, it's edit mode
    teachers: any[]
    defaultTab?: 'edit' | 'free'
}

export default function CourseModal({ isOpen, onClose, onSuccess, course, teachers, defaultTab = 'edit' }: CourseModalProps) {
    const isEdit = !!course
    const [loading, setLoading] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [activeTab, setActiveTab] = useState<'edit' | 'free'>(defaultTab)

    // Edit Form State
    const [formData, setFormData] = useState<Partial<CourseInput>>({
        title: '',
        slug: '',
        description: '',
        course_type: 'GENERAL',
        price: 0,
        level: 'A1',
        duration_weeks: 4,
        color: '#204544',
        is_published: true,
        thumbnail_url: '',
        max_students: 20
    })
    const [teacherId, setTeacherId] = useState('')

    // Free Access State
    const [studentSearch, setStudentSearch] = useState('')
    const [searchResults, setSearchResults] = useState<any[]>([])
    const [freeEnrollments, setFreeEnrollments] = useState<any[]>([])
    const [searchLoading, setSearchLoading] = useState(false)
    const [grantingId, setGrantingId] = useState<string | null>(null)

    useEffect(() => {
        if (isOpen) {
            setActiveTab(defaultTab)
            if (course) {
                setFormData({
                    title: course.title || '',
                    slug: course.slug || '',
                    description: course.description || '',
                    course_type: course.course_type || 'GENERAL',
                    price: course.price || 0,
                    level: course.level || 'A1',
                    duration_weeks: course.duration_weeks || 4,
                    color: course.color || '#204544',
                    is_published: course.is_published ?? true,
                    thumbnail_url: course.thumbnail_url || '',
                    max_students: course.max_students || 20
                })
                setTeacherId(course.teacher_id || '')
                fetchFreeEnrollments()
            } else {
                setFormData({
                    title: '',
                    slug: '',
                    description: '',
                    course_type: 'GENERAL',
                    price: 0,
                    level: 'A1',
                    duration_weeks: 4,
                    color: '#204544',
                    is_published: true,
                    thumbnail_url: '',
                    max_students: 20
                })
                setTeacherId('')
                setFreeEnrollments([])
            }
            setStudentSearch('')
            setSearchResults([])
        }
    }, [course, isOpen, defaultTab])

    const fetchFreeEnrollments = async () => {
        if (!course?.id) return
        const data = await getFreeCourseEnrollments(course.id)
        setFreeEnrollments(data)
    }

    const handleSearch = async (query: string) => {
        setStudentSearch(query)
        if (query.length < 3) {
            setSearchResults([])
            return
        }
        setSearchLoading(true)
        const results = await searchStudents(query)
        setSearchResults(results)
        setSearchLoading(false)
    }

    const handleGrantAccess = async (studentId: string) => {
        if (!course?.id) return
        setGrantingId(studentId)
        try {
            const result = await grantFreeCourseAccess(course.id, studentId, course.title)
            if (result.success) {
                toast.success('Erişim verildi')
                setStudentSearch('')
                setSearchResults([])
                fetchFreeEnrollments()
            } else {
                toast.error(result.error || 'Hata oluştu')
            }
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setGrantingId(null)
        }
    }

    const handleRevokeAccess = async (enrollmentId: string, studentId: string) => {
        if (!course?.id) return
        try {
            const result = await revokeFreeCourseAccess(enrollmentId, studentId, course.title)
            if (result.success) {
                toast.success('Erişim kaldırıldı')
                fetchFreeEnrollments()
            } else {
                toast.error(result.error || 'Hata oluştu')
            }
        } catch (error: any) {
            toast.error(error.message)
        }
    }

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        try {
            setUploading(true)
            const supabase = createClient()
            const fileExt = file.name.split('.').pop()
            const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`
            const filePath = `${fileName}`

            const { data, error: uploadError } = await supabase.storage
                .from('courses')
                .upload(filePath, file)

            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage
                .from('courses')
                .getPublicUrl(filePath)

            setFormData(prev => ({ ...prev, thumbnail_url: publicUrl }))
            toast.success('Görsel yüklendi')
        } catch (error: any) {
            toast.error('Görsel yüklenemedi: ' + error.message)
        } finally {
            setUploading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!teacherId) {
            toast.error('Lütfen bir eğitmen seçin')
            return
        }

        setLoading(true)
        try {
            const result = isEdit
                ? await updateAdminCourseAction(course.id, formData as CourseInput, teacherId)
                : await createAdminCourseAction(formData as CourseInput, teacherId)

            if (result.success) {
                toast.success(result.message || 'İşlem başarılı')
                onSuccess()
                onClose()
            } else {
                toast.error(result.error || 'Bir hata oluştu')
            }
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white z-10">
                    <h2 className="text-xl font-black text-brand-primary uppercase tracking-tight">
                        {isEdit ? 'Kurs Yönetimi' : 'Yeni Kurs Ekle'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <i className="fas fa-times text-lg"></i>
                    </button>
                </div>

                {isEdit && (
                    <div className="flex border-b border-gray-100 px-6">
                        <button
                            onClick={() => setActiveTab('edit')}
                            className={`px-4 py-3 text-xs font-black uppercase tracking-widest border-b-2 transition-all ${activeTab === 'edit' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                        >
                            Bilgileri Düzenle
                        </button>
                        <button
                            onClick={() => setActiveTab('free')}
                            className={`px-4 py-3 text-xs font-black uppercase tracking-widest border-b-2 transition-all ${activeTab === 'free' ? 'border-indigo-500 text-indigo-500' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                        >
                            Ücretsiz Erişimler
                        </button>
                    </div>
                )}

                <div className="flex-1 overflow-y-auto">
                    {activeTab === 'edit' ? (
                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            {/* Thumbnail Upload */}
                            <div className="space-y-2">
                                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest">Kurs Görseli</label>
                                <div className="flex items-center gap-6">
                                    <div className="w-32 h-32 bg-gray-50 rounded-xl overflow-hidden border-2 border-dashed border-gray-200 flex items-center justify-center relative group">
                                        {formData.thumbnail_url ? (
                                            <Image src={formData.thumbnail_url} alt="Preview" fill className="object-cover" />
                                        ) : (
                                            <i className="fas fa-image text-3xl text-gray-200"></i>
                                        )}
                                        {uploading && (
                                            <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                                                <i className="fas fa-spinner fa-spin text-brand-primary"></i>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                            className="hidden"
                                            id="thumbnail-upload"
                                            disabled={uploading}
                                        />
                                        <label
                                            htmlFor="thumbnail-upload"
                                            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-50 text-gray-700 rounded-lg text-xs font-bold border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors"
                                        >
                                            <i className="fas fa-upload"></i>
                                            Görsel Seç
                                        </label>
                                        <p className="mt-2 text-[10px] text-gray-400 font-medium">Önerilen boyut: 800x600px. Max: 2MB.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Title */}
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-black text-gray-500 uppercase tracking-widest">Kurs Başlığı</label>
                                    <input
                                        required
                                        value={formData.title}
                                        onChange={e => {
                                            const val = e.target.value;
                                            setFormData(prev => ({
                                                ...prev,
                                                title: val,
                                                slug: (!prev.slug || prev.slug === slugify(prev.title || '')) ? slugify(val) : prev.slug
                                            }))
                                        }}
                                        placeholder="Örn: Modern Arapça Başlangıç"
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary outline-none transition-all text-sm font-medium"
                                    />
                                </div>

                                {/* Slug */}
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-black text-gray-500 uppercase tracking-widest">Slug (URL)</label>
                                    <input
                                        required
                                        value={formData.slug}
                                        onChange={e => setFormData(prev => ({ ...prev, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') }))}
                                        placeholder="modern-arapca-baslangic"
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary outline-none transition-all text-sm font-medium"
                                    />
                                </div>

                                {/* Teacher Select */}
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-black text-gray-500 uppercase tracking-widest">Eğitmen</label>
                                    <select
                                        required
                                        value={teacherId}
                                        onChange={e => setTeacherId(e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary outline-none transition-all text-sm font-medium"
                                    >
                                        <option value="">Eğitmen Seçin</option>
                                        {teachers.map(t => (
                                            <option key={t.id} value={t.id}>{t.full_name}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Category */}
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-black text-gray-500 uppercase tracking-widest">Kategori</label>
                                    <select
                                        required
                                        value={formData.course_type}
                                        onChange={e => setFormData(prev => ({ ...prev, course_type: e.target.value as any }))}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary outline-none transition-all text-sm font-medium"
                                    >
                                        <option value="GENERAL">Genel</option>
                                        <option value="CONVERSATION">Pratik</option>
                                        <option value="BUSINESS">İş Arapçası</option>
                                        <option value="GRAMMAR">Nahiv / Sarf</option>
                                        <option value="QURAN">Kur'an</option>
                                        <option value="VOCABULARY">Kelime</option>
                                    </select>
                                </div>

                                {/* Price */}
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-black text-gray-500 uppercase tracking-widest">Fiyat (TL)</label>
                                    <input
                                        type="number"
                                        required
                                        value={formData.price}
                                        onChange={e => setFormData(prev => ({ ...prev, price: Number(e.target.value) }))}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary outline-none transition-all text-sm font-medium"
                                    />
                                </div>

                                {/* Max Students */}
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-black text-gray-500 uppercase tracking-widest">Kontenjan</label>
                                    <input
                                        type="number"
                                        value={formData.max_students || ''}
                                        onChange={e => setFormData(prev => ({ ...prev, max_students: Number(e.target.value) }))}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary outline-none transition-all text-sm font-medium"
                                    />
                                </div>
                            </div>

                            {/* Description */}
                            <div className="space-y-1.5">
                                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest">Kurs Açıklaması</label>
                                <textarea
                                    rows={4}
                                    value={formData.description || ''}
                                    onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary outline-none transition-all text-sm font-medium resize-none"
                                />
                            </div>

                            <div className="flex items-center gap-4 pt-4 border-t border-gray-50">
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={formData.is_published}
                                        onChange={e => setFormData(prev => ({ ...prev, is_published: e.target.checked }))}
                                        className="w-5 h-5 rounded border-gray-300 text-brand-primary focus:ring-brand-primary transition-all"
                                    />
                                    <span className="text-xs font-black text-gray-700 uppercase tracking-widest group-hover:text-brand-primary transition-colors">Hemen Yayınla</span>
                                </label>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 sticky bottom-0 bg-white z-10">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-6 py-3 border-2 border-gray-100 text-gray-500 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-gray-50 transition-all active:scale-95"
                                >
                                    İptal
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-8 py-3 bg-brand-primary text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-brand-primary/20 hover:bg-brand-primary-dark hover:-translate-y-0.5 transition-all disabled:opacity-50 active:scale-95 flex items-center gap-2"
                                >
                                    {loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-check"></i>}
                                    {isEdit ? 'Değişiklikleri Kaydet' : 'Kursu Oluştur'}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="p-6 space-y-6">
                            {/* Student Search */}
                            <div className="space-y-2">
                                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest">Öğrenci Ekle</label>
                                <div className="relative">
                                    <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-300"></i>
                                    <input
                                        type="text"
                                        placeholder="İsim veya e-posta ile ara..."
                                        value={studentSearch}
                                        onChange={e => handleSearch(e.target.value)}
                                        className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all text-sm font-medium"
                                    />
                                    {searchLoading && (
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                            <i className="fas fa-spinner fa-spin text-gray-400"></i>
                                        </div>
                                    )}
                                </div>

                                {/* Search Results Dropdown */}
                                {searchResults.length > 0 && (
                                    <div className="mt-2 bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden animate-slideDown max-h-60 overflow-y-auto z-20">
                                        {searchResults.map(student => (
                                            <div key={student.id} className="p-3 hover:bg-gray-50 flex items-center justify-between border-b border-gray-50 last:border-0">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 overflow-hidden relative border border-gray-200">
                                                        {student.avatar_url ? (
                                                            <Image src={student.avatar_url} alt={student.full_name} fill className="object-cover" />
                                                        ) : (
                                                            <i className="fas fa-user"></i>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-gray-900">{student.full_name}</span>
                                                        <span className="text-[10px] text-gray-400 font-medium">{student.email}</span>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleGrantAccess(student.id)}
                                                    disabled={grantingId === student.id}
                                                    className="px-4 py-1.5 bg-indigo-500 text-white rounded-lg text-xs font-black uppercase tracking-widest hover:bg-indigo-600 transition-all active:scale-95 disabled:opacity-50"
                                                >
                                                    {grantingId === student.id ? <i className="fas fa-spinner fa-spin"></i> : 'Erişim Ver'}
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Current Free Enrollments */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                    <i className="fas fa-users text-indigo-400"></i>
                                    Erişimi Olan Öğrenciler ({freeEnrollments.length})
                                </h3>

                                <div className="space-y-2">
                                    {freeEnrollments.length === 0 ? (
                                        <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                            <i className="fas fa-gift text-2xl text-gray-200 mb-2"></i>
                                            <p className="text-sm text-gray-400 font-medium">Henüz ücretsiz erişim verilmiş öğrenci yok.</p>
                                        </div>
                                    ) : (
                                        freeEnrollments.map(enrollment => (
                                            <div key={enrollment.id} className="p-4 bg-white border border-gray-100 rounded-xl flex items-center justify-between group hover:border-indigo-200 transition-all shadow-sm">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 overflow-hidden relative border border-gray-100">
                                                        {enrollment.student.avatar_url ? (
                                                            <Image src={enrollment.student.avatar_url} alt={enrollment.student.full_name} fill className="object-cover" />
                                                        ) : (
                                                            <i className="fas fa-user text-lg"></i>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-gray-900">{enrollment.student.full_name}</span>
                                                        <span className="text-[11px] text-indigo-500 font-bold uppercase tracking-tight">Kayıt: {new Date(enrollment.enrolled_at).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleRevokeAccess(enrollment.id, enrollment.student.id)}
                                                    className="w-10 h-10 flex items-center justify-center rounded-lg bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all group-hover:opacity-100"
                                                    title="Erişimi Kaldır"
                                                >
                                                    <i className="fas fa-trash-alt text-xs"></i>
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-end pt-4 sticky bottom-0 bg-white z-10">
                                <button
                                    onClick={onClose}
                                    className="px-8 py-3 border-2 border-gray-100 text-gray-500 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-gray-50 transition-all active:scale-95"
                                >
                                    Kapat
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
