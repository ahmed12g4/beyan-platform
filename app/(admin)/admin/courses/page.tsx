'use client'

import { useState, useEffect } from 'react'
import PageHeader from '@/components/admin/PageHeader'
import { getAdminCourses, deleteCourse, getAdminTeachers, toggleCoursePublish } from '@/lib/actions/admin-course'
import { toast } from 'react-hot-toast'
import Image from 'next/image'
import ConfirmModal from '@/components/ConfirmModal'
import CourseModal from '@/components/admin/CourseModal'

export default function AdminCoursesPage() {
    const [courses, setCourses] = useState<any[]>([])
    const [teachers, setTeachers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')

    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedCourse, setSelectedCourse] = useState<any>(null)
    const [deleteId, setDeleteId] = useState<string | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)
    const [modalTab, setModalTab] = useState<'edit' | 'free'>('edit')

    const fetchData = async () => {
        setLoading(true)
        try {
            const [coursesData, teachersData] = await Promise.all([
                getAdminCourses(),
                getAdminTeachers()
            ])
            setCourses(coursesData)
            setTeachers(teachersData)
        } catch (error) {
            toast.error('Veriler yüklenemedi')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    const handleDelete = async () => {
        if (!deleteId) return
        setIsDeleting(true)
        try {
            const result = await deleteCourse(deleteId)
            if (result.success) {
                toast.success('Kurs silindi')
                fetchData()
            } else {
                toast.error(result.error || 'Silme işlemi başarısız')
            }
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setIsDeleting(false)
            setDeleteId(null)
        }
    }

    const handleToggleStatus = async (courseId: string, currentStatus: boolean) => {
        try {
            const result = await toggleCoursePublish(courseId, currentStatus)
            if (result.success) {
                toast.success(result.message || 'Durum güncellendi')
                setCourses(prev => prev.map(c => c.id === courseId ? { ...c, is_published: !currentStatus } : c))
            } else {
                toast.error(result.error || 'İşlem başarısız')
            }
        } catch (error: any) {
            toast.error(error.message)
        }
    }

    const filteredCourses = courses.filter(c =>
        c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.slug.toLowerCase().includes(searchTerm.toLowerCase())
    )

    if (loading && courses.length === 0) {
        return (
            <div className="p-12 text-center">
                <div className="inline-block w-8 h-8 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin"></div>
                <p className="mt-4 text-gray-500 font-medium">Yükleniyor...</p>
            </div>
        )
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fadeIn">
            <PageHeader
                title="Kurs Yönetimi"
                subtitle={`${courses.length} kurs tanımlı`}
                icon="fa-graduation-cap"
                action={
                    <button
                        onClick={() => {
                            setSelectedCourse(null)
                            setIsModalOpen(true)
                        }}
                        className="px-6 py-3 bg-brand-primary text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-brand-primary/20 hover:bg-brand-primary-dark hover:-translate-y-0.5 transition-all active:scale-95 flex items-center gap-2"
                    >
                        <i className="fas fa-plus"></i>
                        Yeni Kurs Ekle
                    </button>
                }
            />

            {/* Search and Filters */}
            <div className="mt-8 mb-6">
                <div className="relative max-w-md group">
                    <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-brand-primary transition-colors"></i>
                    <input
                        type="text"
                        placeholder="Kurs ara..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-white border border-gray-100 rounded-xl shadow-sm focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary outline-none transition-all text-sm font-medium"
                    />
                </div>
            </div>

            {/* Courses Table */}
            <div className="bg-white rounded-2xl border border-gray-100/80 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[1000px]">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100/80">
                                <th className="px-6 py-4 text-[11px] font-black text-brand-primary uppercase tracking-widest">KURS DETAYI</th>
                                <th className="px-6 py-4 text-[11px] font-black text-brand-primary uppercase tracking-widest">EĞİTMEN</th>
                                <th className="px-6 py-4 text-[11px] font-black text-brand-primary uppercase tracking-widest">BİLGİ</th>
                                <th className="px-6 py-4 text-[11px] font-black text-brand-primary uppercase tracking-widest">DURUM</th>
                                <th className="px-6 py-4 text-[11px] font-black text-brand-primary uppercase tracking-widest text-right">İŞLEMLER</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredCourses.map((course) => (
                                <tr key={course.id} className="hover:bg-gray-50/50 transition-colors group">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-4">
                                            <div className="w-16 h-12 bg-gray-100 rounded-lg overflow-hidden relative flex-shrink-0 border border-gray-100 shadow-sm">
                                                {course.thumbnail_url ? (
                                                    <Image src={course.thumbnail_url} alt={course.title} fill className="object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                        <i className="fas fa-image text-lg"></i>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-[14px] font-bold text-gray-900 group-hover:text-brand-primary transition-colors truncate">{course.title}</span>
                                                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-tight mt-0.5">{course.course_type}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex flex-col">
                                            <span className="text-[13px] font-bold text-gray-700">{course.teacher?.full_name || 'Eğitmen Atanmamış'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2 text-[12px] font-bold text-gray-600">
                                                <i className="fas fa-money-bill-wave text-[10px] text-green-500"></i>
                                                {course.price} TL
                                            </div>
                                            <div className="flex items-center gap-2 text-[11px] font-bold text-gray-400">
                                                <i className="fas fa-users text-[10px] text-blue-400"></i>
                                                {course.participant_count} Öğrenci
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <button
                                            onClick={() => handleToggleStatus(course.id, course.is_published)}
                                            className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg border transition-all ${course.is_published
                                                ? 'bg-green-50 text-green-700 border-green-100 hover:bg-green-100'
                                                : 'bg-gray-50 text-gray-500 border-gray-100 hover:bg-gray-100'
                                                }`}
                                        >
                                            {course.is_published ? 'YAYINDA' : 'TASLAK'}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => {
                                                    setSelectedCourse(course)
                                                    setModalTab('free')
                                                    setIsModalOpen(true)
                                                }}
                                                className="w-10 h-10 flex items-center justify-center rounded-xl bg-white text-indigo-400 border border-gray-100 shadow-sm hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all active:scale-95"
                                                title="Ücretsiz Erişim Ver"
                                            >
                                                <i className="fas fa-gift text-xs"></i>
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setSelectedCourse(course)
                                                    setModalTab('edit')
                                                    setIsModalOpen(true)
                                                }}
                                                className="w-10 h-10 flex items-center justify-center rounded-xl bg-white text-gray-400 border border-gray-100 shadow-sm hover:bg-brand-primary hover:text-white hover:border-brand-primary transition-all active:scale-95"
                                                title="Düzenle"
                                            >
                                                <i className="fas fa-edit text-xs"></i>
                                            </button>
                                            <button
                                                onClick={() => setDeleteId(course.id)}
                                                className="w-10 h-10 flex items-center justify-center rounded-xl bg-white text-gray-400 border border-gray-100 shadow-sm hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-all active:scale-95"
                                                title="Sil"
                                            >
                                                <i className="fas fa-trash-alt text-xs"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredCourses.length === 0 && (
                    <div className="py-16 text-center">
                        <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-gray-300">
                            <i className="fas fa-search text-2xl"></i>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">Sonuç Bulunamadı</h3>
                        <p className="text-sm text-gray-500 font-medium">Başka bir arama terimi deneyin.</p>
                    </div>
                )}
            </div>

            <CourseModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchData}
                course={selectedCourse}
                teachers={teachers}
                defaultTab={modalTab}
            />

            <ConfirmModal
                isOpen={!!deleteId}
                isLoading={isDeleting}
                onClose={() => setDeleteId(null)}
                onConfirm={handleDelete}
                title="Kursu Sil"
                message="Bu kursu silmek istediğinize emin misiniz? Bu işlem ile birlikte kursa ait tüm kayıtlar da etkilenecektir."
                confirmText="Evet, Sil"
            />
        </div>
    )
}
