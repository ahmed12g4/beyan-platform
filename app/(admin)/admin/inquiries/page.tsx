import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import InquiryActions from './InquiryActions'
import PageHeader from '@/components/admin/PageHeader'

export default async function AdminInquiriesPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/giris')

    // Verify admin
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single() as { data: { role: string } | null }
    if (profile?.role !== 'admin') redirect('/')

    // Fetch messages
    const { data: messages, error } = await supabase
        .from('contact_messages' as any)
        .select('*')
        .order('created_at', { ascending: false })

    if (error) {
        return (
            <div className="p-8">
                <div className="max-w-2xl mx-auto bg-white border border-red-100 rounded-md p-8 shadow-sm text-center">
                    <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                        <i className="fas fa-exclamation-triangle text-2xl"></i>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Sistem Hatası</h2>
                    <p className="text-gray-500 mb-6">İletişim mesajları tablosu bulunamadı. Lütfen teknik ekiple iletişime geçin.</p>
                    <div className="bg-gray-50 p-4 rounded-md text-left font-mono text-xs text-gray-600 overflow-auto">
                        {error.message} (Code: {error.code})
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 animate-fadeIn">
            <PageHeader
                title="İletişim Talepleri"
                icon="fa-envelope-open-text"
                subtitle={`${messages?.length || 0} mesaj listeleniyor`}
            />

            <div className="bg-white rounded-lg border border-gray-100/80 shadow-sm overflow-x-auto hover:shadow-md transition-shadow">
                <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead>
                        <tr className="bg-gray-50/50 border-b border-gray-100/80">
                            <th className="px-6 py-4 text-xs font-extrabold text-brand-primary uppercase tracking-wider">GÖNDEREN</th>
                            <th className="px-6 py-4 text-xs font-extrabold text-brand-primary uppercase tracking-wider">KONU & MESAJ</th>
                            <th className="px-6 py-4 text-xs font-extrabold text-brand-primary uppercase tracking-wider">TARİH</th>
                            <th className="px-6 py-4 text-xs font-extrabold text-brand-primary uppercase tracking-wider text-right">İŞLEMLER</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {(!messages || messages.length === 0) ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-12 text-center text-gray-400">
                                    <i className="fas fa-envelope-open text-3xl mb-2 text-gray-300"></i>
                                    <p className="text-sm font-medium">Kayıt Bulunamadı</p>
                                </td>
                            </tr>
                        ) : (
                            messages.map((msg: any) => (
                                <tr key={msg.id} className={`hover:bg-gray-50/80 transition-all group ${!msg.is_read ? 'bg-[#fffbeb]/40' : ''}`}>
                                    <td className="px-6 py-4">
                                        <div className="font-semibold text-gray-900">{msg.full_name}</div>
                                        <div className="text-[11px] text-gray-400 font-medium">{msg.email}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 mb-1">
                                            {!msg.is_read && <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>}
                                            <span className="font-semibold text-gray-800">{msg.subject || '(Konu yok)'}</span>
                                        </div>
                                        <div className="text-xs text-gray-500 line-clamp-2 max-w-md">{msg.message}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-xs font-medium text-gray-500">
                                        {new Date(msg.created_at).toLocaleDateString('tr-TR', {
                                            day: 'numeric',
                                            month: 'long',
                                            year: 'numeric'
                                        })}
                                        <div className="text-[10px] text-gray-400 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {new Date(msg.created_at).toLocaleTimeString('tr-TR', {
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <InquiryActions id={msg.id} isRead={msg.is_read} />
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
