import Image from "next/image";
import type { Metadata } from 'next'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.beyandilakademi.com'

export const metadata: Metadata = {
    title: 'Hakkımızda',
    description: 'Beyan Dil Akademi hakkında bilgi edinin. Kurucumuz Ziyad Dalil ve modern Arapça öğretim metodolojimiz hakkında detaylı bilgi alın.',
    keywords: ['Beyan Dil Akademi', 'hakkımızda', 'Ziyad Dalil', 'Arapça öğretmeni', 'online Arapça kursu'],
    alternates: {
        canonical: `${siteUrl}/hakkimizda`,
    },
    openGraph: {
        title: 'Hakkımızda | Beyan Dil Akademi',
        description: 'Beyan Dil Akademi hakkında bilgi edinin. Kurucumuz ve Arapça öğretim metodolojimiz hakkında detaylı bilgi alın.',
        url: `${siteUrl}/hakkimizda`,
        siteName: 'Beyan Dil Akademi',
        locale: 'tr_TR',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Hakkımızda | Beyan Dil Akademi',
        description: 'Beyan Dil Akademi hakkında bilgi edinin.',
    },
}

export default function AboutPage() {
    return (
        <main className="min-h-[85vh] bg-brand-primary flex items-center justify-center py-[60px] md:py-[80px] text-white">
            <div className="max-w-[1200px] mx-auto px-5 w-full">

                {/* Clean, Centered Header */}
                <div className="text-center mb-[60px] md:mb-[80px] opacity-0 animate-gentle-rise">
                    <span className="text-brand-accent text-sm font-bold tracking-[0.2em] uppercase mb-3 block">Hikayemiz</span>
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight relative inline-block">
                        Hakkımızda

                        {/* Decorative Dot */}
                        <span className="absolute -right-4 bottom-2 w-2 h-2 bg-brand-accent rounded-full"></span>
                    </h1>
                    <div className="w-[80px] h-[4px] bg-brand-accent mx-auto rounded-full"></div>
                </div>

                {/* Founder Section - Polished */}
                <div className="flex flex-col md:flex-row items-center justify-center gap-[50px] md:gap-[80px]">

                    {/* Image Side - Creative & Elegant */}
                    <div className="flex-none relative group opacity-0 animate-gentle-rise animate-delay-200">
                        <div className="relative w-[300px] md:w-[380px] rounded-lg overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.5)] transition-all duration-700 ease-out group-hover:shadow-[0_40px_80px_rgba(254,221,89,0.2)] group-hover:-translate-y-2 border border-white/10">
                            <Image
                                src="/assets/profile.png"
                                alt="Ziyad Dalil"
                                width={380}
                                height={380}
                                className="object-cover w-full h-auto block transform transition-transform duration-1000 group-hover:scale-105"
                                priority
                            />
                            {/* Subtle internal border/overlay */}
                            <div className="absolute inset-0 border-[1px] border-white/10 rounded-lg pointer-events-none"></div>
                            <div className="absolute inset-0 bg-gradient-to-t from-brand-primary/80 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-700"></div>
                        </div>

                        {/* Floating Decorative Element */}
                        <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-brand-accent/20 rounded-full blur-3xl -z-10"></div>
                        <div className="absolute -top-8 -left-8 w-32 h-32 bg-brand-accent/10 rounded-full blur-3xl -z-10"></div>
                    </div>

                    {/* Content Side - Refined Typography */}
                    <div className="flex-1 text-center md:text-left max-w-xl opacity-0 animate-gentle-rise animate-delay-300">
                        <h2 className="text-[1.8rem] md:text-[2.5rem] text-white mb-[25px] font-bold leading-tight">

                            Merhaba, <br />
                            <span className="text-brand-accent">Ben Ziyad Dalil</span>
                        </h2>

                        <div className="space-y-6 text-base md:text-[1.1rem] leading-[1.8] text-white/80 font-medium font-sans text-center md:text-justify">
                            <p className="border-l-4 border-brand-accent pl-5 italic text-white text-left">
                                &quot;Bir dili öğrenmek, sadece kelimeleri ezberlemek değil; o dilin ruhunu, kültürünü ve dünyayı algılayış biçimini keşfetmektir.&quot;
                            </p>
                            <p>
                                Arapça öğretme serüvenim yaklaşık iki yıl önce başladı, ancak eğitime ve bu zengin dile olan tutkum her zaman hayatımın merkezindeydi. Geleneksel yöntemlerin karmaşıklığını bir kenara bırakıp, herkesin anlayabileceği daha <span className="text-brand-accent font-semibold underline decoration-white/20 decoration-2 underline-offset-2">sade ve keyifli</span> bir metot geliştirmeyi hedefledim.
                            </p>
                            <p>
                                Bu vizyonla, edindiğim tecrübeleri dijital dünyaya taşımak ve daha fazla öğrenciye ulaşmak amacıyla <span className="font-bold text-brand-accent">Beyan Dil Akademisi</span> platformunu hayata geçirdim. Amacım, Arapçayı sadece bir ders olarak değil, bir ilim ve kültür kapısı olarak sevdirmektir.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
