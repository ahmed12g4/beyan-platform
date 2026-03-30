"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import type { Group } from "@/app/(public)/groups/page";

interface GroupSession {
    id: string;
    day_of_week: number;
    start_time: string;
    end_time: string;
    session_date: string | null;
}

const dayNames = [
    "Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"
];

export default function GroupDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params?.id as string;

    const { user, loading: authLoading } = useCurrentUser();
    const [group, setGroup] = useState<Group | null>(null);
    const [sessions, setSessions] = useState<GroupSession[]>([]);
    const [isEnrolled, setIsEnrolled] = useState(false);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        let isMounted = true;

        async function fetchGroupDetails() {
            if (!id) return;
            try {
                const supabase = createClient();

                // 1. Fetch group details with profile join and enrollment count
                const { data: groupData, error: groupError } = await supabase
                    .from('groups')
                    .select('*, profiles!groups_teacher_id_fkey(full_name, avatar_url), group_enrollments(count)')
                    .eq('id', id)
                    .maybeSingle();

                if (groupError) throw groupError;
                if (!groupData) throw new Error("Grup bulunamadı.");

                // 2. Fetch weekly sessions
                const { data: sessionsData, error: sessionsError } = await supabase
                    .from('group_sessions')
                    .select('*')
                    .eq('group_id', id)
                    .order('day_of_week', { ascending: true })
                    .order('start_time', { ascending: true });

                if (sessionsError) throw sessionsError;

                // 3. Check enrollment if user is logged in
                let enrolledStatus = false;
                if (user) {
                    const { data: enrollmentData, error: enrollmentError } = await supabase
                        .from('group_enrollments')
                        .select('id')
                        .eq('group_id', id)
                        .eq('student_id', user.id)
                        .eq('status', 'active')
                        .maybeSingle();

                    // Don't throw on error here, it could just mean 0 rows naturally
                    if (enrollmentData) {
                        enrolledStatus = true;
                    }
                }

                if (isMounted) {
                    const formattedGroup: Group = {
                        ...(groupData as any),
                        teacher_name: (groupData as any).profiles?.full_name || 'Öğretmen Bilgisi Yok',
                        teacher_avatar_url: (groupData as any).profiles?.avatar_url || null,
                        enrolled_count: (groupData as any).group_enrollments?.[0]?.count || 0,
                    };

                    setGroup(formattedGroup);
                    setSessions(sessionsData || []);
                    setIsEnrolled(enrolledStatus);
                }
            } catch (err: any) {
                console.error("Error fetching group details:", err);
                if (isMounted) setError("Grup bilgileri yüklenirken bir hata oluştu.");
            } finally {
                if (isMounted) setLoading(false);
            }
        }

        fetchGroupDetails();

        return () => {
            isMounted = false;
        };
    }, [id, user]);

    const handlePurchase = async () => {
        if (!user) {
            router.push(`/giris?redirect=/groups/${id}`);
            return;
        }

        if (isEnrolled || group?.enrolled_count! >= group?.max_students!) {
            return;
        }

        setActionLoading(true);
        // Direct to checkout
        router.push(`/checkout?type=group&productId=${id}`);
    };

    if (loading) {
        return (
            <div className="min-h-[60vh] flex flex-col justify-center items-center">
                <div className="w-16 h-16 border-4 border-gray-200 border-t-brand-primary rounded-full animate-spin shadow-md mb-4"></div>
                <p className="text-gray-500 font-medium animate-pulse">Grup Detayları Yükleniyor...</p>
            </div>
        );
    }

    if (error || !group) {
        return (
            <div className="min-h-[60vh] flex flex-col justify-center items-center">
                <div className="bg-red-50 text-red-600 p-8 rounded-2xl border border-red-100 text-center max-w-md shadow-sm">
                    <i className="fas fa-exclamation-circle text-4xl mb-3 text-red-500/80"></i>
                    <h3 className="font-bold text-lg mb-2">Eyvah!</h3>
                    <p className="text-red-600/80 mb-6">{error || "Grup bulunamadı."}</p>
                    <Link href="/groups" className="px-6 py-2.5 bg-brand-primary text-white font-bold rounded-lg transition-colors shadow-sm inline-block">
                        Gruplara Dön
                    </Link>
                </div>
            </div>
        );
    }

    const isFull = group.enrolled_count! >= group.max_students;
    const price = group.price || 0;

    const formatTime = (timeStr: string) => {
        // e.g., "18:00:00" -> "18:00"
        return timeStr.substring(0, 5);
    };

    return (
        <div className="min-h-screen bg-[#F8F9FA] pb-24 font-sans" dir="rtl">
            {/* Header / Hero Section */}
            <div className="bg-white border-b border-gray-200 relative">
                {group.thumbnail_url && (
                    <div className="absolute inset-0 z-0">
                        <Image
                            src={group.thumbnail_url}
                            alt={group.title}
                            fill
                            className="object-cover opacity-5"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-white to-transparent"></div>
                    </div>
                )}

                <div className="max-w-[1200px] mx-auto px-4 py-8 md:py-12 relative z-10">
                    <div className="flex flex-col md:flex-row gap-8 items-start">
                        {/* Course Image */}
                        <div className="w-full md:w-1/3 lg:w-1/4 flex-shrink-0">
                            <div className="aspect-[4/3] rounded-2xl overflow-hidden border border-gray-100 shadow-md relative bg-gray-50">
                                {group.thumbnail_url ? (
                                    <Image
                                        src={group.thumbnail_url}
                                        alt={group.title}
                                        fill
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-6xl font-serif text-brand-primary/40 font-bold">
                                        {group.title.charAt(0).toUpperCase()}
                                    </div>
                                )}

                                <div className="absolute top-3 right-3 flex gap-2">
                                    {isFull ? (
                                        <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                                            Kontenjan Dolu
                                        </span>
                                    ) : (
                                        <span className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                                            Kayıt Açık
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Title & Info */}
                        <div className="flex-1 w-full">
                            <Link href="/groups" className="text-brand-primary hover:text-brand-primary-hover flex items-center gap-2 mb-4 text-sm font-medium transition-colors">
                                <i className="fas fa-arrow-right"></i> Gruplara Dön
                            </Link>

                            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 leading-tight">
                                {group.title}
                            </h1>

                            {/* Teacher Mini Profile */}
                            <div className="flex items-center gap-3 mb-6 p-3 bg-gray-50 rounded-xl inline-flex border border-gray-100">
                                <div className="w-10 h-10 rounded-full overflow-hidden bg-white border border-gray-200 flex items-center justify-center relative">
                                    {/* Cast through any to access the property we shoved onto the object */}
                                    {(group as any).teacher_avatar_url ? (
                                        <Image src={(group as any).teacher_avatar_url} alt={group.teacher_name!} fill className="object-cover" />
                                    ) : (
                                        <span className="text-lg font-bold text-brand-primary">{group.teacher_name!.charAt(0)}</span>
                                    )}
                                </div>
                                <div className="text-sm">
                                    <div className="text-gray-500 text-xs">Eğitmen</div>
                                    <div className="font-bold text-gray-800">{group.teacher_name}</div>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-4 text-sm font-medium mb-6">
                                <div className="bg-brand-primary/10 text-brand-primary px-4 py-2 rounded-lg flex items-center gap-2">
                                    <i className="far fa-calendar text-lg"></i>
                                    {new Date(group.start_date).toLocaleDateString("tr-TR")} - {new Date(group.end_date).toLocaleDateString("tr-TR")}
                                </div>
                                <div className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg flex items-center gap-2 border border-indigo-100">
                                    <i className="fas fa-layer-group text-lg"></i>
                                    {group.lessons_count} Oturum
                                </div>
                                <div className="bg-orange-50 text-orange-700 px-4 py-2 rounded-lg flex items-center gap-2 border border-orange-100">
                                    <i className="far fa-clock text-lg"></i>
                                    Her Oturum {group.hours_per_session} Saat
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-[1200px] mx-auto px-4 mt-8 flex flex-col lg:flex-row gap-8">
                {/* Left Column: Details & Schedule */}
                <div className="w-full lg:flex-1 flex flex-col gap-8">

                    {/* Description */}
                    <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
                        <h2 className="text-xl font-bold text-gray-800 mb-4 pb-4 border-b border-gray-100 flex items-center gap-2">
                            <i className="fas fa-file-alt text-brand-primary"></i> Grup Hakkında
                        </h2>
                        <div className="prose prose-slate max-w-none text-gray-600 leading-relaxed space-y-4">
                            {group.description?.split('\n').map((paragraph, index) => (
                                <p key={index}>{paragraph}</p>
                            )) || "Bu grup için bir açıklama bulunmuyor."}
                        </div>
                    </div>

                    {/* Schedule */}
                    <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
                        <h2 className="text-xl font-bold text-gray-800 mb-4 pb-4 border-b border-gray-100 flex items-center gap-2">
                            <i className="far fa-calendar-check text-brand-primary"></i> Haftalık Program
                        </h2>

                        {sessions.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {sessions.map((session) => (
                                    <div key={session.id} className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex items-center justify-between hover:bg-white hover:border-brand-primary/30 transition-colors shadow-sm">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-white rounded-lg flex flex-col items-center justify-center border border-gray-200 text-brand-primary">
                                                <span className="text-xs uppercase font-bold text-gray-400">Gün</span>
                                                <span className="font-black text-lg leading-none mt-1">{dayNames[session.day_of_week].substring(0, 3)}</span>
                                            </div>
                                            <div>
                                                <div className="font-bold text-gray-800">{dayNames[session.day_of_week]}</div>
                                                <div className="text-gray-500 text-sm flex items-center gap-1.5 mt-0.5">
                                                    <i className="far fa-clock text-xs"></i>
                                                    {formatTime(session.start_time)} - {formatTime(session.end_time)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-xl border border-gray-100 border-dashed">
                                Program henüz belirlenmedi.
                            </div>
                        )}
                    </div>

                </div>

                {/* Right Column: Checkout / Status Card */}
                <div className="w-full lg:w-[380px]">
                    <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 sticky top-24">
                        <div className="text-center mb-6 pb-6 border-b border-gray-100">
                            <div className="text-gray-500 text-sm mb-1">Grup Katılım Ücreti</div>
                            <div className="text-4xl font-black text-brand-primary">
                                {price.toLocaleString('tr-TR')} ₺
                            </div>
                        </div>

                        {/* Progress */}
                        <div className="mb-6 bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <div className="flex justify-between text-sm font-bold text-gray-700 mb-2">
                                <span>Kontenjan Durumu</span>
                                <span className={isFull ? "text-red-500" : "text-brand-primary"}>
                                    {group.enrolled_count} / {group.max_students} Öğrenci
                                </span>
                            </div>
                            <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-500 ${isFull ? 'bg-red-500' : 'bg-brand-primary'}`}
                                    style={{ width: `${Math.min(100, (group.enrolled_count! / group.max_students) * 100)}%` }}
                                ></div>
                            </div>
                            {isFull && <p className="text-xs text-red-500 mt-2 font-medium"><i className="fas fa-info-circle"></i> Bu grubun kontenjanı dolmuştur.</p>}
                        </div>

                        {/* Action Buttons */}
                        {isEnrolled ? (
                            <div className="space-y-3">
                                <div className="bg-green-50 text-green-700 border border-green-200 p-4 rounded-xl text-center font-bold flex items-center justify-center gap-2 mb-2">
                                    <i className="fas fa-check-circle text-xl"></i> Topluluğa Katıldınız
                                </div>
                                {group.google_meet_link ? (
                                    <a
                                        href={group.google_meet_link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full block bg-brand-primary hover:bg-brand-primary-hover text-white text-center font-bold py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                                    >
                                        <i className="fas fa-video"></i> Derse Katıl (Google Meet)
                                    </a>
                                ) : (
                                    <button disabled className="w-full bg-gray-100 text-gray-500 font-bold py-3.5 rounded-xl cursor-not-allowed border border-gray-200">
                                        Ders Linki Bekleniyor
                                    </button>
                                )}
                            </div>
                        ) : isFull ? (
                            <button disabled className="w-full bg-gray-100 text-gray-400 font-bold py-4 rounded-xl cursor-not-allowed border border-gray-200 text-lg">
                                Kontenjan Dolu
                            </button>
                        ) : (
                            <button
                                onClick={handlePurchase}
                                disabled={actionLoading}
                                className={`w-full bg-brand-accent text-brand-primary font-bold py-4 rounded-xl hover:bg-[#ffe680] hover:-translate-y-0.5 active:translate-y-0 transition-all shadow-md text-lg flex items-center justify-center gap-2 ${actionLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                                {actionLoading ? (
                                    <><div className="w-5 h-5 border-2 border-brand-primary/30 border-t-brand-primary rounded-full animate-spin"></div> İşleniyor...</>
                                ) : (
                                    <><i className="fas fa-shopping-cart"></i> Satın Al ve Katıl</>
                                )}
                            </button>
                        )}

                        <div className="mt-4 pt-4 border-t border-gray-100 space-y-3 text-sm text-gray-500">
                            <div className="flex items-center gap-2">
                                <i className="fas fa-check text-green-500 w-4"></i>
                                Canlı oturumlar ve etkileşim
                            </div>
                            <div className="flex items-center gap-2">
                                <i className="fas fa-check text-green-500 w-4"></i>
                                Belirlenen saatlerde düzenli çalışma
                            </div>
                            <div className="flex items-center gap-2">
                                <i className="fas fa-check text-green-500 w-4"></i>
                                Topluluk içi bilgi paylaşımı
                            </div>
                        </div>

                    </div>
                </div>

            </div>
        </div>
    );
}
