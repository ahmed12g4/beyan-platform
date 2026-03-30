"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import TeacherAvailabilityCalendar from "@/app/components/TeacherAvailabilityCalendar";

interface TeacherDetail {
    id: string; // This will be the internal teachers.id
    real_user_id: string; // This will be the profiles.id
    full_name: string;
    bio: string | null;
    avatar_url: string | null;
    role: string;
    specialization?: string;
    price_per_lesson?: number;
    is_available?: boolean;
}

interface StudentBalance {
    lessons_remaining: number;
    lessons_total: number;
}

export default function TeacherDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params?.id as string;

    // Auth & Data states
    const { user, loading: authLoading } = useCurrentUser();
    const [teacher, setTeacher] = useState<TeacherDetail | null>(null);
    const [balance, setBalance] = useState<StudentBalance | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Packages
    const packages = [4, 8, 12, 16];

    // Fetch Teacher
    useEffect(() => {
        let isMounted = true;

        async function fetchTeacherData() {
            if (!id) return;
            try {
                const supabase = createClient();

                // 1. Fetch Profile
                const { data: profileData, error: profileError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', id)
                    .maybeSingle();

                if (profileError) throw profileError;
                if (!profileData) throw new Error("Eğitmen bulunamadı.");

                const profile = profileData as any;

                // 2. Fetch Teacher Details (internal id, price, etc.)
                const { data: teacherData } = await supabase
                    .from('teachers')
                    .select('*')
                    .eq('user_id', id)
                    .maybeSingle();

                if (isMounted) {
                    if (!teacherData) {
                        setError("Bu eğitmen henüz özel ders profilini tamamlamamış.");
                        return;
                    }

                    setTeacher({
                        ...profile,
                        id: (teacherData as any).id, // Must be the internal UUID from 'teachers' table
                        real_user_id: profile.id,
                        price_per_lesson: (teacherData as any).price_per_lesson,
                        is_available: (teacherData as any).is_available,
                        specialization: (teacherData as any).specialization || (profile as any).specialization
                    });
                }
            } catch (err: any) {
                console.error("Error fetching teacher:", err);
                if (isMounted) setError("Eğitmen verileri yüklenemedi.");
            } finally {
                if (isMounted) setLoading(false);
            }
        }

        fetchTeacherData();
        return () => { isMounted = false; };
    }, [id]);

    // Fetch Balance
    useEffect(() => {
        let isMounted = true;

        async function fetchBalance() {
            if (!user || !teacher) return;
            try {
                const supabase = createClient();
                const { data, error } = await supabase
                    .from('student_lesson_balance')
                    .select('lessons_remaining, lessons_total')
                    .eq('student_id', user.id)
                    .eq('teacher_id', (teacher as any).id)
                    .maybeSingle();

                if (error && error.code !== 'PGRST116') {
                    console.error("Error checking balance:", error);
                }

                if (isMounted && data) {
                    setBalance(data as StudentBalance);
                }
            } catch (err) {
                // Ignore empty balance errors
            }
        }

        if (!authLoading && teacher) {
            fetchBalance();
        }

        return () => { isMounted = false; };
    }, [user, authLoading, teacher]);

    const handlePackageClick = (lessonCount: number) => {
        if (!user) {
            router.push(`/giris?redirect=/teachers/${id}`);
            return;
        }

        // Redirect to checkout with query params for the package
        router.push(`/checkout?type=package&productId=${id}&lessons=${lessonCount}`);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F9FA] pt-20">
                <div className="w-12 h-12 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin mb-4"></div>
                <p className="text-gray-500 font-medium select-none">Yükleniyor...</p>
            </div>
        );
    }

    if (error || !teacher) {
        return (
            <div className="min-h-[70vh] flex flex-col items-center justify-center bg-[#F8F9FA] px-4" dir="rtl">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-md text-center">
                    <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i className="fas fa-exclamation-triangle text-2xl"></i>
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Üzgünüz</h3>
                    <p className="text-gray-500 mb-6">{error || "Bu eğitmen bulunamıyor."}</p>
                    <button onClick={() => router.push('/private-lessons')} className="bg-brand-primary text-white font-medium px-6 py-2.5 rounded-lg hover:bg-brand-primary/90 transition-colors">
                        Eğitmenlere Dön
                    </button>
                </div>
            </div>
        );
    }

    // Formatting and Defaults
    const price = teacher?.price_per_lesson ?? 150;
    const hasBalance = !!(balance && balance.lessons_remaining > 0);

    return (
        <div className="min-h-screen bg-[#F8F9FA] pb-24 font-sans" dir="rtl">

            {/* Header Profile Banner */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-[1200px] mx-auto px-4 py-8 md:py-12">
                    <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
                        {/* Large Avatar */}
                        <div className="w-32 h-32 md:w-40 md:h-40 relative rounded-full overflow-hidden border-4 border-white shadow-lg bg-gray-100 flex-shrink-0">
                            {teacher.avatar_url ? (
                                <Image
                                    src={teacher.avatar_url}
                                    alt={teacher.full_name}
                                    fill
                                    className="object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-4xl font-serif text-brand-primary/40 font-bold">
                                    {teacher.full_name.charAt(0).toUpperCase()}
                                </div>
                            )}

                            {/* Availability Status Dot */}
                            {teacher.is_available !== false ? (
                                <div className="absolute bottom-3 right-3 w-6 h-6 bg-green-500 border-4 border-white rounded-full" title="Şimdi Müsait"></div>
                            ) : (
                                <div className="absolute bottom-3 right-3 w-6 h-6 bg-gray-400 border-4 border-white rounded-full" title="Müsait Değil"></div>
                            )}
                        </div>

                        {/* Info */}
                        <div className="flex-1">
                            {teacher.specialization && (
                                <span className="inline-block bg-brand-primary/10 text-brand-primary text-sm font-bold px-3 py-1 rounded-full mb-3 uppercase">
                                    {teacher.specialization}
                                </span>
                            )}
                            <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-3">
                                {teacher.full_name}
                            </h1>
                            <div className="flex gap-4 mb-4 text-slate-500">
                                <div className="flex items-center gap-1.5 font-medium">
                                    <i className="fas fa-tag text-brand-accent"></i>
                                    Ders Ücreti: <span className="text-slate-800 font-bold">{price.toLocaleString('tr-TR')} ₺</span>
                                </div>
                            </div>
                            <p className="text-slate-600 leading-relaxed max-w-3xl">
                                {teacher.bio || "Şu anda mevcut bir tanıtım bulunmamaktadır."}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-[1200px] mx-auto px-4 mt-8 flex flex-col lg:flex-row gap-8">

                {/* Left side: Booking or Packages */}
                <div className="w-full lg:w-[400px] flex-shrink-0 flex flex-col gap-6">

                    {/* User Balance Status */}
                    {user && (
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-brand-primary/20 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-16 h-16 bg-brand-primary/5 rounded-bl-[100px] -z-0"></div>

                            <h3 className="text-lg font-bold text-slate-800 mb-2 relative z-10">Mevcut Bakiye</h3>
                            {hasBalance ? (
                                <div>
                                    <div className="text-4xl font-black text-brand-primary mb-1">
                                        {balance.lessons_remaining} <span className="text-lg text-slate-500 font-normal">kalan ders</span>
                                    </div>
                                    <p className="text-sm text-green-600 font-medium flex items-center gap-2">
                                        <i className="fas fa-check-circle"></i> Artık randevularınızı ayırtabilirsiniz!
                                    </p>
                                </div>
                            ) : (
                                <div>
                                    <div className="text-2xl font-bold text-slate-600 mb-1">0 Ders</div>
                                    <p className="text-sm text-amber-600 font-medium flex items-center gap-2">
                                        <i className="fas fa-info-circle"></i> Rezervasyonu etkinleştirmek için lütfen bir paket satın alın.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Packages Selection (Only show if not enough balance or always show to allow top up) */}
                    <div className="bg-white rounded-2xl p-6 shadow-[0_5px_20px_rgba(0,0,0,0.03)] border border-gray-100">
                        <h3 className="text-xl font-bold text-slate-800 mb-1 text-center">Ders Paketi Satın Al</h3>
                        <p className="text-sm text-slate-500 mb-6 text-center">İhtiyaçlarınıza en uygun paketi seçin</p>

                        <div className="flex flex-col gap-4">
                            {packages.map((num) => {
                                const pkgPrice = price * num;
                                return (
                                    <div key={num} onClick={() => handlePackageClick(num)} className="group border border-gray-200 hover:border-brand-primary rounded-xl p-4 flex justify-between items-center cursor-pointer transition-all hover:shadow-md bg-gray-50/50 hover:bg-brand-primary/5">
                                        <div>
                                            <div className="font-bold text-lg text-slate-800 group-hover:text-brand-primary transition-colors">{num} Ders</div>
                                            <div className="text-sm text-slate-500 font-medium">{pkgPrice.toLocaleString('tr-TR')} ₺</div>
                                        </div>
                                        <button className="bg-white border border-gray-200 text-brand-primary font-bold px-4 py-2 rounded-lg group-hover:bg-brand-primary group-hover:text-white transition-all shadow-sm">
                                            Hemen Satın Al
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Right side: Calendar & Timetable */}
                <div className="flex-1">
                    <div className="bg-white rounded-2xl p-6 lg:p-8 shadow-[0_5px_20px_rgba(0,0,0,0.03)] border border-gray-100 min-h-[500px]">
                        <h2 className="text-2xl font-bold text-brand-primary mb-2 flex items-center gap-3">
                            <i className="far fa-calendar-alt"></i> Müsait Randevu Takvimi
                        </h2>
                        <p className="text-slate-500 mb-8 border-b border-gray-100 pb-4">
                            Doğrudan rezervasyon için size uygun zamanı seçin. Yeşil renkli randevular rezerve edilebilir.
                        </p>

                        <div className="mt-4">
                            <TeacherAvailabilityCalendar
                                teacherId={teacher.id}
                                studentId={user?.id}
                                hasBalance={hasBalance as boolean}
                            />
                        </div>

                        {!hasBalance && (
                            <div className="mt-6 flex flex-col items-center justify-center p-8 bg-gray-50 rounded-xl border border-gray-200 text-center relative overflow-hidden group">
                                <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-gray-200 via-amber-300 to-gray-200 opacity-50"></div>
                                <div className="w-16 h-16 bg-white text-gray-400 rounded-full flex items-center justify-center text-2xl mb-4 shadow-sm border border-gray-100 group-hover:scale-105 transition-transform duration-300">
                                    <i className="fas fa-lock"></i>
                                </div>
                                <h3 className="text-lg font-bold text-slate-800 mb-2">Randevuları Gözden Geçir ve Hemen Ayırt</h3>
                                <p className="text-slate-500 max-w-sm mb-4">
                                    Randevu almak ve uygun saatleri seçmek için bakiyenizde ders bulunmalıdır.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

            </div>

        </div>
    );
}
