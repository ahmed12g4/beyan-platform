import Link from 'next/link'
import { getPublicBlogPosts } from '@/lib/actions/blog'
import Image from 'next/image'
import type { Metadata } from 'next'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.beyandilakademi.com'

export const metadata: Metadata = {
    title: 'Blog | Arapça Öğrenme Rehberi',
    description: 'Arapça öğrenme sürecini hızlandıracak ipucları, rehberler ve akademik makaleler. Beyan Dil Akademi blog yazılarıyla Arapçanızı geliştirin.',
    keywords: [
        'Arapça öğrenme', 'Arapça ipucları', 'Arapça blog',
        'online Arapça rehber', 'dil öğrenme', 'Beyan Dil Akademi blog',
    ],
    alternates: {
        canonical: `${siteUrl}/blog`,
    },
    openGraph: {
        title: 'Blog | Arapça Öğrenme Rehberi | Beyan Dil Akademi',
        description: 'Arapça öğrenme sürecini hızlandıracak ipucları ve rehberler.',
        url: `${siteUrl}/blog`,
        siteName: 'Beyan Dil Akademi',
        locale: 'tr_TR',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Blog | Beyan Dil Akademi',
        description: 'Arapça öğrenme rehberleri ve ipucları.',
    },
}

export default async function BlogPage() {
    const postsData = await getPublicBlogPosts()
    const blogPosts: any[] = Array.isArray(postsData) ? postsData : []

    return (
        <main className="min-h-screen bg-brand-primary pt-[120px] pb-24 text-white font-sans">
            <div className="max-w-[1200px] mx-auto px-6">
                {/* Header – aligned with Reviews design */}
                <div className="text-center mb-16 animate-slideUp">
                    <span className="text-brand-accent text-[0.7rem] font-bold tracking-[0.2em] uppercase mb-4 block">
                        BLOG YAZILARI
                    </span>
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-5 tracking-tight relative inline-block">
                        Arapça Öğrenme Rehberi
                        <span className="absolute -right-4 bottom-2 w-2 h-2 bg-brand-accent rounded-full"></span>
                    </h1>
                    <div className="w-[80px] h-[4px] bg-brand-accent mx-auto rounded-full mb-6"></div>
                    <p className="text-[1.02rem] text-white/80 max-w-2xl mx-auto font-light leading-relaxed mt-2">
                        Dil öğrenme sürecinizi hızlandıracak ipuçları, rehberler ve akademik makaleler.
                    </p>
                </div>

                {/* Blog grid – cards similar spirit to reviews cards */}
                {blogPosts.length === 0 ? (
                    <div className="text-center py-16 bg-white/5 border border-white/10 rounded-lg shadow-xl backdrop-blur-sm">
                        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 text-white/30">
                            <i className="fas fa-newspaper text-2xl"></i>
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">Henüz blog yazısı eklenmemiş</h3>
                        <p className="text-white/70 text-sm">İlk yazıyı eklemek için yönetim panelini kullanın.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
                        {blogPosts.map((post, idx) => (
                            <Link
                                key={post.id}
                                href={`/blog/${post.slug}`}
                                className="bg-white/5 border border-white/10 rounded-lg p-6 hover:bg-white/10 transition-colors duration-300 relative flex flex-col h-full shadow-lg backdrop-blur-sm"
                            >
                                {/* Category + date */}
                                <div className="flex items-center justify-between mb-4 gap-3">
                                    <span className="inline-flex px-3 py-1 rounded-full text-[0.7rem] font-bold uppercase tracking-[0.16em] bg-brand-accent/10 text-brand-accent border border-brand-accent/30">
                                        {post.category || 'Blog'}
                                    </span>
                                    <span className="text-[0.68rem] text-white/60 font-bold uppercase tracking-[0.16em] whitespace-nowrap">
                                        {post.created_at
                                            ? new Date(post.created_at).toLocaleDateString('tr-TR', {
                                                day: 'numeric',
                                                month: 'long',
                                                year: 'numeric',
                                            }).toUpperCase()
                                            : ''}
                                    </span>
                                </div>

                                {/* Title */}
                                <h2 className="text-[1.2rem] md:text-[1.3rem] font-bold text-white mb-3 leading-snug line-clamp-2">
                                    {post.title}
                                </h2>

                                {/* Read time */}
                                <p className="text-[0.7rem] text-white/60 font-black uppercase tracking-[0.2em] mb-4">
                                    {post.read_time || '5 DK OKUMA'}
                                </p>

                                {/* Thumbnail */}
                                {post.image_url && (
                                    <div className="relative w-full h-[160px] rounded-xl overflow-hidden mb-4 border border-white/10">
                                        <Image
                                            src={post.image_url}
                                            alt={post.title}
                                            fill
                                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                                        />
                                    </div>
                                )}

                                {/* Excerpt */}
                                <p className="text-[0.95rem] text-white/85 leading-relaxed flex-1 line-clamp-4">
                                    {post.excerpt || 'Bu yazının detaylarını görmek için tıklayın.'}
                                </p>

                                {/* CTA */}
                                <div className="mt-6 flex items-center justify-between text-[0.85rem] font-semibold text-brand-accent">
                                    <span className="inline-flex items-center gap-2">
                                        Devamını oku
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </span>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                {/* CTA similar to reviews bottom card */}
                <div className="max-w-[750px] mx-auto text-center py-14 px-6 bg-brand-primary-hover/50 rounded-lg border border-white/10 relative overflow-hidden animate-slideUp shadow-xl backdrop-blur-md">
                    <div className="absolute inset-0 bg-gradient-to-br from-brand-accent/5 to-transparent pointer-events-none" />
                    <h2 className="text-3xl md:text-[2.3rem] font-bold text-white mb-6 relative z-10 leading-[1.25]">
                        Daha fazla içerik ve eğitici yazı için<br />blogumuzu düzenli takip edin.
                    </h2>
                    <p className="text-white/75 mb-8 text-[0.95rem] relative z-10">
                        Öğrenme yolculuğunuzda rehber olacak güncel makaleler ve ipuçları.
                    </p>
                    <Link href="/reviews" className="relative z-10 inline-block">
                        <button className="bg-brand-accent text-brand-primary font-bold px-[42px] py-[14px] rounded-xl shadow-lg hover:bg-[#ffe680] hover:-translate-y-0.5 transition-all duration-300 text-[1.02rem]">
                            Öğrenci yorumlarını gör
                        </button>
                    </Link>
                </div>
            </div>
        </main>
    )
}
