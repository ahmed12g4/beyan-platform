'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import toast from 'react-hot-toast';
import PageHeader from '@/components/admin/PageHeader';
import Avatar from '@/components/Avatar';

// Types
type Profile = {
    id: string;
    full_name: string;
    avatar_url: string | null;
    email?: string;
    role: string;
};

type Message = {
    id: string;
    content: string;
    sender_id: string;
    receiver_id: string;
    created_at: string;
    is_read: boolean;
};

type Conversation = {
    user: Profile;
    last_message: Message | null;
    unread_count: number;
};

// Role helpers
const getRoleLabel = (role: string) => {
    switch (role) {
        case 'admin': return 'Yönetici';
        case 'teacher': return 'Öğretmen';
        case 'student': return 'Öğrenci';
        default: return role;
    }
};

const getRoleBadgeColor = (role: string) => {
    switch (role) {
        case 'admin': return 'bg-red-100 text-red-700 border-red-200';
        case 'teacher': return 'bg-blue-100 text-blue-700 border-blue-200';
        case 'student': return 'bg-green-100 text-green-700 border-green-200';
        default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
};

export default function UserMessagesPage() {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedUser, setSelectedUser] = useState<Conversation['user'] | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { user, profile } = useCurrentUser();
    const isAdmin = profile?.role === 'admin';
    const supabase = createClient();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Profile[]>([]);

    // Search Users
    useEffect(() => {
        if (!searchQuery.trim()) {
            setSearchResults([]);
            return;
        }

        const delayDebounceFn = setTimeout(async () => {
            try {
                let data: any = null;
                if (isAdmin) {
                    const res = await supabase
                        .from('profiles')
                        .select('id, full_name, avatar_url, email, role')
                        .ilike('full_name', `%${searchQuery}%`)
                        .neq('id', user?.id || '')
                        .limit(20);
                    data = res.data;
                } else {
                    const res = await supabase
                        .from('profiles')
                        .select('id, full_name, avatar_url, role')
                        .ilike('full_name', `%${searchQuery}%`)
                        .neq('id', user?.id || '')
                        .limit(20);
                    data = res.data;
                }

                if (data) setSearchResults(data);
            } catch (error) {
                console.error('Search error:', error);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery, user?.id]);

    // Fetch conversations
    useEffect(() => {
        const fetchConversations = async () => {
            if (!user?.id || !profile?.role) return;

            try {
                const isAdmin = profile.role === 'admin';
                let processedConvs: Conversation[] = [];

                // 1. Try to use the optimized RPC
                // @ts-ignore - Supabase type might not be updated yet
                const { data: recent, error: rpcError } = await supabase.rpc('get_recent_conversations', {
                    p_user_id: user.id,
                    p_limit: 50
                });

                if (!rpcError && recent) {
                    const recentArray = (Array.isArray(recent) ? recent : []) as any[];
                    processedConvs = recentArray.map((r: any) => ({
                        user: {
                            id: r.user_id,
                            full_name: r.full_name,
                            avatar_url: r.avatar_url,
                            role: r.role,
                            email: r.email
                        },
                        last_message: r.last_message_id ? {
                            id: r.last_message_id,
                            content: r.last_message_content,
                            sender_id: r.last_message_sender_id,
                            receiver_id: r.last_message_sender_id === user.id ? r.user_id : user.id,
                            created_at: r.last_message_created_at,
                            is_read: r.unread_count === 0
                        } : null,
                        unread_count: Number(r.unread_count)
                    }));
                }

                if (rpcError) {
                    console.error('RPC Error (get_recent_conversations might be missing):', rpcError);
                }

                // Fallback for missing admin or empty conversations
                if (processedConvs.length === 0 && isAdmin) {
                    // Start admins with some defaults if empty
                    const { data: recentProfiles } = await supabase
                        .from('profiles')
                        .select('id, full_name, avatar_url, email, role')
                        .in('role', ['student', 'teacher'])
                        .neq('id', user.id)
                        .limit(10);

                    if (recentProfiles) {
                        processedConvs = recentProfiles.map((p: any) => ({
                            user: p,
                            last_message: null,
                            unread_count: 0
                        }));
                    }
                } else if (!isAdmin) {
                    // Ensure non-admins have admin in their list
                    const hasAdmin = processedConvs.some(c => c.user.role === 'admin');
                    if (!hasAdmin) {
                        const { data: admins } = await supabase
                            .from('profiles')
                            .select('id, full_name, avatar_url, role')
                            .eq('role', 'admin')
                            .limit(1);

                        if (admins && admins.length > 0) {
                            processedConvs.push({
                                user: admins[0] as Profile,
                                last_message: null,
                                unread_count: 0
                            });
                        }
                    }
                }

                setConversations(processedConvs.sort((a, b) => {
                    if (a.unread_count > 0 && b.unread_count === 0) return -1;
                    if (b.unread_count > 0 && a.unread_count === 0) return 1;
                    const da = new Date(a.last_message?.created_at || 0).getTime();
                    const db = new Date(b.last_message?.created_at || 0).getTime();
                    return db - da; // Newer first
                }));

            } catch (error) {
                console.error('Error fetching conversations:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchConversations();

        const channel = supabase
            .channel('public:messages_global')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => {
                fetchConversations();
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };

    }, [user?.id, profile?.role]);

    // Message Fetching & Real-time
    useEffect(() => {
        if (!selectedUser || !user?.id) return;

        const fetchMessages = async () => {
            const { data } = await supabase
                .from('messages')
                .select('*')
                .or(`and(sender_id.eq.${user.id},receiver_id.eq.${selectedUser.id}),and(sender_id.eq.${selectedUser.id},receiver_id.eq.${user.id})`)
                .order('created_at', { ascending: false })
                .limit(50);

            setMessages((data as Message[] || []).reverse());

            // Mark as read immediately
            if (data?.some(m => !m.is_read && m.receiver_id === user.id)) {
                await supabase
                    .from('messages')
                    .update({ is_read: true })
                    .eq('sender_id', selectedUser.id)
                    .eq('receiver_id', user.id)
                    .eq('is_read', false); // Only target unread messages

                // Update conversation's unread count locally for instant UI feedback
                setConversations(prev => prev.map(conv =>
                    conv.user.id === selectedUser.id ? { ...conv, unread_count: 0 } : conv
                ));

                // Force layout header to refresh its unread count
                window.dispatchEvent(new Event('beyan-refresh-unread-count'));
            }
        };

        fetchMessages();

        // Subscribe to NEW and UPDATED messages in this chat
        const channel = supabase
            .channel(`chat:${selectedUser.id}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `receiver_id=eq.${user.id}`
            }, (payload) => {
                const newMsg = payload.new as Message;
                // Only append if it's from the selected user
                if (newMsg.sender_id === selectedUser.id) {
                    setMessages(prev => {
                        // Prevent duplicates from optimistic UI if any
                        if (prev.some(m => m.id === newMsg.id)) return prev;
                        return [...prev, newMsg];
                    });
                    // Mark this specific message as read
                    supabase.from('messages').update({ is_read: true }).eq('id', newMsg.id).then();

                    // Force the UI to show it as read immediately for the sender side
                    setMessages(prev => prev.map(m =>
                        m.id === newMsg.id ? { ...m, is_read: true } : m
                    ));
                }
            })
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'messages',
                filter: `sender_id=eq.${user.id}`
            }, (payload) => {
                const updatedMsg = payload.new as Message;
                // Update local status if the receiver updated the message (e.g., marked as read)
                if (updatedMsg.receiver_id === selectedUser.id) {
                    setMessages(prev => prev.map(msg =>
                        msg.id === updatedMsg.id ? { ...msg, is_read: updatedMsg.is_read } : msg
                    ));
                }
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [selectedUser?.id, user?.id]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedUser || !user?.id) return;

        const optimisticMsg: Message = {
            id: Math.random().toString(),
            content: newMessage,
            sender_id: user.id,
            receiver_id: selectedUser.id,
            created_at: new Date().toISOString(),
            is_read: false
        };

        setMessages(prev => [...prev, optimisticMsg]);
        setNewMessage('');

        try {
            const { data, error } = await supabase.from('messages').insert({
                sender_id: user.id,
                receiver_id: selectedUser.id,
                content: optimisticMsg.content,
            }).select().single();

            if (error) throw error;

            // Replace the optimistic random ID with the real UUID returned from the database
            if (data) {
                setMessages(prev => prev.map(m => m.id === optimisticMsg.id ? data as Message : m));
            }
        } catch (error) {
            toast.error('Mesaj gönderilemedi');
            // Remove optimistic message on error
            setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id));
        }
    };

    if (loading) return <div className="h-96 flex items-center justify-center text-gray-500">Yükleniyor...</div>;

    // "Professional Box" Layout
    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 animate-fadeIn flex flex-col h-screen max-h-[900px]">
            <PageHeader
                title="Mesaj Merkezi"
                icon="fa-comments"
                subtitle="Öğrenciler ve eğitmenlerle doğrudan iletişim kurun."
            />
            <div className="bg-white rounded-lg shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden flex flex-1 w-full relative">

                {/* Sidebar */}
                <div className={`w-full md:w-64 lg:w-72 flex flex-col border-r border-gray-100 bg-white z-20 ${selectedUser ? 'hidden md:flex' : 'flex'}`}>

                    {/* Search */}
                    <div className="p-4 border-b border-gray-100 bg-white">
                        <div className="bg-gray-50 rounded-lg px-4 py-2.5 flex items-center focus-within:ring-2 focus-within:ring-brand-primary/20 border border-gray-100 transition-all">
                            <i className="fas fa-search text-gray-400 mr-2 text-[14px]"></i>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Kullanıcı ara..."
                                className="bg-transparent border-none focus:ring-0 w-full text-[14px] text-gray-700 placeholder-gray-400"
                            />
                        </div>
                    </div>

                    {/* List */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {searchQuery.trim() ? (
                            searchResults.length === 0 ? (
                                <div className="p-8 text-center text-gray-400 text-sm">Sonuç bulunamadı</div>
                            ) : (
                                <div>
                                    <div className="px-4 py-2 text-xs font-semibold text-gray-500 bg-gray-50 border-b border-gray-100">Arama Sonuçları</div>
                                    {searchResults.map((profile) => (
                                        <div
                                            key={profile.id}
                                            onClick={() => {
                                                setSelectedUser(profile);
                                                setSearchQuery('');
                                            }}
                                            className="px-4 py-2.5 cursor-pointer transition-all hover:bg-gray-50 flex gap-2.5 items-center border-l-2 border-l-transparent"
                                        >
                                            <Avatar name={profile.full_name} src={profile.avatar_url || undefined} size={36} />
                                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-gray-900 truncate text-[14px] leading-none">{profile.full_name}</span>
                                                    <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium leading-none ${getRoleBadgeColor(profile.role)}`}>
                                                        {getRoleLabel(profile.role)}
                                                    </span>
                                                </div>
                                                <span className="text-[12px] text-gray-400 block truncate leading-none mt-1">{profile.email}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )
                        ) : (
                            conversations.length === 0 ? (
                                <div className="p-8 text-center text-gray-400 text-sm">Henüz mesaj yok</div>
                            ) : (
                                conversations.map((conv) => (
                                    <div
                                        key={conv.user.id}
                                        onClick={() => setSelectedUser(conv.user)}
                                        className={`px-4 py-3 flex gap-3 cursor-pointer transition-colors border-b border-gray-50 ${selectedUser?.id === conv.user.id ? 'bg-brand-primary/5 border-l-2 border-l-[#204544]' : 'hover:bg-gray-50 border-l-2 border-l-transparent'}`}
                                    >
                                        <div className="relative flex-shrink-0">
                                            <Avatar name={conv.user.full_name} src={conv.user.avatar_url || undefined} size={44} />
                                            {conv.unread_count > 0 && (
                                                <span className="absolute -top-1 -right-1 w-4 h-4 bg-brand-accent text-brand-primary text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white shadow-sm">
                                                    {conv.unread_count}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                                            <div className="flex justify-between items-center mb-0.5">
                                                <span className={`font-bold truncate text-[14px] leading-none ${selectedUser?.id === conv.user.id ? 'text-brand-primary' : 'text-gray-900'}`}>{conv.user.full_name}</span>
                                                <span className="text-[11px] text-gray-400 leading-none">
                                                    {conv.last_message && new Date(conv.last_message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <p className={`text-[13px] truncate leading-tight mt-1 ${conv.unread_count > 0 ? 'font-bold text-gray-900' : 'text-gray-500'}`}>
                                                {conv.last_message?.content || 'Yeni Sohbet'}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )
                        )}
                    </div>
                </div>

                {/* Chat Area */}
                <div className={`flex-1 flex flex-col bg-gray-50/30 relative ${!selectedUser ? 'hidden md:flex' : 'flex'}`}>
                    {selectedUser ? (
                        <>
                            {/* Header */}
                            <div className="h-16 px-6 flex items-center justify-between bg-white border-b border-gray-100 z-10 w-full shadow-sm/50">
                                <div className="flex items-center gap-3">
                                    <button onClick={() => setSelectedUser(null)} className="md:hidden text-gray-400 hover:text-gray-700 p-2 flex-shrink-0 active:scale-95 transition-transform"><i className="fas fa-arrow-left"></i></button>
                                    <Avatar name={selectedUser.full_name} src={selectedUser.avatar_url || undefined} size={44} />
                                    <div className="flex flex-col justify-center min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-gray-900 text-[16px] truncate">
                                                {selectedUser.full_name}
                                            </span>
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold uppercase tracking-wide flex-shrink-0 whitespace-nowrap hidden sm:inline-block ${getRoleBadgeColor(selectedUser.role)}`}>
                                                {getRoleLabel(selectedUser.role)}
                                            </span>
                                        </div>
                                        {isAdmin && (
                                            <span className="text-[12px] text-gray-500 truncate mt-0.5 hidden sm:inline-block">{selectedUser.email}</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 custom-scrollbar">
                                {messages.map((msg) => {
                                    const isMe = msg.sender_id === user?.id;
                                    return (
                                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                            <div className="flex flex-col gap-1 max-w-[75%] md:max-w-[65%]">
                                                <div className={`relative px-4 py-2.5 shadow-sm text-[15px] ${isMe ? 'bg-brand-primary text-white rounded-lg rounded-tr-sm' : 'bg-white text-gray-800 rounded-lg rounded-tl-sm border border-gray-100'}`}>
                                                    <div className="break-words leading-relaxed">{msg.content}</div>
                                                </div>
                                                <div className={`flex items-center gap-1.5 opacity-80 px-1.5 text-[11px] text-gray-500 ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                    <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                    {isMe && <i className={`fas ${msg.is_read ? 'fa-check-double text-green-500 text-[12px]' : 'fa-check text-[12px] text-gray-400'}`}></i>}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input */}
                            <div className="p-4 bg-white border-t border-gray-100">
                                <form onSubmit={handleSendMessage} className="flex gap-2 max-w-4xl mx-auto items-center">
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder="Mesajınızı buraya yazın..."
                                        className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3.5 text-[14px] focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!newMessage.trim() || sending}
                                        className="h-[48px] w-[48px] md:w-auto md:px-6 bg-brand-primary text-white rounded-lg flex items-center justify-center hover:bg-brand-primary-dark disabled:opacity-50 transition-all focus:ring-2 focus:ring-brand-primary/30 shadow-sm active:scale-95"
                                    >
                                        <i className="fas fa-paper-plane md:mr-2 text-md"></i>
                                        <span className="hidden md:inline text-[14px] font-semibold tracking-wide">Gönder</span>
                                    </button>
                                </form>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                            <div className="w-20 h-20 bg-white border border-gray-100 rounded-lg shadow-sm flex items-center justify-center mb-6 text-brand-primary">
                                <i className="fas fa-comments text-3xl"></i>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Mesaj Merkezi</h3>
                            <p className="text-sm text-gray-500 max-w-xs">İletişim kurmak için sol taraftan bir kişi seçin veya arayın.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
