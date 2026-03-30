'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Cropper from 'react-easy-crop'
import Avatar from '@/components/Avatar'
import ConfirmModal from '@/components/ConfirmModal'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

interface AvatarUploadProps {
    userId: string
    currentAvatarUrl?: string | null
    userName: string
    onUploadSuccess: (newUrl: string) => void
    disabled?: boolean
    userRole?: string
}

export default function AvatarUpload({ userId, currentAvatarUrl, userName, onUploadSuccess, disabled, userRole }: AvatarUploadProps) {
    const isStudent = userRole === 'student'
    const effectivelyDisabled = disabled || isStudent
    const [imageSrc, setImageSrc] = useState<string | null>(null)
    const [crop, setCrop] = useState({ x: 0, y: 0 })
    const [zoom, setZoom] = useState(1)
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null)
    const [isUploading, setIsUploading] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
    const [mounted, setMounted] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        setMounted(true)
    }, [])

    const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0]
            if (!file.type.startsWith('image/')) {
                toast.error('Lütfen geçerli bir resim dosyası seçin.')
                return
            }
            if (file.size > 5 * 1024 * 1024) {
                toast.error("Görsel 5MB'den küçük olmalıdır.")
                return
            }
            const reader = new FileReader()
            reader.addEventListener('load', () => {
                setImageSrc(reader.result?.toString() || null)
            })
            reader.readAsDataURL(file)
            e.target.value = '' // reset
        }
    }

    const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels)
    }, [])

    const createImage = (url: string): Promise<HTMLImageElement> =>
        new Promise((resolve, reject) => {
            const image = new Image()
            image.addEventListener('load', () => resolve(image))
            image.addEventListener('error', (error) => reject(error))
            image.src = url
        })

    const getCroppedImg = async (imageSrc: string, pixelCrop: any): Promise<Blob | null> => {
        try {
            const image = await createImage(imageSrc)
            const canvas = document.createElement('canvas')
            const ctx = canvas.getContext('2d')

            if (!ctx) return null

            // 512x512 output size
            canvas.width = 512
            canvas.height = 512

            ctx.drawImage(
                image,
                pixelCrop.x,
                pixelCrop.y,
                pixelCrop.width,
                pixelCrop.height,
                0,
                0,
                512,
                512
            )

            return new Promise((resolve) => {
                canvas.toBlob((blob) => {
                    resolve(blob)
                }, 'image/jpeg', 0.9)
            })
        } catch (e) {
            console.error(e)
            return null
        }
    }

    const handleUpload = async () => {
        if (!imageSrc || !croppedAreaPixels) return

        setIsUploading(true)
        const toastId = toast.loading('Fotoğraf yükleniyor...')

        try {
            const croppedImageBlob = await getCroppedImg(imageSrc, croppedAreaPixels)
            if (!croppedImageBlob) throw new Error('Fotoğraf kırpılamadı.')

            const file = new File([croppedImageBlob], 'avatar.jpg', { type: 'image/jpeg' })
            const supabase = createClient()

            // Use a fixed filename per user so old files are automatically overwritten (no storage buildup)
            const fileName = `${userId}/avatar.jpg`

            const { data, error } = await supabase.storage
                .from('avatars')
                .upload(fileName, file, {
                    cacheControl: '3600',
                    upsert: true
                })

            if (error) {
                throw new Error('Yükleme başarısız oldu: ' + error.message)
            }

            const { data: publicData } = supabase.storage
                .from('avatars')
                .getPublicUrl(fileName)

            // Append a cache-busting query param so the browser fetches the fresh image
            const publicUrl = `${publicData.publicUrl}?v=${Date.now()}`

            // Update user profile
            const { error: updateError } = await (supabase
                .from('profiles') as any)
                .update({ avatar_url: publicUrl })
                .eq('id', userId)

            if (updateError) throw new Error('Profil güncellenemedi.')

            onUploadSuccess(publicUrl)
            toast.success('Profil fotoğrafınız güncellendi!', { id: toastId })
            setImageSrc(null)
        } catch (error: any) {
            toast.error(error.message || 'Bir hata oluştu.', { id: toastId })
        } finally {
            setIsUploading(false)
        }
    }

    const initiateDelete = () => {
        setIsDeleteModalOpen(true)
    }

    const handleDeleteAvatar = async () => {
        setIsDeleting(true)
        const toastId = toast.loading('Fotoğraf siliniyor...')

        try {
            const supabase = createClient()

            const { error: updateError } = await (supabase
                .from('profiles') as any)
                .update({ avatar_url: null })
                .eq('id', userId)

            if (updateError) throw new Error('Profil güncellenemedi.')

            onUploadSuccess('') // Empty string tells parent to fetch/refresh but we don't have a new url
            toast.success('Profil fotoğrafı kaldırıldı.', { id: toastId })
        } catch (error: any) {
            toast.error(error.message || 'Bir hata oluştu.', { id: toastId })
        } finally {
            setIsDeleting(false)
            setIsDeleteModalOpen(false)
        }
    }

    return (
        <>
            <div className="relative group inline-block">
                <Avatar
                    src={currentAvatarUrl || undefined}
                    name={userName || 'User'}
                    size={128}
                    className={`ring-4 ring-white shadow-xl transition-all duration-300 ${!effectivelyDisabled && 'group-hover:brightness-75'}`}
                />
                {!effectivelyDisabled && (
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-full bg-black/50"
                    >
                        <i className="fas fa-camera text-white text-2xl mb-1"></i>
                        <span className="text-white text-xs font-bold uppercase tracking-wider">Değiştir</span>
                    </div>
                )}
                {!effectivelyDisabled && currentAvatarUrl && (
                    <button
                        onClick={initiateDelete}
                        disabled={isDeleting}
                        className="absolute bottom-1 right-1 w-9 h-9 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-transform hover:scale-110 z-10 border-2 border-white"
                        title="Fotoğrafı Kaldır"
                    >
                        {isDeleting ? <i className="fas fa-spinner fa-spin text-[11px]"></i> : <i className="fas fa-trash-alt text-[11px]"></i>}
                    </button>
                )}
                {isStudent && (
                    <div className="absolute -bottom-2 -left-2 bg-yellow-400 text-gray-900 text-[8px] font-black px-1.5 py-0.5 rounded-full shadow-lg border border-white uppercase tracking-tighter animate-pulse">
                        Admin Onayı Gerekli
                    </div>
                )}
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={onFileChange}
                    accept="image/*"
                    className="hidden"
                />
            </div>
            {mounted && imageSrc ? createPortal(
                <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-sm">
                    <div className="bg-white rounded-lg w-full max-w-md overflow-hidden shadow-2xl flex flex-col">
                        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white">
                            <h3 className="font-bold text-gray-900">Fotoğrafı Kırp</h3>
                            <button onClick={() => !isUploading && setImageSrc(null)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <div className="relative w-full h-80 bg-gray-900 overflow-hidden">
                            <Cropper
                                image={imageSrc}
                                crop={crop}
                                zoom={zoom}
                                aspect={1}
                                onCropChange={setCrop}
                                onCropComplete={onCropComplete}
                                onZoomChange={setZoom}
                                cropShape="round"
                                showGrid={false}
                            />
                        </div>

                        <div className="px-6 py-4 bg-gray-50 flex items-center justify-between border-t border-gray-100">
                            <input
                                type="range"
                                value={zoom}
                                min={1}
                                max={3}
                                step={0.1}
                                aria-labelledby="Zoom"
                                onChange={(e) => {
                                    setZoom(Number(e.target.value))
                                }}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#204544]"
                            />
                        </div>

                        <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3 border-t border-gray-100 rounded-b-2xl">
                            <button
                                onClick={() => setImageSrc(null)}
                                disabled={isUploading}
                                className="px-5 py-2 text-sm font-bold text-gray-500 hover:text-gray-700 bg-white border border-gray-200 hover:bg-gray-100 rounded-lg transition-all disabled:opacity-50 tracking-wide"
                            >
                                İptal
                            </button>
                            <button
                                onClick={handleUpload}
                                disabled={isUploading}
                                className="px-5 py-2 text-sm font-bold text-white bg-brand-primary hover:bg-[#15302f] rounded-lg transition-all disabled:opacity-50 tracking-wide flex items-center gap-2"
                            >
                                {isUploading ? (
                                    <>
                                        <i className="fas fa-spinner fa-spin"></i>
                                        Yükleniyor...
                                    </>
                                ) : (
                                    <>
                                        <i className="fas fa-check"></i>
                                        Kırp ve Kaydet
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            ) : null}

            <ConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteAvatar}
                title="Fotoğrafı Kaldır"
                message="Profil fotoğrafınızı silmek istediğinize emin misiniz? Bu işlem geri alınamaz."
                confirmText="Evet, Kaldır"
                cancelText="İptal"
                isLoading={isDeleting}
            />
        </>
    )
}
