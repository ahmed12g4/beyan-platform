'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import Avatar from '@/components/Avatar';
import AdminCard from '@/components/admin/AdminCard';
import PageHeader from '@/components/admin/PageHeader';
import { createClient } from '@/lib/supabase/client';
import { toggleUserStatus, deleteUser, updateUserRole, getUsers } from '@/lib/actions/admin';
import toast from 'react-hot-toast';
import ConfirmModal from '@/components/ConfirmModal';
import PaginationControls from '@/components/PaginationControls';

interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
  avatar_url: string | null;
}

type TabType = 'ALL' | 'TEACHERS' | 'STUDENTS' | 'ADMINS' | 'PENDING';

function UsersTable() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const page = Number(searchParams.get('page')) || 1;
  const search = searchParams.get('search') || '';
  const activeTab = (searchParams.get('tab') as TabType) || 'ALL';
  const limit = 20;

  const [users, setUsers] = useState<Profile[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState(search);

  // Debounce search update
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== search) {
        const params = new URLSearchParams(searchParams.toString());
        if (searchTerm) params.set('search', searchTerm);
        else params.delete('search');
        params.set('page', '1'); // Reset to page 1 on search
        router.push(`${pathname}?${params.toString()}`);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, search, searchParams, router, pathname]);

  const handleTabChange = (tab: TabType) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    params.set('page', '1'); // Reset to page 1 on tab change
    router.push(`${pathname}?${params.toString()}`);
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, totalCount } = await getUsers(page, limit, search, activeTab);
      setUsers(data);
      setTotalCount(totalCount);
    } catch (error) {
      toast.error('Kullanıcılar yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, search, activeTab]);

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    setActionLoading(id);
    const result = await toggleUserStatus(id, currentStatus);

    if (result.success) {
      setUsers(prev => prev.map(u => u.id === id ? { ...u, is_active: !currentStatus } : u));
      toast.success(result.message || 'Durum güncellendi');
      // If filtering by pending, we might want to refetch or remove the item
      if (activeTab === 'PENDING') fetchUsers();
    } else {
      toast.error(result.error || 'İşlem başarısız');
    }
    setActionLoading(null);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setActionLoading(deleteId);

    const result = await deleteUser(deleteId);

    if (result.success) {
      setUsers(prev => prev.filter(u => u.id !== deleteId));
      toast.success(result.message || 'Kullanıcı silindi');
    } else {
      toast.error(result.error || 'Silme işlemi başarısız');
    }

    setDeleteId(null);
    setActionLoading(null);
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    setActionLoading(userId);
    const result = await updateUserRole(userId, newRole);

    if (result.success) {
      // Determine is_active based on the same logic as the server action
      const newIsActive = newRole === 'teacher' ? false : true;
      setUsers(prev => prev.map(u => u.id === userId
        ? { ...u, role: newRole, is_active: newIsActive }
        : u
      ));
      toast.success(result.message || 'Rol güncellendi');
      // Always refetch to ensure consistency with DB
      fetchUsers();
    } else {
      toast.error(result.error || 'Rol güncellenemedi');
    }
    setActionLoading(null);
  };

  const roleBadge = (role: string) => {
    const map: Record<string, string> = {
      admin: 'bg-amber-50 text-amber-600',
      teacher: 'bg-purple-50 text-purple-600',
      student: 'bg-blue-50 text-blue-600',
    };
    const roleLabels: Record<string, string> = {
      admin: 'Yönetici',
      teacher: 'Öğretmen',
      student: 'Öğrenci',
    };
    return (
      <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${map[role] || 'bg-gray-50 text-gray-600'}`}>
        {roleLabels[role] || role}
      </span>
    );
  };

  if (loading && users.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 animate-fadeIn">
        <div className="flex items-center justify-center h-64">
          <svg className="animate-spin h-8 w-8 text-brand-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 animate-fadeIn">
      <PageHeader
        title="Kullanıcı Yönetimi"
        icon="fa-user-friends"
        subtitle={`${totalCount} kayıtlı kullanıcı bu panelden yönetiliyor`}
        action={
          <div className="relative w-full sm:w-80 group">
            <i className="fas fa-search absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-brand-primary transition-colors text-sm"></i>
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="İsim أو E-posta ile ara..."
              className="w-full pl-14 pr-6 py-4 bg-white/80 border-2 border-gray-100/50 rounded-2xl focus:outline-none focus:ring-8 focus:ring-brand-primary/5 focus:border-brand-primary transition-all text-sm font-bold text-gray-900 shadow-sm placeholder:text-gray-300"
            />
          </div>
        }
      />

      {/* Tabs Styling */}
      <div className="flex bg-white/40 backdrop-blur-xl sticky top-[72px] z-40 px-6 pt-4 border border-white/20 rounded-t-3xl mt-12 gap-6 sm:gap-10 justify-start sm:justify-center shadow-[0_8px_32px_rgba(0,0,0,0.03)] border-b-0 overflow-x-auto scrollbar-hide">
        {[
          { id: 'ALL', label: 'Tümü', icon: 'fa-users' },
          { id: 'TEACHERS', label: 'Öğretmenler', icon: 'fa-chalkboard-teacher' },
          { id: 'STUDENTS', label: 'Öğrenciler', icon: 'fa-user-graduate' },
          { id: 'ADMINS', label: 'Yöneticiler', icon: 'fa-shield-alt' },
          { id: 'PENDING', label: 'Onay Bekleyen', icon: 'fa-clock', highlight: true }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id as TabType)}
            className={`pb-4 px-2 font-black text-[10px] sm:text-xs uppercase tracking-widest transition-all relative whitespace-nowrap flex items-center gap-2 ${activeTab === tab.id
              ? 'text-brand-primary'
              : tab.highlight ? 'text-amber-500 hover:text-amber-600' : 'text-gray-400 hover:text-gray-600'
              }`}
          >
            <i className={`fas ${tab.icon} text-[10px]`}></i>
            {tab.label}
            {activeTab === tab.id && (
              <span className="absolute bottom-0 left-0 right-0 h-1 bg-brand-primary rounded-t-full shadow-[0_-4px_10px_rgba(32,69,68,0.2)]"></span>
            )}
          </button>
        ))}
      </div>

      <div className="bg-white/60 backdrop-blur-2xl rounded-b-[40px] shadow-2xl shadow-gray-200/50 border border-white/20 p-6 md:p-10 mb-10 overflow-hidden relative min-h-[400px]">
        {/* Decorative Elements */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-brand-accent opacity-[0.03] rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-brand-primary opacity-[0.03] rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10">
          {users.length === 0 ? (
            <div className="text-center py-24 bg-gray-50/50 rounded-[40px] border-2 border-dashed border-gray-100 animate-fadeIn">
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                <i className="fas fa-user-slash text-4xl text-gray-200"></i>
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-2 uppercase tracking-tight">Kullanıcı Bulunamadı</h3>
              <p className="text-sm text-gray-400 font-bold max-w-xs mx-auto">
                {search ? `"${search}" araması için sonuç yok.` : 'Bu kategoride henüz kayıtlı kullanıcı bulunmuyor.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-[32px] border border-gray-100 shadow-sm bg-white/80">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
                    <th className="px-8 py-6 text-[10px] font-black text-brand-primary uppercase tracking-[0.2em]">Kullanıcı Bilgileri</th>
                    <th className="px-8 py-6 text-[10px] font-black text-brand-primary uppercase tracking-[0.2em]">Yetki Grubu</th>
                    <th className="px-8 py-6 text-[10px] font-black text-brand-primary uppercase tracking-[0.2em]">Katılım Tarihi</th>
                    <th className="px-8 py-6 text-[10px] font-black text-brand-primary uppercase tracking-[0.2em] text-right">Yönetim</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {users.map((u) => {
                    const isActive = u.is_active !== false;
                    return (
                      <tr key={u.id} className="hover:bg-brand-primary/[0.01] transition-colors group">
                        <td className="px-8 py-6 whitespace-nowrap">
                          <div className="flex items-center gap-4">
                            <div className="relative">
                              <Avatar
                                src={u.avatar_url || undefined}
                                name={u.full_name || 'User'}
                                size={52}
                                className="border-2 border-white shadow-xl ring-1 ring-gray-100 flex-shrink-0 rounded-2xl"
                              />
                              {!isActive && (
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 border-2 border-white rounded-full shadow-sm animate-pulse" title="Askıda"></div>
                              )}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <div className="text-base font-black text-gray-900 group-hover:text-brand-primary transition-colors truncate tracking-tighter">
                                {u.full_name || 'İsimsiz Kullanıcı'}
                              </div>
                              <div className="text-xs font-bold text-gray-400 mt-0.5 lowercase tracking-tight flex items-center gap-1.5 font-mono">
                                <i className="far fa-envelope text-[10px] opacity-50"></i>
                                {u.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="relative inline-block w-40">
                            <select
                              value={u.role}
                              onChange={(e) => handleRoleChange(u.id, e.target.value)}
                              disabled={actionLoading === u.id}
                              className={`w-full appearance-none pl-4 pr-10 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 cursor-pointer outline-none transition-all focus:ring-8 focus:ring-brand-primary/5 disabled:opacity-50 shadow-sm ${u.role === 'admin'
                                ? 'bg-amber-50 border-amber-100 text-amber-700 hover:border-amber-200'
                                : u.role === 'teacher'
                                  ? 'bg-brand-primary/5 border-brand-primary/10 text-brand-primary hover:border-brand-primary/20'
                                  : 'bg-indigo-50 border-indigo-100 text-indigo-700 hover:border-indigo-200'
                                }`}
                            >
                              <option value="student">Öğrenci</option>
                              <option value="teacher">Öğretmen</option>
                              <option value="admin">Yönetici</option>
                            </select>
                            <i className="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-current opacity-40 text-[9px] pointer-events-none"></i>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex flex-col">
                            <span className="text-xs font-black text-gray-700 uppercase tracking-tighter">
                              {new Date(u.created_at).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' })}
                            </span>
                            <span className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest font-mono">
                              {new Date(u.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex items-center justify-end gap-3">
                            <button
                              onClick={() => handleToggleStatus(u.id, isActive)}
                              disabled={actionLoading === u.id}
                              className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all shadow-sm border-2 ${isActive
                                ? 'bg-white text-amber-500 border-amber-50 hover:bg-amber-50 hover:border-amber-100'
                                : 'bg-green-500 text-white border-green-400 hover:bg-green-600 hover:shadow-lg shadow-green-200'
                                } disabled:opacity-50 active:scale-90`}
                              title={isActive ? 'Kullanıcıyı Askıya Al' : 'Kullanıcıyı Aktifleştir'}
                            >
                              {actionLoading === u.id ? <i className="fas fa-spinner fa-spin text-xs"></i> : <i className={`fas ${isActive ? 'fa-user-slash' : 'fa-user-check'} text-sm`}></i>}
                            </button>
                            <button
                              onClick={() => setDeleteId(u.id)}
                              disabled={actionLoading === u.id}
                              className="w-11 h-11 rounded-2xl flex items-center justify-center transition-all bg-white text-gray-300 border-2 border-gray-50 hover:bg-red-50 hover:border-red-100 hover:text-red-500 hover:scale-105 shadow-sm active:scale-90"
                              title="Kalıcı Olarak Sil"
                            >
                              <i className="fas fa-trash-alt text-sm"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Pagination Container */}
      <div className="flex justify-center mb-10">
        <div className="bg-white/60 backdrop-blur-xl px-1 sm:px-4 py-3 rounded-2xl border border-white/20 shadow-xl inline-block">
          <PaginationControls
            currentPage={page}
            totalPages={Math.ceil(totalCount / limit)}
            hasNextPage={page < Math.ceil(totalCount / limit)}
            hasPrevPage={page > 1}
          />
        </div>
      </div>

      {/* Delete Modal Premium Overlay */}
      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Kritik İşlem Onayı"
        message={
          <div className="text-center p-2">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-exclamation-triangle text-2xl text-red-500 animate-pulse"></i>
            </div>
            <p className="font-bold text-gray-900 leading-relaxed">
              Bu kullanıcıyı ve tüm verilerini (kurslar, kayıtlar vb.) silmek üzeresiniz. <br />
              <span className="text-red-600 uppercase text-xs font-black tracking-widest mt-2 block">Bu işlem geri alınamaz!</span>
            </p>
          </div>
        }
        confirmText="SİLME İŞLEMİNİ ONAYLA"
        isLoading={actionLoading === deleteId}
      />
    </div>
  );
}

export default function UsersPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Yükleniyor...</div>}>
      <UsersTable />
    </Suspense>
  );
}
