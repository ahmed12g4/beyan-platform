'use client'

import { useState, useEffect } from 'react'
import PageHeader from '@/components/admin/PageHeader'
import { getAdminGroups, deleteGroup } from '@/lib/actions/admin-groups'
import { getAdminTeachers } from '@/lib/actions/admin-course'
import { toast } from 'react-hot-toast'
import Image from 'next/image'
import ConfirmModal from '@/components/ConfirmModal'
import GroupModal from '@/components/admin/GroupModal'
import GroupStudentsModal from '@/components/admin/GroupStudentsModal'

export default function AdminGroupsPage() {
    const [groups, setGroups] = useState<any[]>([])
    const [teachers, setTeachers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')

    // Modal states
    const [isGroupModalOpen, setIsGroupModalOpen] = useState(false)
    const [isStudentsModalOpen, setIsStudentsModalOpen] = useState(false)
    const [selectedGroup, setSelectedGroup] = useState<any>(null)
    const [deleteId, setDeleteId] = useState<string | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)

    const fetchData = async () => {
        setLoading(true)
        try {
            const [groupsData, teachersData] = await Promise.all([
                getAdminGroups(),
                getAdminTeachers()
            ])
            setGroups(groupsData)
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
            const result = await deleteGroup(deleteId)
            if (result.success) {
                toast.success('Grup silindi')
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

    const filteredGroups = groups.filter(g =>
        g.title.toLowerCase().includes(searchTerm.toLowerCase())
    )

    if (loading && groups.length === 0) {
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
                title="Grup Yönetimi"
                subtitle={`${groups.length} grup tanımlı`}
                icon="fa-users"
                action={
                    <button
                        onClick={() => {
                            setSelectedGroup(null)
                            setIsGroupModalOpen(true)
                        }}
                        className="px-6 py-3 bg-brand-primary text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-brand-primary/20 hover:bg-brand-primary-dark hover:-translate-y-0.5 transition-all active:scale-95 flex items-center gap-2"
                    >
                        <i className="fas fa-plus"></i>
                        Yeni Grup Ekle
                    </button>
                }
            />

            {/* Search */}
            <div className="mt-8 mb-6">
                <div className="relative max-w-md group">
                    <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-brand-primary transition-colors"></i>
                    <input
                        type="text"
                        placeholder="Grup ara..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-white border border-gray-100 rounded-xl shadow-sm focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary outline-none transition-all text-sm font-medium"
                    />
                </div>
            </div>

            {/* Groups Grid/Table */}
            <div className="bg-white rounded-2xl border border-gray-100/80 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[1000px]">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100/80">
                                <th className="px-6 py-4 text-[11px] font-black text-brand-primary uppercase tracking-widest">GRUP DETAYI</th>
                                <th className="px-6 py-4 text-[11px] font-black text-brand-primary uppercase tracking-widest">EĞİTMEN</th>
                                <th className="px-6 py-4 text-[11px] font-black text-brand-primary uppercase tracking-widest">KONTENJAN</th>
                                <th className="px-6 py-4 text-[11px] font-black text-brand-primary uppercase tracking-widest">TARİHLER</th>
                                <th className="px-6 py-4 text-[11px] font-black text-brand-primary uppercase tracking-widest text-right">İŞLEMLER</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredGroups.map((group) => (
                                <tr key={group.id} className="hover:bg-gray-50/50 transition-colors group">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-4">
                                            <div className="w-16 h-12 bg-gray-100 rounded-lg overflow-hidden relative flex-shrink-0 border border-gray-100 shadow-sm">
                                                {group.thumbnail_url ? (
                                                    <Image src={group.thumbnail_url} alt={group.title} fill className="object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                        <i className="fas fa-users text-lg"></i>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-[14px] font-bold text-gray-900 group-hover:text-brand-primary transition-colors truncate">{group.title}</span>
                                                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-tight mt-0.5">{group.price} TL</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="text-[13px] font-bold text-gray-700">{group.teacher?.full_name || 'Eğitmen Atanmamış'}</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <div className="flex -space-x-2">
                                                {/* Placeholder for student dots/avatars */}
                                                <div className="w-8 h-8 rounded-full bg-brand-primary/10 border-2 border-white flex items-center justify-center text-[10px] font-black text-brand-primary">
                                                    {group.student_count}
                                                </div>
                                            </div>
                                            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">/ {group.max_students}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex flex-col gap-1">
                                            <div className="text-[11px] font-bold text-gray-600">
                                                {new Date(group.start_date).toLocaleDateString('tr-TR')}
                                            </div>
                                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                                Bitiş: {new Date(group.end_date).toLocaleDateString('tr-TR')}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => {
                                                    setSelectedGroup(group)
                                                    setIsStudentsModalOpen(true)
                                                }}
                                                className="px-4 py-2 rounded-xl bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all active:scale-95"
                                            >
                                                ÖĞRENCİLER
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setSelectedGroup(group)
                                                    setIsGroupModalOpen(true)
                                                }}
                                                className="w-10 h-10 flex items-center justify-center rounded-xl bg-white text-gray-400 border border-gray-100 shadow-sm hover:bg-brand-primary hover:text-white transition-all active:scale-95"
                                                title="Düzenle"
                                            >
                                                <i className="fas fa-edit text-xs"></i>
                                            </button>
                                            <button
                                                onClick={() => setDeleteId(group.id)}
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

                {filteredGroups.length === 0 && (
                    <div className="py-20 text-center">
                        <i className="fas fa-layer-group text-3xl text-gray-100 mb-4 block"></i>
                        <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Grup bulunamadı</p>
                    </div>
                )}
            </div>

            <GroupModal
                isOpen={isGroupModalOpen}
                onClose={() => setIsGroupModalOpen(false)}
                onSuccess={fetchData}
                group={selectedGroup}
                teachers={teachers}
            />

            <GroupStudentsModal
                isOpen={isStudentsModalOpen}
                onClose={() => setIsStudentsModalOpen(false)}
                group={selectedGroup}
            />

            <ConfirmModal
                isOpen={!!deleteId}
                isLoading={isDeleting}
                onClose={() => setDeleteId(null)}
                onConfirm={handleDelete}
                title="Grubu Sil"
                message="Bu grubu ve gruptaki tüm kayıtları silmek üzeresiniz. Bu işlem geri alınamaz."
                confirmText="Evet, Sil"
            />
        </div>
    )
}
