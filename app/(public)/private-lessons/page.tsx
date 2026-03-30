"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import TeacherCard from "@/app/components/TeacherCard";

interface Teacher {
    id: string;
    user_id: string;
    full_name: string;
    bio: string | null;
    specialization: string | null;
    photo_url: string | null;
    price_per_lesson: number;
    is_available: boolean;
    created_at: string;
}

export default function PrivateLessonsPage() {
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [filteredTeachers, setFilteredTeachers] = useState<Teacher[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchTeachers() {
            try {
                const supabase = createClient();
                const { data, error } = await supabase
                    .from('profiles')
                    .select('*, teachers(*)')
                    .eq('role', 'teacher')
                    .order('created_at', { ascending: false });

                if (error) {
                    throw error;
                }

                // Flatten the data for easier use in TeacherCard
                const flattened = (data || []).map((p: any) => ({
                    ...p,
                    price_per_lesson: p.teachers?.[0]?.price_per_lesson || 150,
                    is_available: p.teachers?.[0]?.is_available ?? true,
                    specialization: p.teachers?.[0]?.specialization || p.specialization
                }));

                setTeachers(flattened);
                setFilteredTeachers(flattened);
            } catch (err: any) {
                console.error("Error fetching teachers:", err);
                setError("Eğitmen verileri yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.");
            } finally {
                setLoading(false);
            }
        }

        fetchTeachers();
    }, []);

    // Handle Search
    useEffect(() => {
        if (!searchQuery.trim()) {
            setFilteredTeachers(teachers);
            return;
        }

        const lowerQuery = searchQuery.toLowerCase();
        const filtered = teachers.filter((t) =>
            t.full_name.toLowerCase().includes(lowerQuery) ||
            (t.specialization && t.specialization.toLowerCase().includes(lowerQuery)) ||
            (t.bio && t.bio.toLowerCase().includes(lowerQuery))
        );

        setFilteredTeachers(filtered);
    }, [searchQuery, teachers]);

    return (
        <div className="min-h-screen bg-[#F8F9FA] pb-24 font-sans" dir="rtl">

            {/* Header / Hero Section */}
            <div className="bg-brand-primary text-white pt-20 pb-16 px-4 shadow-sm relative overflow-hidden">
                <div className="absolute inset-0 bg-brand-primary opacity-95"></div>
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-brand-accent rounded-full opacity-10 blur-3xl"></div>

                <div className="max-w-[1200px] mx-auto relative z-10 text-center">
                    <h1 className="text-3xl md:text-5xl font-bold mb-4">Canlı Özel Dersler</h1>
                    <p className="text-lg text-white/80 max-w-2xl mx-auto font-light leading-relaxed">
                        Favori eğitmeninizi seçin ve seviyenize ve eğitim ihtiyaçlarına özel tasarlanmış birebir dersler alın.
                        Zaman esnekliği ve sürekli takip.
                    </p>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="max-w-[1200px] mx-auto px-4 mt-12 bg-transparent z-20 relative">

                {/* Search & Filter (Static for now, can be dynamic later) */}
                <div className="mb-8 flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100 gap-4">
                    <div className="text-gray-600 font-medium">
                        Şu anda <strong className="text-brand-primary">{filteredTeachers.length}</strong> eğitmen gösteriliyor
                    </div>
                    <div className="w-full md:w-auto flex gap-2 relative">
                        <i className="fas fa-search absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                        <input
                            type="text"
                            placeholder="Eğitmen veya uzmanlık arayın..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-gray-50 border border-gray-200 rounded-lg pr-10 pl-4 py-2 text-gray-700 text-sm w-full md:w-[300px] focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all"
                        />
                    </div>
                </div>

                {loading ? (
                    // Loading Skeletons Grid
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[420px] animate-pulse">
                                <div className="h-[200px] bg-gray-200 w-full"></div>
                                <div className="p-6 flex flex-col flex-1">
                                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                                    <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
                                    <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                                    <div className="h-4 bg-gray-200 rounded w-5/6 mb-6"></div>

                                    <div className="mt-auto flex justify-between items-center border-t border-gray-100 pt-4 mb-4">
                                        <div className="h-4 bg-gray-200 rounded w-16"></div>
                                        <div className="h-6 bg-gray-200 rounded w-24"></div>
                                    </div>
                                    <div className="h-12 bg-gray-200 rounded-lg w-full"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : error ? (
                    // Error State
                    <div className="bg-red-50 text-red-600 p-8 rounded-xl text-center border border-red-100 my-12 max-w-2xl mx-auto shadow-sm">
                        <i className="fas fa-exclamation-circle text-4xl mb-4 text-red-400"></i>
                        <h3 className="text-xl font-bold mb-2">Üzgünüz, bir hata oluştu</h3>
                        <p>{error}</p>
                        <button onClick={() => window.location.reload()} className="mt-6 bg-white text-red-600 border border-red-200 px-6 py-2 rounded-lg font-medium hover:bg-red-50 transition-colors">
                            Tekrar Dene
                        </button>
                    </div>
                ) : filteredTeachers.length === 0 ? (
                    // Empty State
                    <div className="bg-white p-12 rounded-2xl text-center border border-gray-100 shadow-sm my-12 max-w-3xl mx-auto">
                        <div className="w-24 h-24 bg-brand-primary/5 rounded-full flex items-center justify-center mx-auto mb-6">
                            <i className="fas fa-chalkboard-teacher text-4xl text-brand-primary/40"></i>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-800 mb-3">
                            {searchQuery ? "Arama sonucu bulunamadı" : "Şu anda müsait eğitmen bulunmuyor"}
                        </h3>
                        <p className="text-gray-500 max-w-md mx-auto leading-relaxed">
                            {searchQuery
                                ? "Farklı kelimelerle aramayı deneyin veya yazımını kontrol edin."
                                : "Eğitim ihtiyaçlarınızı karşılamak için yakında daha fazla eğitmen sunmaya çalışıyoruz. Lütfen daha sonra tekrar kontrol edin."}
                        </p>
                    </div>
                ) : (
                    // Success Grid
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                        {filteredTeachers.map((teacher) => (
                            <TeacherCard key={teacher.id} teacher={teacher} />
                        ))}
                    </div>
                )}
            </div>

        </div>
    );
}
