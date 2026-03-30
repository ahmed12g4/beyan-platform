"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Avatar from "@/components/Avatar";

interface Review {
    name: string;
    date: string;
    text: string;
    avatar?: string;
    rating?: number;
}

interface ReviewsCarouselProps {
    reviews: Review[];
}

// Max characters before truncating with "Devamını oku"
const MAX_CHARS = 160;

export default function ReviewsCarousel({ reviews }: ReviewsCarouselProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [cardsToShow, setCardsToShow] = useState(3);
    const [expandedReview, setExpandedReview] = useState<Review | null>(null);

    // Detect screen size
    useEffect(() => {
        const updateLayout = () => {
            const width = window.innerWidth;
            if (width < 768) setCardsToShow(1);
            else if (width < 1280) setCardsToShow(2);
            else setCardsToShow(3);
        };
        updateLayout();
        window.addEventListener('resize', updateLayout);
        return () => window.removeEventListener('resize', updateLayout);
    }, []);

    // Close modal on Escape
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setExpandedReview(null); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    const slidePercentage = 100 / cardsToShow;
    const maxIndex = Math.max(0, reviews.length - cardsToShow);

    const nextSlide = () => setCurrentIndex((prev) => prev >= maxIndex ? 0 : prev + 1);
    const prevSlide = () => setCurrentIndex((prev) => prev <= 0 ? maxIndex : prev - 1);

    return (
        <section id="reviews" className="bg-brand-primary py-[60px] md:py-[80px] text-white overflow-hidden relative">
            <div className="max-w-[1400px] mx-auto px-[20px] md:px-[60px] relative">
                <div className="text-center mb-[40px] md:mb-[50px]">
                    <h2 className="text-[3rem] md:text-[3.5rem] font-bold text-brand-accent mb-[10px] tracking-tight leading-[1.1]">
                        <span className="md:hidden">Öğrenci<br />Yorumları</span>
                        <span className="hidden md:inline">Öğrenci Yorumları</span>
                    </h2>

                    <p className="opacity-90 text-[1rem] md:text-[1.1rem] text-gray-200 font-light">Başarı hikayelerinden ilham alın</p>
                </div>

                <div className="relative max-w-[400px] md:max-w-none mx-auto">
                    {/* Inner container for cards + arrows to perfectly center vertically */}
                    <div className="relative">
                        {/* Left Arrow */}
                        <button
                            onClick={prevSlide}
                            className="absolute -left-[15px] md:-left-[35px] xl:-left-[50px] top-1/2 -translate-y-1/2 w-[40px] h-[40px] md:w-[50px] md:h-[50px] rounded-lg border border-brand-accent bg-brand-primary text-brand-accent flex items-center justify-center hover:bg-brand-accent hover:text-brand-primary transition-all z-20 cursor-pointer shadow-lg active:scale-95"
                            aria-label="Previous reviews"
                        >
                            <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>

                        {/* Right Arrow */}
                        <button
                            onClick={nextSlide}
                            className="absolute -right-[15px] md:-right-[35px] xl:-right-[50px] top-1/2 -translate-y-1/2 w-[40px] h-[40px] md:w-[50px] md:h-[50px] rounded-lg border border-brand-accent bg-brand-primary text-brand-accent flex items-center justify-center hover:bg-brand-accent hover:text-brand-primary transition-all z-20 cursor-pointer shadow-lg active:scale-95"
                            aria-label="Next reviews"
                        >
                            <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>

                        {/* Carousel Container */}
                        <div className="overflow-hidden w-full px-1 py-4">
                            <div
                                className="flex transition-transform duration-700 ease-in-out items-stretch"
                                style={{ transform: `translateX(-${currentIndex * slidePercentage}%)` }}
                            >
                                {reviews.map((review, index) => {
                                    const isLong = review.text.length > MAX_CHARS;
                                    const truncated = isLong
                                        ? review.text.slice(0, MAX_CHARS).trimEnd() + '…'
                                        : review.text;

                                    return (
                                        <div
                                            key={index}
                                            className="flex-shrink-0 px-[5px] md:px-[15px] w-full md:w-1/2 xl:w-1/3"
                                        >
                                            {/* Fixed-height card — all cards same height regardless of content */}
                                            <div className="bg-white text-[#2C2C2C] p-[28px_25px] md:p-[36px_32px] rounded-lg md:rounded-lg flex flex-col shadow-[0_10px_30px_rgba(0,0,0,0.15)] border-t-[6px] border-brand-accent h-[300px] md:h-[320px]">

                                                {/* Stars — always 5, filled based on rating */}
                                                <div className="flex gap-1 mb-4 shrink-0">
                                                    {[1, 2, 3, 4, 5].map((s) => (
                                                        <svg key={s} className={`w-5 h-5 ${s <= (review.rating || 5) ? 'text-brand-accent' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 24 24">
                                                            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                                                        </svg>
                                                    ))}
                                                </div>

                                                {/* Text area — flex-1 + overflow-hidden prevents overflow */}
                                                <div className="flex-1 overflow-hidden">
                                                    <p className="text-[0.95rem] md:text-[1rem] leading-[1.65] text-[#4A5568] font-normal font-sans">
                                                        &ldquo;{truncated}&rdquo;
                                                    </p>
                                                </div>

                                                {/* "Read more" always visible below text, above author */}
                                                {isLong && (
                                                    <button
                                                        onClick={() => setExpandedReview(review)}
                                                        className="text-left text-[0.82rem] font-bold text-brand-primary hover:text-[#2a7a76] underline underline-offset-2 transition-colors shrink-0 mt-2 mb-1"
                                                    >
                                                        Devamını oku →
                                                    </button>
                                                )}

                                                {/* Author — shrink-0 keeps it pinned at bottom */}
                                                <div className="flex items-center gap-[12px] pt-[14px] border-t border-gray-100 shrink-0 mt-auto">
                                                    <Avatar src={review.avatar} name={review.name} size={42} />
                                                    <div className="flex flex-col justify-center min-w-0">
                                                        <div className="flex items-center gap-[5px]">
                                                            <span className="font-bold text-[0.9rem] text-brand-primary tracking-tight truncate">{review.name}</span>

                                                            <svg className="w-[18px] h-[18px] shrink-0" viewBox="0 0 24 24">
                                                                <path fill="#FBC02D" d="M23,12l-2.44-2.79l0.34-3.69l-3.61-0.82L15.4,1.5L12,2.96L8.6,1.5L6.71,4.69L3.1,5.5L3.44,9.2L1,12l2.44,2.79l-0.34,3.7l3.61,0.82L8.6,22.5l3.4-1.47l3.4,1.46l1.89-3.19l3.61-0.82l-0.34-3.69L23,12z" />
                                                                <path fill="#204544" d="M10,17l-5-5l1.41-1.41L10,14.17l7.59-7.59L19,8L10,17z" />
                                                            </svg>
                                                        </div>
                                                        <span className="text-[0.72rem] text-gray-400 font-medium uppercase tracking-wide">{review.date}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Pagination Dots */}
                    <div className="flex justify-center mt-6 gap-2">
                        {Array.from({ length: maxIndex + 1 }).map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setCurrentIndex(i)}
                                className={`w-3 h-3 rounded-full transition-all duration-300 ${currentIndex === i ? 'bg-brand-accent scale-125' : 'bg-white/30 hover:bg-white/50'
                                    }`}
                                aria-label={`Görüş ${i + 1}`}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Full Review Modal ── */}
            {expandedReview && (
                <div
                    className="absolute inset-0 bg-brand-primary/95 backdrop-blur-md z-[100] flex items-center justify-center p-4 md:p-8 animate-fadeIn overflow-hidden"
                    onClick={() => setExpandedReview(null)}
                >
                    <div
                        className="bg-brand-primary rounded-lg md:rounded-lg border border-white/20 p-8 md:p-10 max-w-2xl w-full shadow-[0_40px_80px_-15px_rgba(0,0,0,0.6)] relative max-h-[90%] overflow-y-auto overflow-x-hidden animate-slideUp"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Quote Icon */}
                        <div className="absolute top-6 right-8 text-[7rem] text-brand-accent/5 font-serif leading-none pointer-events-none select-none italic">"</div>

                        {/* Close button with better visibility */}
                        <button
                            onClick={() => setExpandedReview(null)}
                            className="absolute top-5 right-5 w-10 h-10 rounded-lg bg-white/5 hover:bg-brand-accent hover:text-brand-primary flex items-center justify-center text-white transition-all cursor-pointer z-50 group border border-white/10"
                            aria-label="Kapat"
                        >
                            <svg className="w-5 h-5 group-hover:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        <div className="relative z-10 flex flex-col h-full">
                            {/* Stars */}
                            <div className="flex gap-1.5 mb-6">
                                {[1, 2, 3, 4, 5].map((s) => (
                                    <svg key={s} className={`w-6 h-6 ${s <= (expandedReview.rating || 5) ? 'text-brand-accent' : 'text-white/10'}`} fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                                    </svg>
                                ))}
                            </div>

                            {/* Full text with elegant, well-proportioned typography */}
                            <p className="text-[1.1rem] md:text-[1.25rem] leading-[1.75] text-gray-100 font-light italic mb-10 pr-4">
                                &ldquo;{expandedReview.text}&rdquo;
                            </p>

                            {/* Author section */}
                            <div className="flex items-center gap-5 pt-8 border-t border-white/10 mt-auto">
                                <Avatar src={expandedReview.avatar} name={expandedReview.name} size={64} className="shadow-[0_0_20px_rgba(254,221,89,0.2)] border-2 border-brand-accent/30" />
                                <div className="flex flex-col justify-center">
                                    <div className="flex items-center gap-2.5">
                                        <span className="font-bold text-white text-[1.25rem] leading-tight tracking-tight">{expandedReview.name}</span>

                                        <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                                            <path fill="#FEDD59" d="M23,12l-2.44-2.79l0.34-3.69l-3.61-0.82L15.4,1.5L12,2.96L8.6,1.5L6.71,4.69L3.1,5.5L3.44,9.2L1,12l2.44,2.79l-0.34,3.7l3.61,0.82L8.6,22.5l3.4-1.47l3.4,1.46l1.89-3.19l3.61-0.82l-0.34-3.69L23,12z" />
                                            <path fill="#204544" d="M10,17l-5-5l1.41-1.41L10,14.17l7.59-7.59L19,8L10,17z" />
                                        </svg>
                                    </div>
                                    <span className="text-[0.75rem] text-brand-accent/80 uppercase tracking-[0.2em] font-bold mt-1">{expandedReview.date}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
