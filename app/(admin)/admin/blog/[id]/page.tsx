'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'react-hot-toast'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import ImageExtension from '@tiptap/extension-image'
import { getBlogPostById, upsertBlogPost } from '@/lib/actions/blog'
import { uploadPlatformAsset } from '@/lib/actions/settings'
import imageCompression from 'browser-image-compression'

import AdminCard from '@/components/admin/AdminCard'
import Image from 'next/image'

// Schema
const blogPostSchema = z.object({
    title: z.string().min(1, 'Başlık gereklidir').max(200),
    slug: z.string().min(1, 'Slug gereklidir').regex(/^[a-z0-9-]+$/, 'Slug sadece küçük harf, rakam ve tire içerebilir'),
    excerpt: z.string().optional(),
    category: z.string().min(1, 'Kategori gereklidir'),
    image_url: z.string().optional().nullable(),
    is_published: z.boolean().default(false),
    read_time: z.string().optional(),
})

type BlogPostInput = z.infer<typeof blogPostSchema>

export default function BlogEditorPage() {
    const params = useParams()
    const router = useRouter()
    const isNew = params?.id === 'new'
    const [loading, setLoading] = useState(!isNew)
    const [saving, setSaving] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [content, setContent] = useState('')

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors }
    } = useForm<BlogPostInput>({
        resolver: zodResolver(blogPostSchema) as any,
        defaultValues: {
            is_published: false,
            read_time: '5 dk okuma'
        }
    })

    const imageUrl = watch('image_url')

    // Tiptap Editor
    const editor = useEditor({
        extensions: [
            StarterKit,
            ImageExtension.configure({
                inline: true,
                allowBase64: true,
            }),
        ],
        content: '',
        onUpdate: ({ editor }) => {
            setContent(editor.getHTML())
        },
        immediatelyRender: false,
    })

    useEffect(() => {
        if (!isNew) {
            const fetchPost = async () => {
                const result = await getBlogPostById(params.id as string)
                if (result.success && result.data) {
                    const post = result.data
                    setValue('title', post.title)
                    setValue('slug', post.slug)
                    setValue('excerpt', post.excerpt || '')
                    setValue('category', post.category)
                    setValue('image_url', post.image_url)
                    setValue('is_published', post.is_published)
                    setValue('read_time', post.read_time || '')
                    setContent(post.content)
                    editor?.commands.setContent(post.content)
                } else {
                    toast.error('Yazı bulunamadı')
                    router.push('/admin/blog')
                }
                setLoading(false)
            }
            fetchPost()
        }
    }, [isNew, params.id, setValue, editor, router])

    const onSubmit = async (data: BlogPostInput) => {
        if (!content || content === '<p></p>') {
            toast.error('İçerik boş olamaz')
            return
        }

        setSaving(true)
        const result = await upsertBlogPost(isNew ? null : params.id as string, {
            ...data,
            content
        })

        if (result.success) {
            toast.success(result.message || 'Kaydedildi')
            router.push('/admin/blog')
        } else {
            toast.error(result.error || 'Kaydetme başarısız')
        }
        setSaving(false)
    }

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setUploading(true)

        try {
            let fileToUpload = file;

            // Auto-compress and convert to WebP for images
            if (file.type.startsWith('image/')) {
                const options = {
                    maxSizeMB: 3, // Preserve high quality up to 3MB
                    maxWidthOrHeight: 2560, // Allow up to 2K resolution
                    useWebWorker: true,
                    alwaysKeepResolution: true, // Prevent aggressive downscaling
                    initialQuality: 0.85, // Balance out quality and size
                    fileType: 'image/webp' // Always convert to WebP
                }

                try {
                    toast.loading('Görsel optimize ediliyor...', { id: 'optimizeBlogToast' })
                    const compressedBlob = await imageCompression(file, options)
                    const newFileName = file.name.replace(/\.[^/.]+$/, "") + ".webp"
                    fileToUpload = new File([compressedBlob], newFileName, { type: 'image/webp' })
                    toast.dismiss('optimizeBlogToast')
                } catch (compressionError) {
                    console.error('Image compression failed, uploading original:', compressionError)
                    toast.dismiss('optimizeBlogToast')
                }
            }

            const formData = new FormData()
            formData.append('file', fileToUpload)

            const result = await uploadPlatformAsset(formData)
            if (result.success && result.url) {
                setValue('image_url', result.url)
                toast.success('Görsel başarıyla yüklendi ve optimize edildi')
            } else {
                toast.error(result.error || 'Yükleme başarısız')
            }
        } catch {
            toast.error('Hata oluştu')
        } finally {
            setUploading(false)
        }
    }

    const generateSlug = (title: string) => {
        return title
            .toLowerCase()
            .replace(/ğ/g, 'g')
            .replace(/ü/g, 'u')
            .replace(/ş/g, 's')
            .replace(/ı/g, 'i')
            .replace(/ö/g, 'o')
            .replace(/ç/g, 'c')
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .trim()
    }

    if (loading) return <div className="p-8 text-center text-gray-500">Yükleniyor...</div>

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 animate-fadeIn">
            <div className="flex items-center justify-between mb-10 pb-8 border-b border-gray-100">
                <div className="flex items-center gap-4">
                    <Link href="/admin/blog" className="w-10 h-10 flex items-center justify-center rounded-lg bg-white border border-gray-100 text-gray-400 hover:text-brand-primary hover:bg-brand-accent/10 hover:border-brand-accent/20 transition-all shadow-sm active:scale-95">
                        <i className="fas fa-arrow-left text-xs"></i>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-extrabold text-brand-primary tracking-tight">{isNew ? 'Yeni Yazı' : 'Yazıyı Düzenle'}</h1>
                        <p className="text-gray-500 text-sm font-medium mt-1">İçeriğinizi hazırlayın ve paylaşın.</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => router.push('/admin/blog')}
                        className="px-6 py-3 text-[11px] font-black uppercase tracking-widest text-gray-500 bg-white border border-gray-100 hover:bg-gray-50 rounded-lg transition-all shadow-sm active:scale-95"
                    >
                        İptal
                    </button>
                    <button
                        onClick={handleSubmit(onSubmit)}
                        disabled={saving || uploading}
                        className="px-10 py-3.5 bg-brand-primary text-white text-[13px] font-black uppercase tracking-widest rounded-lg shadow-lg shadow-[#204544]/30 hover:bg-brand-primary-dark hover:-translate-y-1 disabled:opacity-50 flex items-center justify-center text-center gap-3 transition-all active:scale-95"
                    >
                        {saving ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-save text-xs"></i>}
                        {isNew ? 'Yayınla' : 'Güncelle'}
                    </button>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Title */}
                    <AdminCard padding={true} className="space-y-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gray-50 rounded-bl-full pointer-events-none z-0"></div>
                        <div className="relative z-10">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] block mb-2.5">Başlık</label>
                            <input
                                {...register('title')}
                                onChange={(e) => {
                                    setValue('title', e.target.value)
                                    if (isNew) setValue('slug', generateSlug(e.target.value))
                                }}
                                className="w-full px-5 py-3 text-lg border-2 border-gray-50 rounded-lg focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary outline-none transition-all placeholder:text-gray-300"
                                placeholder="Yazı başlığını buraya girin..."
                            />
                            {errors.title && <p className="text-[11px] font-bold text-red-500 mt-2 flex items-center gap-1.5"><i className="fas fa-exclamation-circle"></i> {errors.title.message}</p>}
                        </div>

                        <div className="relative z-10">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] block mb-2.5">URL (Slug)</label>
                            <div className="flex items-center">
                                <span className="bg-gray-50 border-2 border-r-0 border-gray-50 px-4 py-3 text-gray-400 text-sm rounded-l-xl font-bold">/blog/</span>
                                <input
                                    {...register('slug')}
                                    className="flex-1 px-5 py-3 text-sm border-2 border-gray-50 rounded-r-xl focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary outline-none transition-all font-mono text-brand-primary font-bold"
                                />
                            </div>
                            {errors.slug && <p className="text-[11px] font-bold text-red-500 mt-2 flex items-center gap-1.5"><i className="fas fa-exclamation-circle"></i> {errors.slug.message}</p>}
                        </div>
                    </AdminCard>

                    {/* Rich Text Editor */}
                    <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
                        <div className="bg-gray-50/50 border-b border-gray-100 p-3 flex flex-wrap gap-2">
                            <EditorToolbarButton onClick={() => editor?.chain().focus().toggleBold().run()} isActive={editor?.isActive('bold')} icon="bold" />
                            <EditorToolbarButton onClick={() => editor?.chain().focus().toggleItalic().run()} isActive={editor?.isActive('italic')} icon="italic" />
                            <EditorToolbarButton onClick={() => editor?.chain().focus().toggleStrike().run()} isActive={editor?.isActive('strike')} icon="strikethrough" />
                            <div className="w-px h-6 bg-gray-200 mx-1 self-center"></div>
                            <EditorToolbarButton onClick={() => editor?.chain().focus().setParagraph().run()} isActive={editor?.isActive('paragraph')} icon="paragraph" />
                            <EditorToolbarButton onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor?.isActive('heading', { level: 2 })} icon="heading" label="H2" />
                            <EditorToolbarButton onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()} isActive={editor?.isActive('heading', { level: 3 })} icon="heading" label="H3" />
                            <div className="w-px h-6 bg-gray-200 mx-1 self-center"></div>
                            <EditorToolbarButton onClick={() => editor?.chain().focus().toggleBulletList().run()} isActive={editor?.isActive('bulletList')} icon="list-ul" />
                            <EditorToolbarButton onClick={() => editor?.chain().focus().toggleOrderedList().run()} isActive={editor?.isActive('orderedList')} icon="list-ol" />
                            <EditorToolbarButton onClick={() => editor?.chain().focus().toggleBlockquote().run()} isActive={editor?.isActive('blockquote')} icon="quote-right" />
                            <div className="w-px h-6 bg-gray-200 mx-1 self-center"></div>
                            <EditorToolbarButton onClick={() => editor?.chain().focus().undo().run()} icon="undo" />
                            <EditorToolbarButton onClick={() => editor?.chain().focus().redo().run()} icon="redo" />
                        </div>
                        <div className="p-8 min-h-[500px] prose prose-lg prose-slate max-w-none focus:outline-none bg-white">
                            <EditorContent editor={editor} />
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="grid grid-cols-1 gap-8">
                    {/* Publishing */}
                    <AdminCard padding={true} className="space-y-6">
                        <h3 className="text-[11px] font-black text-brand-primary uppercase tracking-widest border-b border-gray-50 pb-4 flex items-center gap-2.5">
                            <i className="fas fa-globe"></i> Yayın Ayarları
                        </h3>
                        <label className="flex items-center justify-between cursor-pointer pt-2 group">
                            <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest group-hover:text-gray-600 transition-colors">Yazı Yayında</span>
                            <div className="relative inline-flex items-center">
                                <input type="checkbox" {...register('is_published')} className="sr-only peer" />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-primary"></div>
                            </div>
                        </label>
                        <div className="pt-2">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Okuma Süresi</label>
                            <input {...register('read_time')} className="w-full px-4 py-2.5 text-xs font-bold border-2 border-gray-50 rounded-lg focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary outline-none transition-all" placeholder="Örn: 5 dk okuma" />
                        </div>
                    </AdminCard>

                    {/* Category */}
                    <AdminCard padding={true} className="space-y-6">
                        <h3 className="text-[11px] font-black text-brand-primary uppercase tracking-widest border-b border-gray-50 pb-4 flex items-center gap-2.5">
                            <i className="fas fa-tags"></i> Kategori & Özet
                        </h3>
                        <div className="pt-2">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Kategori</label>
                            <select {...register('category')} className="w-full px-4 py-2.5 text-xs font-bold border-2 border-gray-50 rounded-lg focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary outline-none transition-all appearance-none bg-white">
                                <option value="">Seçiniz...</option>
                                <option value="Dil Öğrenme">Dil Öğrenme</option>
                                <option value="Arapça Gramer">Arapça Gramer</option>
                                <option value="Çalışma Teknikleri">Çalışma Teknikleri</option>
                                <option value="Online Eğitim">Online Eğitim</option>
                                <option value="Konuşma Pratiği">Konuşma Pratiği</option>
                                <option value="Kültür & Sanat">Kültür & Sanat</option>
                                <option value="Rehber">Rehber</option>
                            </select>
                            {errors.category && <p className="text-[10px] font-bold text-red-500 mt-2">{errors.category.message}</p>}
                        </div>
                        <div className="pt-2">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Kısa Özet (Excerpt)</label>
                            <textarea {...register('excerpt')} rows={3} className="w-full px-4 py-3 text-xs font-medium border-2 border-gray-50 rounded-lg resize-none focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary outline-none transition-all leading-relaxed" placeholder="Yazının kısa özeti..." />
                        </div>
                    </AdminCard>

                    {/* Featured Image */}
                    <AdminCard padding={true} className="space-y-6">
                        <h3 className="text-[11px] font-black text-brand-primary uppercase tracking-widest border-b border-gray-50 pb-4 flex items-center gap-2.5">
                            <i className="fas fa-image"></i> Öne Çıkan Görsel
                        </h3>
                        <div className="space-y-3">
                            <div className="w-full aspect-video bg-gray-50/50 rounded-lg border-2 border-dashed border-gray-100 flex flex-col items-center justify-center overflow-hidden hover:border-brand-primary/30 hover:bg-gray-100/50 transition-all relative group cursor-pointer pt-2">
                                {imageUrl ? (
                                    <>
                                        <Image src={imageUrl} alt="Cover" fill className="object-cover" />
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                                            <label className="cursor-pointer px-5 py-2.5 bg-white text-brand-primary rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg hover:scale-105 transition-transform flex items-center gap-2">
                                                <i className="fas fa-upload"></i> Görseli Değiştir
                                                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                                            </label>
                                        </div>
                                    </>
                                ) : (
                                    <label className="cursor-pointer flex flex-col items-center gap-4 p-4 text-center w-full h-full justify-center">
                                        <div className="w-14 h-14 rounded-lg bg-white shadow-sm ring-1 ring-gray-100 flex items-center justify-center text-gray-300 group-hover:text-brand-primary group-hover:scale-110 transition-all duration-500">
                                            <i className="fas fa-cloud-upload-alt text-xl"></i>
                                        </div>
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest group-hover:text-brand-primary transition-colors">Yüklemek için tıklayın</span>
                                        <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                                    </label>
                                )}
                            </div>
                            <div className="text-center">
                                <div className="inline-block px-2.5 py-1.5 border-2 border-amber-200 bg-amber-50 text-amber-800 text-[10px] font-bold rounded-md uppercase tracking-wider w-full">
                                    📌 İdeal Boyut: 1200x630px (Yatay Geniş)
                                </div>
                            </div>
                        </div>
                    </AdminCard>
                </div>
            </div>
        </div>
    )
}

function EditorToolbarButton({ onClick, isActive, icon, label }: any) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`w-10 h-10 flex items-center justify-center rounded-lg transition-all ${isActive ? 'bg-brand-primary text-white shadow-md shadow-[#204544]/20' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900 border border-transparent hover:border-gray-200'} active:scale-95`}
            title={label || icon}
        >
            {label ? <span className="text-xs font-black leading-none">{label}</span> : <i className={`fas fa-${icon} text-xs`}></i>}
        </button>
    )
}
