"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useCurrentUser } from "@/hooks/useCurrentUser";

interface CourseDetail {
    id: string;
    title: string;
    description: string | null;
    thumbnail_url: string | null;
    duration_hours: number | null;
    duration_weeks: number | null;
    lessons_count: number | null;
    price: number;
    course_type: string;
    level: string | null;
    is_published: boolean;
    created_at: string;
}

export default function CourseDetailPage() {
    const params = useParams();
    const id = params?.id as string;

    const { user, loading: authLoading } = useCurrentUser();
    const [course, setCourse] = useState<CourseDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isEnrolled, setIsEnrolled] = useState(false);
    const [enrollmentLoading, setEnrollmentLoading] = useState(true);

    // Fetch Course
    useEffect(() => {
        let isMounted = true;
        if (!id) return;

        async function fetchCourse() {
            try {
                const supabase = createClient();
                const { data, error } = await supabase
                    .from('courses')
                    .select('*')
                    .eq('id', id)
                    .maybeSingle();

                if (error) throw error;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const row = data as any;
                if (!row || !row.is_published) {
                    throw new Error("Kurs bulunamadı veya yayında değil.");
                }

                if (isMounted) setCourse(row as CourseDetail);
            } catch (err: any) {
                console.error("Error fetching course detail:", err);
                if (isMounted) setError("Eğitim detayları yüklenemedi. Lütfen geçerli bir eğitim seçtiğinizden emin olun.");
            } finally {
                if (isMounted) setLoading(false);
            }
        }
        fetchCourse();
        return () => { isMounted = false; };
    }, [id]);

    // Check Enrollment status
    useEffect(() => {
        let isMounted = true;

        async function checkEnrollment() {
            if (!user || !course) {
                if (isMounted) setEnrollmentLoading(false);
                return;
            }

            try {
                const supabase = createClient();
                const { data, error } = await supabase
                    .from('enrollments')
                    .select('status')
                    .eq('student_id', user.id)
                    .eq('course_id', course.id)
                    .maybeSingle();

                if (error && error.code !== 'PGRST116') {
                    console.error("Checking enrollment error:", error);
                }

                if (isMounted) {
                    if (data) {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const row = data as any;
                        const isPaid = row.status === 'active';
                        setIsEnrolled(isPaid);
                    } else {
                        setIsEnrolled(false);
                    }
                }
            } catch (err) {
                console.error("Enrollment check catch block:", err);
            } finally {
                if (isMounted) setEnrollmentLoading(false);
            }
        }

        if (!authLoading && course) {
            checkEnrollment();
        }

        return () => { isMounted = false; };
    }, [user, authLoading, course]);

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 pt-20">
                <div className="w-12 h-12 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin mb-4"></div>
                <p className="text-gray-500 font-medium">Detaylar Yükleniyor...</p>
            </div>
        );
    }

    if (error || !course) {
        return (
            <div className="min-h-[70vh] flex flex-col items-center justify-center bg-gray-50 px-4">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-md text-center">
                    <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i className="fas fa-exclamation-triangle text-2xl"></i>
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Hata</h3>
                    <p className="text-gray-500 mb-6">{error || "Kurs bulunamadı."}</p>
                    <Link href="/courses">
                        <button className="bg-brand-primary text-white font-medium px-6 py-2.5 rounded-lg hover:bg-brand-primary-hover transition-colors">
                            Eğitimlere Dön
                        </button>
                    </Link>
                </div>
            </div>
        );
    }

    const price = course.price;
    const isFree = !price || price === 0;

    // Formatting durations to fallback gracefully
    const durationText = course.duration_hours ? `${course.duration_hours} Saat` : course.duration_weeks ? `${course.duration_weeks} Hafta` : null;
    const lessonsText = course.lessons_count ? `${course.lessons_count} Ders` : null;

    // Button Logic
    const renderActionButton = () => {
        if (authLoading || enrollmentLoading) {
            return (
                <div className="w-full py-4 bg-gray-100 rounded-lg animate-pulse flex justify-center items-center">
                    <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-500 rounded-full animate-spin"></div>
                </div>
            );
        }

        if (!user) {
            return (
                <Link href={`/giris?redirect=/courses/${course.id}`} className="block w-full">
                    <button className="w-full bg-brand-accent text-brand-primary font-bold py-4 rounded-xl text-lg hover:bg-[#ffe680] hover:-translate-y-1 transition-all shadow-[0_8px_20px_rgba(254,221,89,0.3)]">
                        {isFree ? "Ücretsiz Başla" : "Satın Al"}
                    </button>
                </Link>
            );
        }

        if (isEnrolled) {
            return (
                <Link href={`/student/my-lessons`} className="block w-full">
                    <button className="w-full bg-green-50 text-green-700 border border-green-200 font-bold py-4 rounded-xl text-lg hover:bg-green-100 transition-all flex justify-center items-center gap-2">
                        <i className="fas fa-play-circle text-xl"></i> Eğitimlerime Git
                    </button>
                </Link>
            );
        }

        return (
            <Link href={`/checkout?type=course&productId=${course.id}`} className="block w-full">
                <button className="w-full bg-brand-primary text-white font-bold py-4 rounded-xl text-lg hover:bg-brand-primary-hover hover:-translate-y-1 transition-all shadow-lg">
                    {isFree ? "Ücretsiz Başla" : "Satın Al"}
                </button>
            </Link>
        );
    };

    return (
        <div className="min-h-screen bg-[#F8F9FA] pb-24 font-sans">

            {/* Hero Detailed Banner */}
            <div className="bg-brand-primary text-white pt-24 pb-32 px-4 shadow-md relative overflow-hidden">
                <div className="absolute inset-0 bg-brand-primary opacity-95"></div>
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-accent rounded-full opacity-10 blur-3xl"></div>

                <div className="max-w-[1100px] mx-auto relative z-10 flex text-center md:text-left flex-col items-center justify-center">
                    {/* Badge */}
                    <div className="mb-6 flex flex-wrap justify-center md:justify-start gap-3">
                        {course.course_type && (
                            <span className="bg-brand-accent/20 text-brand-accent border border-brand-accent/30 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase">
                                {course.course_type.replace(/_/g, " ")}
                            </span>
                        )}
                        {course.level && (
                            <span className="bg-white/10 text-white border border-white/20 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase">
                                Seviye: {course.level}
                            </span>
                        )}
                    </div>

                    <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.5rem] font-bold mb-6 leading-tight max-w-4xl text-white">
                        {course.title}
                    </h1>

                    <p className="text-white/80 text-lg sm:text-xl font-light max-w-3xl leading-relaxed">
                        {course.description || "Bu eğitim için henüz detaylı bir açıklama eklenmedi."}
                    </p>
                </div>
            </div>

            {/* Main Content Layout */}
            <div className="max-w-[1100px] mx-auto px-4 -mt-20 relative z-20">
                <div className="flex flex-col lg:flex-row gap-8 items-start">

                    {/* Left Column (Main Info) */}
                    <div className="flex-1 w-full flex flex-col gap-6">
                        {/* Interactive Thumbnail */}
                        <div className="bg-white rounded-2xl p-2 shadow-[0_10px_40px_rgba(0,0,0,0.08)]">
                            <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center group">
                                {course.thumbnail_url ? (
                                    <Image
                                        src={course.thumbnail_url}
                                        alt={course.title}
                                        fill
                                        className="object-cover group-hover:scale-105 transition-transform duration-700"
                                    />
                                ) : (
                                    <span className="text-[6rem] font-serif font-bold text-gray-300">
                                        {course.title.charAt(0).toUpperCase()}
                                    </span>
                                )}
                                {/* Play overlay placeholder if user isn't enrolled */}
                                {(!user || !isEnrolled) && (
                                    <div className="absolute inset-0 bg-brand-primary/20 hover:bg-brand-primary/30 transition-colors flex items-center justify-center cursor-pointer">
                                        <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center text-brand-primary shadow-lg transform group-hover:scale-110 transition-transform">
                                            <i className="fas fa-play text-xl ml-1"></i>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Description Box */}
                        <div className="bg-white rounded-2xl p-6 md:p-8 shadow-[0_5px_20px_rgba(0,0,0,0.03)] border border-gray-100">
                            <h2 className="text-2xl font-bold text-brand-primary mb-4 border-b border-gray-100 pb-3">Eğitim Hakkında</h2>
                            <div className="prose max-w-none text-gray-600 leading-relaxed font-medium">
                                <p>{course.description || "Uzman eğitmenlerimiz tarafından hazırlanan bu eğitim ile hedeflerinize emin adımlarla ilerleyin. Detaylı bilgi için destek ekibimizle iletişime geçebilirsiniz."}</p>
                            </div>
                        </div>
                    </div>

                    {/* Right Column (Floating Sticky Sidebar) */}
                    <div className="w-full lg:w-[380px] lg:sticky lg:top-24 flex-shrink-0">
                        <div className="bg-white rounded-2xl shadow-[0_15px_50px_rgba(0,0,0,0.08)] border border-gray-100 overflow-hidden">

                            {/* Price Header */}
                            <div className="bg-brand-primary/5 p-6 border-b border-brand-primary/10 text-center">
                                <h3 className="text-gray-500 font-medium text-sm mb-1 uppercase tracking-wider">Kayıt Ücreti</h3>
                                <div className="text-[2.5rem] font-bold text-brand-primary">
                                    {isFree ? (
                                        <span className="text-green-600">Ücretsiz</span>
                                    ) : (
                                        <>{price.toLocaleString('tr-TR')} ₺</>
                                    )}
                                </div>
                            </div>

                            {/* Features List */}
                            <div className="p-6">
                                <h4 className="font-bold text-gray-800 mb-4 tracking-tight">Bu Eğitimin Özellikleri</h4>
                                <ul className="space-y-4 mb-8">
                                    {durationText && (
                                        <li className="flex items-center gap-3 text-gray-600 font-medium">
                                            <div className="w-8 h-8 rounded-full bg-brand-accent/20 flex flex-shrink-0 items-center justify-center text-brand-accent"><i className="far fa-clock"></i></div>
                                            <span>Toplam <strong>{durationText}</strong> içerik</span>
                                        </li>
                                    )}
                                    {lessonsText && (
                                        <li className="flex items-center gap-3 text-gray-600 font-medium">
                                            <div className="w-8 h-8 rounded-full bg-brand-accent/20 flex flex-shrink-0 items-center justify-center text-brand-accent"><i className="far fa-play-circle"></i></div>
                                            <span><strong>{lessonsText}</strong> video ders</span>
                                        </li>
                                    )}
                                    <li className="flex items-center gap-3 text-gray-600 font-medium">
                                        <div className="w-8 h-8 rounded-full bg-brand-accent/20 flex flex-shrink-0 items-center justify-center text-brand-accent"><i className="fas fa-mobile-alt"></i></div>
                                        <span>Tablet ve Telefondan Erişim</span>
                                    </li>
                                    <li className="flex items-center gap-3 text-gray-600 font-medium">
                                        <div className="w-8 h-8 rounded-full bg-brand-accent/20 flex flex-shrink-0 items-center justify-center text-brand-accent"><i className="fas fa-certificate"></i></div>
                                        <span>Bitirme Sertifikası</span>
                                    </li>
                                </ul>

                                {/* Conditional Render Block */}
                                {renderActionButton()}

                                <div className="mt-4 text-center">
                                    <p className="text-xs text-gray-400 font-medium">
                                        Satın alım sonrası içeriklere anında erişim sağlanır.
                                        Güvenli ödeme altyapısı mevcuttur.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

        </div>
    );
}
