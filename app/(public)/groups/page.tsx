"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import GroupCard from "@/app/components/GroupCard";

export interface Group {
    id: string;
    title: string;
    description: string | null;
    thumbnail_url: string | null;
    teacher_id: string;
    lessons_count: number;
    start_date: string;
    end_date: string;
    hours_per_session: number;
    price: number;
    max_students: number;
    google_meet_link: string | null;
    is_published: boolean;
    created_at: string;
    // Joined fields from profiles and group_enrollments
    teacher_name?: string;
    enrolled_count?: number;
}

export default function GroupsPage() {
    const [groups, setGroups] = useState<Group[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;

        async function fetchGroups() {
            try {
                const supabase = createClient();
                const { data, error } = await supabase
                    .from('groups')
                    .select('*, profiles!groups_teacher_id_fkey(full_name), group_enrollments(count)')
                    .eq('is_published', true)
                    .order('created_at', { ascending: false });

                if (error) {
                    console.error("Supabase error fetching groups:", error);
                    throw error;
                }

                if (isMounted) {
                    // Map the joined data properly
                    const formattedGroups: Group[] = (data || []).map((g: any) => ({
                        ...g,
                        teacher_name: g.profiles?.full_name || 'Öğretmen Bilgisi Yok',
                        enrolled_count: g.group_enrollments?.[0]?.count || 0,
                    }));
                    setGroups(formattedGroups);
                }
            } catch (err: any) {
                console.error("Error fetching groups:", err);
                if (isMounted) {
                    setError("Gruplar yüklenirken bir hata oluştu.");
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        }

        fetchGroups();

        return () => {
            isMounted = false;
        };
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans" dir="rtl">
            {/* Header Section */}
            <header className="bg-brand-primary text-white py-16 md:py-20 relative overflow-hidden">
                <div className="absolute inset-0 z-0 opacity-10">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2"></div>
                    <div className="absolute bottom-0 left-0 w-80 h-80 bg-brand-accent rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2"></div>
                </div>

                <div className="max-w-[1200px] mx-auto px-4 relative z-10 text-center">
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-black mb-6 tracking-tight">
                        Eğitim Grupları
                    </h1>
                    <p className="text-lg md:text-xl max-w-2xl mx-auto text-brand-primary-light font-medium leading-relaxed">
                        Deneyimli eğitmenlerimiz eşliğinde, düzenli programlarla toplu eğitim gruplarına katılın.
                    </p>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 max-w-[1200px] mx-auto px-4 py-12 w-full">
                {/* Status Handling */}
                {loading ? (
                    <div className="flex flex-col justify-center items-center py-20 min-h-[400px]">
                        <div className="w-16 h-16 border-4 border-gray-200 border-t-brand-primary rounded-full animate-spin shadow-md mb-4"></div>
                        <p className="text-gray-500 font-medium animate-pulse">Gruplar Yükleniyor...</p>
                    </div>
                ) : error ? (
                    <div className="bg-red-50 text-red-600 p-8 rounded-2xl border border-red-100 text-center max-w-md mx-auto shadow-sm min-h-[200px] flex flex-col justify-center items-center">
                        <i className="fas fa-exclamation-circle text-4xl mb-3 text-red-500/80"></i>
                        <h3 className="font-bold text-lg mb-2">Eyvah!</h3>
                        <p className="text-red-600/80">{error}</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="mt-6 px-6 py-2.5 bg-red-100 hover:bg-red-200 text-red-700 font-bold rounded-lg transition-colors shadow-sm"
                        >
                            Tekrar Dene
                        </button>
                    </div>
                ) : groups.length === 0 ? (
                    <div className="bg-white p-12 rounded-3xl text-center border border-gray-100 shadow-sm min-h-[400px] flex flex-col justify-center items-center">
                        <div className="w-24 h-24 bg-brand-primary/10 rounded-full flex items-center justify-center mb-6 mx-auto">
                            <i className="fas fa-users text-4xl text-brand-primary/50"></i>
                        </div>
                        <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-3">Şu Anda Aktif Grup Bulunmamaktadır</h3>
                        <p className="text-gray-500 max-w-md mx-auto leading-relaxed">
                            Yakında yeni eğitim gruplarımız eklenecektir. Lütfen daha sonra tekrar kontrol edin.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                        {groups.map((group) => (
                            <GroupCard key={group.id} group={group} />
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
