"use client";

import Image from "next/image";
import Link from "next/link";

interface TeacherCardProps {
    teacher: {
        id: string;
        full_name: string;
        bio: string | null;
        avatar_url?: string | null;
        specialization?: string | null;
        price_per_lesson?: number;
        is_available?: boolean;
        role?: string;
    }
}

export default function TeacherCard({ teacher }: TeacherCardProps) {
    // Formatting and Defaults
    const price = teacher.price_per_lesson || 150; // Default price if not set
    const isAvailable = teacher.is_available !== false; // Default to available unless strictly false
    const photoUrl = teacher.avatar_url;

    const getThumbnailContent = () => {
        if (photoUrl) {
            return (
                <Image
                    src={photoUrl}
                    alt={teacher.full_name}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
            );
        }

        // Fallback thumbnail with first letter
        const firstLetter = teacher.full_name.charAt(0).toUpperCase();
        return (
            <div className="w-full h-full bg-brand-primary/10 flex items-center justify-center transition-transform duration-500 group-hover:scale-105">
                <span className="text-[4rem] md:text-[5rem] font-serif text-brand-primary/40 font-bold">{firstLetter}</span>
            </div>
        );
    };

    const renderActionButton = () => {
        if (!isAvailable) {
            return (
                <button disabled className="w-full bg-gray-100 text-gray-400 font-bold py-[10px] md:py-[12px] rounded-lg cursor-not-allowed flex items-center justify-center gap-2">
                    Şu Anda Müsait Değil
                </button>
            );
        }

        return (
            <Link href={`/teachers/${teacher.id}`} className="block w-full">
                <button className="w-full bg-brand-primary text-white font-bold py-[10px] md:py-[12px] rounded-lg hover:bg-brand-primary-hover transition-all hover:-translate-y-0.5 shadow-md">
                    Profili İncele
                </button>
            </Link>
        );
    };

    return (
        <div className="bg-white rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-gray-100 overflow-hidden flex flex-col group hover:shadow-[0_10px_30px_rgba(0,0,0,0.08)] transition-all duration-300">
            {/* Thumbnail Area */}
            <Link href={`/teachers/${teacher.id}`} className="relative h-[200px] md:h-[220px] bg-gray-50 overflow-hidden block">
                {getThumbnailContent()}

                {/* Availability Badge Overlay */}
                <div className="absolute top-4 right-4 z-10 flex gap-2">
                    {isAvailable ? (
                        <span className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                            Şimdi Müsait
                        </span>
                    ) : (
                        <span className="bg-gray-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm flex items-center gap-1.5">
                            Müsait Değil
                        </span>
                    )}
                </div>
            </Link>

            {/* Content Area */}
            <div className="p-5 md:p-6 flex flex-col flex-1">
                {/* Specialization Badge */}
                {teacher.specialization && (
                    <div className="mb-3">
                        <span className="bg-brand-primary/10 text-brand-primary text-xs font-bold px-2 py-1 rounded uppercase tracking-wider">
                            {teacher.specialization}
                        </span>
                    </div>
                )}

                {/* Title */}
                <Link href={`/teachers/${teacher.id}`} className="block mb-2">
                    <h3 className="font-bold text-[1.25rem] md:text-[1.35rem] text-gray-800 leading-tight group-hover:text-brand-primary transition-colors line-clamp-1">
                        {teacher.full_name}
                    </h3>
                </Link>

                {/* Bio */}
                <p className="text-gray-500 text-sm mb-4 line-clamp-2 leading-relaxed h-10">
                    {teacher.bio || "Henüz bir tanıtım eklenmemiş."}
                </p>

                {/* Price */}
                <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between mb-4">
                    <span className="text-sm font-medium text-gray-500">Ders Ücreti</span>
                    <span className="text-[1.3rem] font-bold text-brand-primary">
                        {price.toLocaleString('tr-TR')} ₺
                    </span>
                </div>

                {/* Action Button */}
                {renderActionButton()}
            </div>
        </div>
    );
}
