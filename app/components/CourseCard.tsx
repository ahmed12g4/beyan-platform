"use client";

import Image from "next/image";
import Link from "next/link";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface CourseCardProps {
    course: {
        id: string;
        title: string;
        description: string | null;
        thumbnail_url: string | null;
        duration_hours: number | null; // Using new schema field
        duration_weeks: number | null; // Keeping fallback if needed
        lessons_count: number | null; // New schema field
        price: number;
        is_published: boolean;
        created_at: string;
    }
}

export default function CourseCard({ course }: CourseCardProps) {
    const { user, loading: authLoading } = useCurrentUser();
    const [isEnrolled, setIsEnrolled] = useState(false);
    const [enrollmentLoading, setEnrollmentLoading] = useState(true);

    const price = course.price;
    const isFree = !price || price === 0;

    // Check enrollment status if user is logged in
    useEffect(() => {
        let isMounted = true;

        async function checkEnrollment() {
            if (!user) {
                if (isMounted) {
                    setIsEnrolled(false);
                    setEnrollmentLoading(false);
                }
                return;
            }

            try {
                // Determine the correct field based on standard schema or newly updated schema
                const supabase = createClient();
                const { data, error } = await supabase
                    .from('enrollments')
                    .select('id, status')
                    .eq('student_id', user.id)
                    .eq('course_id', course.id)
                    .maybeSingle();

                if (error && error.code !== 'PGRST116') {
                    console.error("Error checking enrollment:", error);
                }

                if (isMounted) {
                    // Consider enrolled if record exists and status is valid
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
                console.error("Check enrollment error:", err);
            } finally {
                if (isMounted) setEnrollmentLoading(false);
            }
        }

        if (!authLoading) {
            checkEnrollment();
        }

        return () => { isMounted = false; };
    }, [user, authLoading, course.id]);

    const getThumbnailContent = () => {
        if (course.thumbnail_url) {
            return (
                <Image
                    src={course.thumbnail_url}
                    alt={course.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
            );
        }

        // Fallback thumbnail with first letter
        const firstLetter = course.title.charAt(0).toUpperCase();
        return (
            <div className="w-full h-full bg-brand-primary/10 flex items-center justify-center transition-transform duration-500 group-hover:scale-105">
                <span className="text-[4rem] md:text-[5rem] font-serif text-brand-primary/40 font-bold">{firstLetter}</span>
            </div>
        );
    };

    // Button Logic
    const renderActionButton = () => {
        if (authLoading || enrollmentLoading) {
            return (
                <div className="w-full py-[10px] md:py-[12px] bg-gray-100 rounded-lg animate-pulse flex justify-center items-center">
                    <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-500 rounded-full animate-spin"></div>
                </div>
            );
        }

        if (!user) {
            // Not logged in -> Go to Login (maybe pass redirect param)
            return (
                <Link href={`/giris?redirect=/courses/${course.id}`} className="block w-full">
                    <button className="w-full bg-brand-accent text-brand-primary font-bold py-[10px] md:py-[12px] rounded-lg transition-all hover:bg-[#ffe680] hover:-translate-y-0.5 active:translate-y-0">
                        {isFree ? "Ücretsiz Başla" : "Satın Al"}
                    </button>
                </Link>
            );
        }

        if (isEnrolled) {
            // Already Enrolled
            return (
                <button disabled className="w-full bg-green-50 text-green-700 border border-green-200 font-bold py-[10px] md:py-[12px] rounded-lg cursor-default flex items-center justify-center gap-2">
                    <i className="fas fa-check-circle"></i> المشترك بالفعل (Kayıtlı)
                </button>
            );
        }

        // Logged in but not enrolled -> Checkout
        return (
            <Link href={`/checkout/${course.id}`} className="block w-full">
                <button className="w-full bg-brand-primary text-white font-bold py-[10px] md:py-[12px] rounded-lg hover:bg-brand-primary-hover transition-all hover:-translate-y-0.5 shadow-md">
                    {isFree ? "Ücretsiz Başla" : "Satın Al"}
                </button>
            </Link>
        );
    };

    // Formatting durations to fallback gracefully to our expectations
    const durationText = course.duration_hours ? `${course.duration_hours} Saat` : course.duration_weeks ? `${course.duration_weeks} Hafta` : null;
    const lessonsText = course.lessons_count ? `${course.lessons_count} Ders` : null;

    return (
        <div className="bg-white rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-gray-100 overflow-hidden flex flex-col group hover:shadow-[0_10px_30px_rgba(0,0,0,0.08)] transition-all duration-300">
            {/* Thumbnail Area */}
            <Link href={`/courses/${course.id}`} className="relative h-[200px] md:h-[220px] bg-gray-50 overflow-hidden block">
                {getThumbnailContent()}
            </Link>

            {/* Content Area */}
            <div className="p-5 md:p-6 flex flex-col flex-1">
                {/* Meta details: Duration & Lessons */}
                <div className="flex flex-wrap items-center gap-3 md:gap-4 mb-3 text-xs md:text-sm text-gray-500 font-medium">
                    {durationText && (
                        <div className="flex items-center gap-1.5">
                            <i className="far fa-clock text-brand-accent"></i>
                            <span>{durationText}</span>
                        </div>
                    )}
                    {lessonsText && (
                        <div className="flex items-center gap-1.5">
                            <i className="far fa-play-circle text-brand-accent"></i>
                            <span>{lessonsText}</span>
                        </div>
                    )}
                </div>

                {/* Title */}
                <Link href={`/courses/${course.id}`} className="block mb-3">
                    <h3 className="font-bold text-[1.15rem] md:text-[1.25rem] text-brand-primary leading-tight group-hover:text-brand-accent transition-colors line-clamp-2">
                        {course.title}
                    </h3>
                </Link>

                {/* Price (pushed to bottom) */}
                <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between mb-4">
                    <span className="text-sm font-medium text-gray-500">Fiyat</span>
                    <span className="text-[1.3rem] font-bold text-brand-primary">
                        {isFree ? (
                            <span className="text-green-600">Ücretsiz</span>
                        ) : (
                            <>{price.toLocaleString('tr-TR')} ₺</>
                        )}
                    </span>
                </div>

                {/* Action Button */}
                {renderActionButton()}
            </div>
        </div>
    );
}
