'use client';

import { useState, useEffect } from 'react';
import PageHeader from '@/components/admin/PageHeader';
import { createBroadcastNotification, getAdminBroadcasts, deleteBroadcast } from '@/lib/actions/notifications';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';
import { formatRelativeTime } from '@/lib/utils/formatDate';
import ConfirmModal from '@/components/ConfirmModal';

interface UserOption {
    id: string;
    full_name: string;
    email: string;
}

interface Broadcast {
    batch_id: string;
    title: string;
    message: string;
    type: string;
    created_at: string;
    recipientCount: number;
}

export default function AdminNotificationsPage() {
    const [activeTab, setActiveTab] = useState<'compose' | 'history'>('compose');
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [targetRole, setTargetRole] = useState<'all' | 'student' | 'teacher' | 'specific'>('all');
    const [targetUserId, setTargetUserId] = useState('');
    const [link, setLink] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Modal state
    const [deleteBatchId, setDeleteBatchId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // For specific user selection
    const [students, setStudents] = useState<UserOption[]>([]);
    const [teachers, setTeachers] = useState<UserOption[]>([]);
    const [history, setHistory] = useState<Broadcast[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);

    useEffect(() => {
        const fetchUsers = async () => {
            const supabase = createClient();
            const { data } = await supabase.from('profiles').select('id, full_name, email, role') as { data: { id: string; full_name: string; email: string; role: string; }[] | null };
            if (data) {
                setStudents(data.filter(u => u.role === 'student'));
                setTeachers(data.filter(u => u.role === 'teacher'));
            }
        };
        fetchUsers();
    }, []);

    const fetchHistory = async () => {
        setIsLoadingHistory(true);
        const res = await getAdminBroadcasts();
        if (res.success && res.data) {
            setHistory(res.data);
        }
        setIsLoadingHistory(false);
    };

    useEffect(() => {
        if (activeTab === 'history') {
            fetchHistory();
        }
    }, [activeTab]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title.trim() || !message.trim()) {
            toast.error('Lütfen başlık ve mesaj alanlarını doldurun.');
            return;
        }

        if (targetRole === 'specific' && !targetUserId) {
            toast.error('Lütfen hedef kullanıcıyı seçin.');
            return;
        }

        setIsSubmitting(true);
        const loadingToast = toast.loading('Bildirim gönderiliyor...');

        const result = await createBroadcastNotification({
            title: title.trim(),
            message: message.trim(),
            targetRole,
            targetUserId: targetRole === 'specific' ? targetUserId : undefined,
            link: link.trim() || undefined,
            type: 'SYSTEM'
        });

        toast.dismiss(loadingToast);

        if (result.success) {
            toast.success(result.message || 'Bildirim başarıyla gönderildi!');
            setTitle('');
            setMessage('');
            setLink('');
            setTargetUserId('');
        } else {
            toast.error(result.error || 'Bir hata oluştu.');
        }

        setIsSubmitting(false);
    };

    const handleDeleteBroadcast = (batchId: string) => {
        setDeleteBatchId(batchId);
    };

    const confirmDelete = async () => {
        if (!deleteBatchId) return;
        setIsDeleting(true);

        const loadingToast = toast.loading('Siliniyor...');
        const res = await deleteBroadcast(deleteBatchId);
        toast.dismiss(loadingToast);

        if (res.success) {
            toast.success(res.message || 'Bildirim silindi');
            setHistory(prev => prev.filter(b => b.batch_id !== deleteBatchId));
        } else {
            toast.error(res.error || 'Bir hata oluştu');
        }

        setIsDeleting(false);
        setDeleteBatchId(null);
    };

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 animate-fadeIn">
            <PageHeader
                title="Bildirim Merkezi"
                subtitle="Kullanıcılara duyuru و bildirimlerinizi bu premium panelden yönetin"
                icon="fa-bullhorn"
            />

            {/* Tabs Styling */}
            <div className="flex bg-white/40 backdrop-blur-xl sticky top-[72px] z-40 px-6 pt-4 border border-white/20 rounded-t-3xl mt-12 gap-10 justify-center shadow-[0_8px_32px_rgba(0,0,0,0.03)] border-b-0">
                <button
                    onClick={() => setActiveTab('compose')}
                    className={`pb-4 px-2 font-black text-xs uppercase tracking-widest transition-all relative ${activeTab === 'compose'
                        ? 'text-brand-primary'
                        : 'text-gray-400 hover:text-gray-600'
                        }`}
                >
                    <i className="fas fa-magic mr-2"></i> Yeni Oluştur
                    {activeTab === 'compose' && (
                        <span className="absolute bottom-0 left-0 right-0 h-1 bg-brand-primary rounded-t-full shadow-[0_-4px_10px_rgba(32,69,68,0.2)]"></span>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={`pb-4 px-2 font-black text-xs uppercase tracking-widest transition-all relative ${activeTab === 'history'
                        ? 'text-brand-primary'
                        : 'text-gray-400 hover:text-gray-600'
                        }`}
                >
                    <i className="fas fa-stream mr-2"></i> Yayın Geçmişi
                    {activeTab === 'history' && (
                        <span className="absolute bottom-0 left-0 right-0 h-1 bg-brand-primary rounded-t-full shadow-[0_-4px_10px_rgba(32,69,68,0.2)]"></span>
                    )}
                </button>
            </div>

            <div className="bg-white/60 backdrop-blur-2xl rounded-b-[40px] shadow-2xl shadow-gray-200/50 border border-white/20 p-8 md:p-12 mb-10 overflow-hidden relative">
                {/* Decorative Elements */}
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-brand-accent opacity-[0.03] rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-brand-primary opacity-[0.03] rounded-full blur-3xl pointer-events-none"></div>

                {activeTab === 'compose' ? (
                    <form onSubmit={handleSubmit} className="space-y-10 max-w-4xl relative z-10">
                        <div className="space-y-6">
                            <div className="flex items-center gap-3">
                                <span className="w-1.5 h-6 bg-brand-accent rounded-full"></span>
                                <label className="text-lg font-black text-gray-900 tracking-tight uppercase">Hedef Kitle Seçimi</label>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                {[
                                    { id: 'all', label: 'Herkes', icon: 'fa-globe-americas', desc: 'Tüm platform üyeleri' },
                                    { id: 'student', label: 'Öğrenciler', icon: 'fa-user-graduate', desc: 'Sadece aktif öğrenciler' },
                                    { id: 'teacher', label: 'Öğretmenler', icon: 'fa-chalkboard-teacher', desc: 'Sadece eğitmenler' },
                                    { id: 'specific', label: 'Bireysel', icon: 'fa-fingerprint', desc: 'Tek bir özel kullanıcı' }
                                ].map((option) => (
                                    <button
                                        type="button"
                                        key={option.id}
                                        onClick={() => setTargetRole(option.id as any)}
                                        className={`p-6 rounded-[24px] border-2 text-left transition-all group flex flex-col gap-4 relative overflow-hidden ${targetRole === option.id
                                            ? 'border-brand-primary bg-brand-primary text-white shadow-xl shadow-brand-primary/20 scale-[1.02]'
                                            : 'border-gray-50 bg-white/50 text-gray-500 hover:border-brand-primary/30 hover:bg-white hover:scale-[1.02]'
                                            }`}
                                    >
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${targetRole === option.id ? 'bg-white/20' : 'bg-gray-50 group-hover:bg-brand-primary/5 group-hover:text-brand-primary'}`}>
                                            <i className={`fas ${option.icon} text-xl`}></i>
                                        </div>
                                        <div>
                                            <div className="text-[13px] font-black uppercase tracking-wider">{option.label}</div>
                                            <div className={`text-[10px] mt-1 font-medium ${targetRole === option.id ? 'text-white/70' : 'text-gray-400'}`}>{option.desc}</div>
                                        </div>
                                        {targetRole === option.id && (
                                            <i className="fas fa-check-circle absolute top-4 right-4 text-brand-accent text-sm"></i>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {targetRole === 'specific' && (
                            <div className="space-y-4 animate-slideDown">
                                <label htmlFor="targetUserId" className="text-sm font-black text-gray-700 uppercase tracking-widest flex items-center gap-2">
                                    <i className="fas fa-search text-xs text-brand-accent"></i> Kullanıcı Arama
                                </label>
                                <div className="relative">
                                    <select
                                        id="targetUserId"
                                        value={targetUserId}
                                        onChange={(e) => setTargetUserId(e.target.value)}
                                        className="w-full pl-6 pr-12 py-4 bg-white/80 border-2 border-gray-100 rounded-2xl focus:outline-none focus:ring-8 focus:ring-brand-primary/5 focus:border-brand-primary transition-all text-sm font-bold text-gray-900 appearance-none shadow-sm"
                                    >
                                        <option value="">Hedef ismi seçiniz...</option>
                                        <optgroup label="Öğrenciler" className="font-bold text-brand-primary">
                                            {students.map(s => (
                                                <option key={s.id} value={s.id}>{s.full_name || 'İsimsiz'} ({s.email})</option>
                                            ))}
                                        </optgroup>
                                        <optgroup label="Öğretmenler" className="font-bold text-brand-primary">
                                            {teachers.map(t => (
                                                <option key={t.id} value={t.id}>{t.full_name || 'İsimsiz'} ({t.email})</option>
                                            ))}
                                        </optgroup>
                                    </select>
                                    <i className="fas fa-chevron-down absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-xs"></i>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <label htmlFor="title" className="text-sm font-black text-gray-700 uppercase tracking-widest">Mesaj Başlığı</label>
                                <div className="relative group">
                                    <i className="fas fa-heading absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-brand-primary transition-colors"></i>
                                    <input
                                        id="title"
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="Dikkat çekici bir başlık..."
                                        className="w-full pl-14 pr-6 py-4 bg-white border-2 border-gray-100 rounded-2xl focus:outline-none focus:ring-8 focus:ring-brand-primary/5 focus:border-brand-primary transition-all text-sm font-black text-gray-900 shadow-sm placeholder:text-gray-300"
                                        maxLength={100}
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label htmlFor="link" className="text-sm font-black text-gray-700 uppercase tracking-widest">Buton Bağlantısı (URL)</label>
                                <div className="relative group">
                                    <i className="fas fa-link absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-brand-primary transition-colors"></i>
                                    <input
                                        id="link"
                                        type="text"
                                        value={link}
                                        onChange={(e) => setLink(e.target.value)}
                                        placeholder="/dashboard أو https://..."
                                        className="w-full pl-14 pr-6 py-4 bg-white border-2 border-gray-100 rounded-2xl focus:outline-none focus:ring-8 focus:ring-brand-primary/5 focus:border-brand-primary transition-all text-sm font-bold text-gray-900 shadow-sm placeholder:text-gray-300"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-end">
                                <label htmlFor="message" className="text-sm font-black text-gray-700 uppercase tracking-widest">İçerik Detayı</label>
                                <div className="text-[10px] font-black text-gray-400 px-3 py-1 bg-gray-50 rounded-full border border-gray-100">{message.length}/300</div>
                            </div>
                            <textarea
                                id="message"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Duyurunuzun tüm detaylarını buraya yazın..."
                                rows={5}
                                className="w-full px-6 py-6 bg-white border-2 border-gray-100 rounded-[32px] focus:outline-none focus:ring-8 focus:ring-brand-primary/5 focus:border-brand-primary transition-all text-sm font-medium text-gray-700 resize-none shadow-sm leading-relaxed"
                                maxLength={300}
                            />
                        </div>

                        <div className="pt-8 border-t border-gray-100 flex justify-end">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="px-12 py-5 bg-brand-primary text-white font-black text-base rounded-[24px] shadow-2xl shadow-brand-primary/30 hover:bg-brand-primary-dark hover:-translate-y-1 active:translate-y-0 transition-all w-full sm:w-auto flex items-center justify-center gap-3 disabled:opacity-70 disabled:hover:translate-y-0"
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        <span>Yayınlanıyor...</span>
                                    </>
                                ) : (
                                    <>
                                        <i className="fas fa-rocket text-brand-accent"></i>
                                        <span>Şimdi Yayınla</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="max-w-5xl mx-auto animate-fadeIn relative z-10">
                        {isLoadingHistory ? (
                            <div className="text-center py-20">
                                <div className="w-16 h-16 border-4 border-gray-100 border-t-brand-primary rounded-full animate-spin mx-auto mb-6"></div>
                                <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">İşlem kayıtları yükleniyor</p>
                            </div>
                        ) : history.length === 0 ? (
                            <div className="text-center py-20 bg-gray-50/50 rounded-[40px] border-2 border-dashed border-gray-100">
                                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                                    <i className="fas fa-ghost text-3xl text-gray-200"></i>
                                </div>
                                <p className="text-gray-500 font-black uppercase tracking-widest text-sm">Hemen ilk bildirimini gönder!</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-6">
                                {history.map((item) => (
                                    <div key={item.batch_id} className="flex flex-col md:flex-row md:items-center justify-between p-8 rounded-[32px] border-2 border-gray-50 hover:border-brand-primary/10 hover:shadow-2xl hover:shadow-gray-200 transition-all bg-white group relative overflow-hidden">
                                        {/* Status Glow */}
                                        <div className="absolute top-0 left-0 w-1 h-full bg-brand-accent/40"></div>

                                        <div className="mb-6 md:mb-0 max-w-3xl">
                                            <div className="flex items-center gap-3 mb-3">
                                                <span className="w-10 h-10 rounded-xl bg-brand-primary/5 flex items-center justify-center text-brand-primary">
                                                    <i className="fas fa-paper-plane text-xs"></i>
                                                </span>
                                                <h4 className="font-black text-gray-900 text-lg tracking-tight">{item.title}</h4>
                                                <span className="text-[9px] font-black px-3 py-1 rounded-full bg-brand-accent text-brand-primary uppercase tracking-tighter shadow-sm border border-brand-accent/20">{item.type}</span>
                                            </div>
                                            <p className="text-sm text-gray-500 font-medium leading-relaxed mb-4">{item.message}</p>
                                            <div className="flex flex-wrap items-center gap-6">
                                                <div className="flex items-center gap-2 text-[11px] font-black text-gray-400 uppercase tracking-widest">
                                                    <i className="far fa-calendar-alt text-brand-primary/40"></i>
                                                    {formatRelativeTime(item.created_at)}
                                                </div>
                                                <div className="flex items-center gap-2 text-[11px] font-black text-gray-400 uppercase tracking-widest">
                                                    <i className="fas fa-users-viewfinder text-brand-primary/40"></i>
                                                    {item.recipientCount} <span className="text-[9px]">Sertifikalı Alıcı</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-end gap-3 pt-6 md:pt-0 border-t border-gray-50 md:border-0">
                                            <button
                                                onClick={() => handleDeleteBroadcast(item.batch_id)}
                                                className="w-12 h-12 rounded-2xl flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 hover:scale-110 transition-all border border-transparent hover:border-red-100 shadow-sm hover:shadow-md"
                                                title="Bildirimi Geri Çek"
                                            >
                                                <i className="fas fa-trash-alt text-sm"></i>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            <ConfirmModal
                isOpen={!!deleteBatchId}
                isLoading={isDeleting}
                onClose={() => setDeleteBatchId(null)}
                onConfirm={confirmDelete}
                title="Yayın Geri Çekme"
                message="Bu duyuruyu tüm kullanıcılardan geri çekmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
            />
        </div>
    );
}
