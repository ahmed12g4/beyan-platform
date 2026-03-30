import { getAllApprovedComments } from "@/lib/actions/comments";
import { FALLBACK_REVIEWS } from "@/lib/constants/fallback-reviews";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Öğrenci Yorumları',
    description: 'Beyan Dil Akademi öğrencileri neler söylüyor? Arapça eğitimimiz hakkındaki gerçek öğrenci deneyimlerini okuyun.',
}

export default async function ReviewsPage() {
    // Fetch approved reviews from DB
    const approvedReviews = await getAllApprovedComments();

    const mappedDbReviews = approvedReviews.map(r => ({
        name: r.author_name || r.user?.full_name || "İsimsiz Öğrenci",
        date: new Date(r.created_at).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" }).toUpperCase(),
        rating: r.rating || 5,
        text: r.content,
        avatar: r.user?.avatar_url || undefined
    }));

    // Merge with fallbacks
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const reviews: any[] = [...mappedDbReviews];
    FALLBACK_REVIEWS.forEach(fb => {
        // Prevent duplicates based on text content
        const isDuplicate = mappedDbReviews.some(db =>
            db.text.trim().toLowerCase() === fb.text.trim().toLowerCase()
        );
        if (!isDuplicate) {
            reviews.push({
                ...fb,
                avatar: fb.avatar || undefined,
                date: fb.date ? fb.date.toUpperCase() : "15 AĞUSTOS 2024",
            });
        }
    });

    return (
        <main className="min-h-screen bg-brand-primary pt-[120px] pb-24 text-white">
            <div className="max-w-[1200px] mx-auto px-6">

                {/* Header (Platform Colors - Hakkımızda Style) */}
                <div className="text-center mb-20 animate-slideUp">
                    <span className="text-brand-accent text-[0.7rem] font-bold tracking-[0.2em] uppercase mb-4 block">
                        BAŞARI HİKAYELERİ
                    </span>
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight relative inline-block">
                        Öğrenci Yorumları
                        {/* Decorative Dot */}
                        <span className="absolute -right-4 bottom-2 w-2 h-2 bg-brand-accent rounded-full"></span>
                    </h1>
                    <div className="w-[80px] h-[4px] bg-brand-accent mx-auto rounded-full mb-8"></div>
                    <p className="text-[1.05rem] text-white/80 max-w-2xl mx-auto font-light leading-relaxed mt-4">
                        Beyan Dil Akademi ile yeni bir dil öğrenenler, deneyimlerini paylaşıyor.
                    </p>
                </div>

                {/* Grid */}
                {reviews.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-24">
                        {reviews.map((review, idx) => (
                            <div key={idx} className="bg-white/5 border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-colors duration-300 relative flex flex-col h-full shadow-lg backdrop-blur-sm animate-fadeIn" style={{ animationDelay: `${idx * 50}ms` }}>

                                {/* Top Row: Avatar & Name */}
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex items-center gap-4">
                                        {/* Avatar */}
                                        <div className="relative w-12 h-12 rounded-full overflow-hidden bg-white/10 flex items-center justify-center shrink-0 border border-white/20">
                                            {review.avatar ? (
                                                <Image src={review.avatar} alt={review.name} fill className="object-cover" />
                                            ) : (
                                                <i className="fas fa-user text-white/50 text-xl"></i>
                                            )}
                                        </div>

                                        {/* Name & Date */}
                                        <div className="pt-1">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <h3 className="font-bold text-white text-[1.1rem] leading-none mb-1">{review.name}</h3>
                                                {/* Verify Badge using Brand Accent and Primary */}
                                                <svg className="w-[14px] h-[14px] mb-1 shrink-0" viewBox="0 0 24 24">
                                                    <path className="fill-brand-accent" d="M23,12l-2.44-2.79l0.34-3.69l-3.61-0.82L15.4,1.5L12,2.96L8.6,1.5L6.71,4.69L3.1,5.5L3.44,9.2L1,12l2.44,2.79l-0.34,3.7l3.61,0.82L8.6,22.5l3.4-1.47l3.4,1.46l1.89-3.19l3.61-0.82l-0.34-3.69L23,12z" />
                                                    <path className="fill-brand-primary" d="M10,17l-5-5l1.41-1.41L10,14.17l7.59-7.59L19,8L10,17z" />
                                                </svg>
                                            </div>
                                            <div className="text-[0.6rem] text-white/50 tracking-[0.15em] font-bold uppercase">
                                                {review.date}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Quote Icon */}
                                    <div className="text-white/10 text-5xl leading-none font-serif select-none -mt-2 -mr-1">
                                        &quot;
                                    </div>
                                </div>

                                {/* Stars */}
                                <div className="flex gap-1 mb-6">
                                    {[...Array(5)].map((_, i) => (
                                        <i key={i} className={`fas fa-star text-[0.8rem] ${i < review.rating ? 'text-brand-accent' : 'text-white/20'}`}></i>
                                    ))}
                                </div>

                                {/* Review Text */}
                                <p className="text-white/90 italic text-[0.95rem] leading-[1.7] flex-1 font-light">
                                    {review.text}
                                </p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white/5 border border-white/10 rounded-2xl mb-24 shadow-xl backdrop-blur-sm">
                        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 text-white/30">
                            <i className="fas fa-comment-slash text-2xl"></i>
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">Henüz Yorum Yok</h3>
                        <p className="text-white/70">İlk yorumu yapan siz olun!</p>
                    </div>
                )}

                {/* Bottom CTA Card */}
                <div className="max-w-[750px] mx-auto text-center py-16 px-6 bg-brand-primary-hover/50 rounded-3xl border border-white/10 relative overflow-hidden animate-slideUp shadow-xl backdrop-blur-md">
                    {/* Subtle inner glow using brand accent */}
                    <div className="absolute inset-0 bg-gradient-to-br from-brand-accent/5 to-transparent pointer-events-none"></div>

                    <h2 className="text-3xl md:text-[2.5rem] font-bold text-white mb-[2.5rem] relative z-10 leading-[1.2]">
                        Siz de bu başarı hikayesinin<br />bir parçası olun.
                    </h2>

                    <Link href="/seviyeler" className="relative z-10 inline-block">
                        <button className="bg-brand-accent text-brand-primary font-bold px-[42px] py-[15px] rounded-xl shadow-lg hover:bg-[#ffe680] hover:-translate-y-0.5 transition-all duration-300 text-[1.05rem]">
                            Kursları İncele
                        </button>
                    </Link>
                </div>
            </div>
        </main>
    );
}
