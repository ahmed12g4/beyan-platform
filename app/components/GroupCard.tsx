"use client";

import Image from "next/image";
import Link from "next/link";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import type { Group } from "@/app/(public)/groups/page";

interface GroupCardProps {
    group: Group;
}

export default function GroupCard({ group }: GroupCardProps) {
    const { user, loading: authLoading } = useCurrentUser();

    const price = group.price || 0;
    const enrolledCount = group.enrolled_count || 0;
    const isFull = enrolledCount >= group.max_students;

    // Formatting date safely
    const startDate = new Date(group.start_date).toLocaleDateString("tr-TR", {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const getThumbnailContent = () => {
        if (group.thumbnail_url) {
            return (
                <Image
                    src={group.thumbnail_url}
                    alt={group.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
            );
        }

        // Fallback thumbnail with first letter
        const firstLetter = group.title.charAt(0).toUpperCase();
        return (
            <div className="w-full h-full bg-brand-primary/10 flex items-center justify-center transition-transform duration-500 group-hover:scale-105">
                <span className="text-[4rem] md:text-[5rem] font-serif text-brand-primary/40 font-bold">{firstLetter}</span>
            </div>
        );
    };

    const renderActionButton = () => {
        if (authLoading) {
            return (
                <div className="w-full py-[10px] md:py-[12px] bg-gray-100 rounded-lg animate-pulse flex justify-center items-center">
                    <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-500 rounded-full animate-spin"></div>
                </div>
            );
        }

        if (isFull) {
            return (
                <button disabled className="w-full bg-gray-100 text-gray-500 font-bold py-[10px] md:py-[12px] rounded-lg cursor-not-allowed flex items-center justify-center gap-2">
                    <i className="fas fa-ban"></i> Kontenjan Dolu
                </button>
            );
        }

        if (!user) {
            return (
                <Link href={`/giris?redirect=/groups`} className="block w-full">
                    <button className="w-full bg-brand-accent text-brand-primary font-bold py-[10px] md:py-[12px] rounded-lg transition-all hover:bg-[#ffe680] hover:-translate-y-0.5 shadow-sm flex items-center justify-center gap-2">
                        <i className="fas fa-sign-in-alt"></i> Giriş Yap ve Satın Al
                    </button>
                </Link>
            );
        }

        return (
            <Link href={`/groups/${group.id}`} className="block w-full">
                <button className="w-full bg-brand-primary text-white font-bold py-[10px] md:py-[12px] rounded-lg hover:bg-brand-primary-hover transition-all hover:-translate-y-0.5 shadow-md flex items-center justify-center gap-2">
                    <i className="fas fa-shopping-cart"></i> Satın Al
                </button>
            </Link>
        );
    };

    return (
        <div className="bg-white rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-gray-100 overflow-hidden flex flex-col group hover:shadow-[0_10px_30px_rgba(0,0,0,0.08)] transition-all duration-300">
            {/* Thumbnail Area */}
            <Link href={`/groups/${group.id}`} className="relative h-[200px] md:h-[220px] bg-gray-50 overflow-hidden block">
                {getThumbnailContent()}

                {/* Status Badge */}
                <div className="absolute top-4 right-4 z-10 flex gap-2">
                    {isFull ? (
                        <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm flex items-center gap-1.5">
                            Dolu
                        </span>
                    ) : (
                        <span className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm flex items-center gap-1.5">
                            Kayıt Açık
                        </span>
                    )}
                </div>
            </Link>

            {/* Content Area */}
            <div className="p-5 md:p-6 flex flex-col flex-1">
                {/* Title */}
                <Link href={`/groups/${group.id}`} className="block mb-2">
                    <h3 className="font-bold text-[1.25rem] md:text-[1.35rem] text-gray-800 leading-tight group-hover:text-brand-primary transition-colors line-clamp-2">
                        {group.title}
                    </h3>
                </Link>

                {/* Description */}
                <p className="text-gray-500 text-sm mb-4 line-clamp-2 leading-relaxed h-10">
                    {group.description || "Bu grup için açıklama bulunmamaktadır."}
                </p>

                {/* Meta Info Grid */}
                <div className="grid grid-cols-2 gap-y-3 gap-x-2 mb-5 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                        <i className="fas fa-chalkboard-teacher text-brand-primary/70 w-4"></i>
                        <span className="truncate">{group.teacher_name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                        <i className="far fa-calendar-alt text-brand-primary/70 w-4"></i>
                        <span>{startDate}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                        <i className="fas fa-layer-group text-brand-primary/70 w-4"></i>
                        <span>{group.lessons_count} Oturum</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                        <i className="far fa-clock text-brand-primary/70 w-4"></i>
                        <span>{group.hours_per_session} Saat/S.</span>
                    </div>
                </div>

                {/* Enrollment Progress */}
                <div className="mb-5">
                    <div className="flex justify-between text-xs font-semibold text-gray-500 mb-1.5">
                        <span>Kontenjan</span>
                        <span>{enrolledCount} / {group.max_students}</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-500 ${isFull ? 'bg-red-500' : 'bg-brand-primary'}`}
                            style={{ width: `${Math.min(100, (enrolledCount / group.max_students) * 100)}%` }}
                        ></div>
                    </div>
                </div>

                {/* Footer / Price & Action */}
                <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between mb-4">
                    <span className="text-sm font-medium text-gray-500">Ücret</span>
                    <span className="text-[1.3rem] font-bold text-brand-primary">
                        {price.toLocaleString('tr-TR')} ₺
                    </span>
                </div>

                {renderActionButton()}
            </div>
        </div>
    );
}
