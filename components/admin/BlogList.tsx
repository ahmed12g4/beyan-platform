'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getAdminBlogPosts, deleteBlogPost } from '@/lib/actions/blog'
import { toast } from 'react-hot-toast'
import Image from 'next/image'
import ConfirmModal from '@/components/ConfirmModal'

export default function BlogList() {
    const [posts, setPosts] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [deleteId, setDeleteId] = useState<string | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)

    const fetchPosts = async () => {
        setLoading(true)
        const result = await getAdminBlogPosts()
        if (result.success && result.data) {
            setPosts(result.data)
        } else {
            toast.error(result.error || 'Yazılar yüklenemedi')
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchPosts()
    }, [])

    const confirmDelete = async () => {
        if (!deleteId) return

        setIsDeleting(true)
        const result = await deleteBlogPost(deleteId)
        if (result.success) {
            toast.success('Yazı silindi')
            fetchPosts()
        } else {
            toast.error(result.error || 'Silme işlemi başarısız')
        }
        setIsDeleting(false)
        setDeleteId(null)
    }

    if (loading) return <div className="p-8 text-center text-gray-500">Yükleniyor...</div>

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-xl font-extrabold text-brand-primary tracking-tight">Blog Yazıları</h3>
                    <p className="text-gray-500 text-sm font-medium">Sistemdeki tüm yayınları buradan yönetin.</p>
                </div>
                <Link
                    href="/admin/blog/new"
                    className="px-8 py-3.5 bg-brand-primary text-white rounded-lg font-black uppercase tracking-widest shadow-md shadow-[#204544]/20 hover:bg-brand-primary-dark hover:-translate-y-0.5 transition-all flex items-center gap-3 text-[13px] active:scale-95"
                >
                    <i className="fas fa-plus text-xs"></i> Yeni Yazı
                </Link>
            </div>

            {posts.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                    <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center mx-auto mb-4 text-gray-300 shadow-sm">
                        <i className="fas fa-newspaper text-2xl"></i>
                    </div>
                    <p className="text-gray-500 text-sm font-medium">Henüz bir yazı yayınlanmamış.</p>
                </div>
            ) : (
                <div className="bg-white rounded-lg border border-gray-100/80 shadow-sm overflow-x-auto hover:shadow-md transition-shadow">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100/80">
                                <th className="px-6 py-4 text-xs font-extrabold text-brand-primary uppercase tracking-wider">YAZI</th>
                                <th className="px-6 py-4 text-xs font-extrabold text-brand-primary uppercase tracking-wider">KATEGORİ</th>
                                <th className="px-6 py-4 text-xs font-extrabold text-brand-primary uppercase tracking-wider">DURUM</th>
                                <th className="px-6 py-4 text-xs font-extrabold text-brand-primary uppercase tracking-wider">TARİH</th>
                                <th className="px-6 py-4 text-xs font-extrabold text-brand-primary uppercase tracking-wider text-right">İŞLEMLER</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {posts.map((post) => (
                                <tr key={post.id} className="hover:bg-gray-50/50 transition-colors group">
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden relative flex-shrink-0 border border-gray-200 shadow-sm">
                                                {post.image_url ? (
                                                    <Image src={post.image_url} alt={post.title} fill className="object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-300 bg-gray-50">
                                                        <i className="fas fa-image text-sm"></i>
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <div className="font-bold text-gray-900 text-sm group-hover:text-brand-primary transition-colors line-clamp-1">{post.title}</div>
                                                <div className="text-[10px] text-gray-400 font-bold uppercase tracking-tight mt-0.5">{post.slug}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className="text-xs font-bold text-gray-700 bg-gray-50 border border-gray-100 px-3 py-1 rounded-lg uppercase tracking-tight">{post.category || 'Genel'}</span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg border ${post.is_published ? 'bg-green-50 text-green-700 border-green-100' : 'bg-gray-50 text-gray-500 border-gray-100'}`}>
                                            {post.is_published ? 'Yayında' : 'Taslak'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5 text-xs font-medium text-gray-400">
                                        {new Date(post.created_at).toLocaleDateString('tr-TR')}
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Link
                                                href={`/admin/blog/${post.id}`}
                                                className="w-11 h-11 flex items-center justify-center rounded-lg text-gray-400 bg-white border border-gray-100 hover:bg-brand-primary hover:text-white hover:border-brand-primary transition-all shadow-sm active:scale-95"
                                                title="Düzenle"
                                            >
                                                <i className="fas fa-edit text-xs"></i>
                                            </Link>
                                            <button
                                                onClick={() => setDeleteId(post.id)}
                                                className="w-11 h-11 flex items-center justify-center rounded-lg text-gray-400 bg-white border border-gray-100 hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-all shadow-sm active:scale-95"
                                                title="Kalıcı Olarak Sil"
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
            )}

            <ConfirmModal
                isOpen={!!deleteId}
                isLoading={isDeleting}
                onClose={() => setDeleteId(null)}
                onConfirm={confirmDelete}
                title="Yazıyı Sil"
                message="Bu blog yazısını kalıcı olarak silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
                confirmText="Evet, Sil"
            />
        </div>
    )
}
