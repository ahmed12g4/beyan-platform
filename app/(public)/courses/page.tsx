"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import CourseCard from "@/app/components/CourseCard";
import Link from "next/link";

interface Course {
    id: string;
    title: string;
    description: string | null;
    thumbnail_url: string | null;
    duration_hours: number | null;
    duration_weeks: number | null; // fallback
    lessons_count: number | null;
    price: number;
    is_published: boolean;
    created_at: string;
}

export default function CoursesPage() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;

        async function fetchCourses() {
            try {
                const supabase = createClient();
                const { data, error } = await supabase
                    .from('courses')
                    .select('*')
                    .eq('is_published', true)
                    .order('created_at', { ascending: false });

                if (error) throw error;

                if (isMounted) {
                    // Safe type assertion ensuring we map the data
                    setCourses((data as any[]) || []);
                }
            } catch (err: any) {
                console.error("Error fetching courses:", err);
                if (isMounted) {
                    setError("Kurslar yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.");
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        }

        fetchCourses();

        return () => {
            isMounted = false;
        };
    }, []);

    if (loading) {
        return (
            <div className="min-h-[50vh] flex flex-col items-center justify-center bg-gray-50 pt-24 pb-16">
                <div className="w-12 h-12 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin mb-4"></div>
                <p className="text-gray-500 font-medium">Eğitimler Yükleniyor...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-[50vh] flex flex-col items-center justify-center bg-gray-50 pt-24 pb-16 px-4">
                <div className="bg-red-50 text-red-600 p-6 rounded-xl max-w-md text-center border border-red-100">
                    <i className="fas fa-exclamation-circle text-3xl mb-3"></i>
                    <h3 className="font-bold text-lg mb-2">Hata</h3>
                    <p>{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-4 bg-red-100 hover:bg-red-200 text-red-700 font-medium px-4 py-2 rounded-lg transition-colors"
                    >
                        Tekrar Dene
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pt-16 pb-24">

            {/* Header Section */}
            <div className="bg-brand-primary text-white py-16 px-4 md:px-8 mb-12 shadow-md relative overflow-hidden">
                <div className="absolute inset-0 bg-brand-primary opacity-95"></div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-brand-accent rounded-full opacity-10 blur-3xl -translate-y-1/2 translate-x-1/2"></div>

                <div className="max-w-[1200px] mx-auto relative z-10 text-center">
                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">Tüm Eğitimlerimiz</h1>
                    <p className="text-white/80 text-lg md:text-xl max-w-2xl mx-auto font-light">
                        Kendinize en uygun eğitimi seçin ve hemen öğrenmeye başlayın. Gerçek bilgiler, gerçek eğitmenler.
                    </p>
                </div>
            </div>

            {/* Courses Grid Section */}
            <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">

                {courses.length === 0 ? (
                    <div className="bg-white p-12 rounded-2xl shadow-sm border border-gray-100 text-center max-w-2xl mx-auto">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <i className="fas fa-box-open text-3xl text-gray-300"></i>
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">Şu an aktif eğitim bulunmuyor</h3>
                        <p className="text-gray-500 mb-6">
                            لا توجد كورسات متاحة حالياً (Şu an yayınlanmış kurs bulunmamaktadır).
                            Lütfen daha sonra tekrar kontrol edin.
                        </p>
                        <Link href="/">
                            <button className="bg-brand-primary text-white font-medium px-6 py-3 rounded-lg hover:bg-brand-primary-hover transition-colors">
                                Ana Sayfaya Dön
                            </button>
                        </Link>
                    </div>
                ) : (
                    <>
                        <div className="mb-6 flex justify-between items-center text-sm font-medium text-gray-500 border-b border-gray-200 pb-4">
                            <span>Toplam <strong className="text-brand-primary">{courses.length}</strong> eğitim bulundu</span>
                        </div>

                        {/* 1 col mobile, 2 col tablet, 3 col desktop */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                            {courses.map(course => (
                                <CourseCard key={course.id} course={course} />
                            ))}
                        </div>
                    </>
                )}
            </div>

        </div>
    );
}
