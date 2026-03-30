import Image from "next/image";
import Link from "next/link";
import ReviewsCarousel from "@/components/ReviewsCarousel";
import StatsCounter from "@/components/StatsCounter";
import HowItWorks from "@/components/HowItWorks";
import FAQSection from "@/components/FAQSection";
import { AnnouncementBar } from "@/components/AnnouncementBar";
import LiveSessionBanner from "@/components/LiveSessionBanner";
import { getPlatformSettings } from "@/lib/actions/settings";
import { getAllApprovedComments } from "@/lib/actions/comments";
import { FALLBACK_REVIEWS } from "@/lib/constants/fallback-reviews";
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    absolute: 'Beyan Dil Akademi | Online Arapça Eğitimi',
  },
  description:
    'Modern metotlarla online Arapça öğrenin. Canlı dersler, video eğitimler ve uzman eğitmenlerle Arapçanızı hızla geliştirin. Hemen kayıt olun!',
  keywords: [
    'Arapça kursu', 'online Arapça', 'Arapça öğren', 'canlı Arapça dersi',
    'Beyan Dil Akademi', 'Arapça eğitimi Türkiye', 'Arapça online kurs',
  ],
  alternates: {
    canonical: process.env.NEXT_PUBLIC_SITE_URL || 'https://www.beyandilakademi.com',
  },
}

export default async function HomePage() {
  const settings = await getPlatformSettings();

  // Hero Section Defaults
  const heroTitle = settings?.hero_title || "Arapça ile Dünyaya Açılın";
  const heroDesc =
    settings?.hero_description ||
    "Canlı dersler ve esnek video içeriklerle, sıfırdan akıcı seviyeye adım adım ilerleyin. Uzman eğitmenlerle bugün başlayın.";
  const heroImage = settings?.hero_image_url ? `url('${settings.hero_image_url}')` : "url('/assets/hero_bg.png')";

  // Unified primary CTA (defaults to free level test)
  const defaultCtaText = "Ücretsiz Seviye Testine Başla";
  const defaultCtaLink = "/seviye-testi";
  const heroCtaText = settings?.hero_cta_text || defaultCtaText;
  const heroCtaLink = settings?.hero_cta_link || defaultCtaLink;
  const heroCtaVisible = settings?.hero_cta_visible ?? true;

  // Founder Section Defaults
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const founder = (settings?.founder_section as any) || {};
  const founderName = founder.name || "Ziyad Dalil";
  const founderTitle = founder.title || "Merhaba, Ben Ziyad Dalil";
  const founderImage = founder.image_url || "/assets/profile.png";
  const founderBio1 = founder.bio_paragraph_1 || "Arapça öğretme serüvenim yaklaşık iki yıl önce başladı, ancak eğitime ve bu zengin dile olan tutkum her zaman hayatımın merkezindeydi. Geleneksel yöntemlerin zorluklarını görerek, herkesin anlayabileceği daha sade ve keyifli bir metot geliştirmeyi hedefledim.";
  const founderBio2 = founder.bio_paragraph_2 || "Bu vizyonla, edindiğim tecrübeleri dijital dünyaya taşımak ve daha fazla öğrenciye ulaşmak amacıyla Beyan Dil Akademi platformunu yeni hayata geçirdim. Amacım, Arapçayı sadece bir dil olarak değil, bir kültür ve ilim kapısı olarak sevdirmektir.";


  // Stats (Admin Controlled)
  const coursesCount = settings?.stats_courses_count ?? 900;
  const studentsCount = settings?.stats_students_count ?? 75;
  const satisfactionRate = settings?.stats_satisfaction_rate ?? 100;

  // How It Works (Admin Controlled)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const howItWorksData = (settings as any)?.how_it_works_section || null;
  const howItWorksTitle = (settings as any)?.how_it_works_title || undefined;
  const howItWorksSubtitle = (settings as any)?.how_it_works_subtitle || undefined;

  // Fetch approved reviews
  const approvedReviews = await getAllApprovedComments();

  const mappedDbReviews = approvedReviews.map(r => ({
    name: r.author_name || r.user?.full_name || "İsimsiz Öğrenci",
    date: new Date(r.created_at).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" }),
    rating: r.rating || 5,
    text: r.content,
    avatar: r.user?.avatar_url || undefined
  }));

  // Combine DB reviews and Fallbacks. 
  // We want to ensure a minimum of 6 reviews for a full carousel look.
  const reviews: any[] = [...mappedDbReviews];

  // Fill with fallbacks only if we have fewer than 6 reviews total, 
  // avoiding duplicates by text content.
  for (const fb of FALLBACK_REVIEWS) {
    if (reviews.length >= 6) break;

    const isDuplicate = mappedDbReviews.some(db =>
      db.text.trim().toLowerCase() === fb.text.trim().toLowerCase()
    );

    if (!isDuplicate) {
      reviews.push({
        ...fb,
        avatar: (fb as any).avatar || undefined
      });
    }
  }

  return (
    <main className="font-sans text-[#2C2C2C] bg-[#F8F9FA] animate-page-enter">
      <LiveSessionBanner />

      {/* 1. HERO SECTION */}
      {/* Visual Reference: Image Background + Gradient Overlay */}
      <section className="relative min-h-[480px] md:min-h-[420px] flex flex-col items-center justify-center bg-brand-primary text-white text-center px-4 sm:px-5 overflow-hidden pt-[60px] md:pt-[45px] pb-[30px]">
        {/* Background Layer */}
        {settings?.hero_image_url ? (
          <Image
            src={settings.hero_image_url}
            alt="Hero Background"
            fill
            priority
            className="object-cover z-0"
            sizes="100vw"
          />
        ) : (
          <div
            className="absolute inset-0 bg-cover bg-center z-0"
            style={{ backgroundImage: "url('/assets/hero_bg.png')" }}
          ></div>
        )}
        <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/95 to-brand-primary/70 z-0"></div>

        {/* Floating Auth Buttons (Desktop Only) */}
        <div className="hidden xl:flex absolute top-[12px] right-[3%] flex-row items-center gap-[10px] sm:gap-[15px] z-20 md:top-[20px] md:right-[5%] animate-fadeIn">
          {/* Login Button */}
          <Link href="/giris">
            <button className="font-medium text-[0.85rem] md:text-[0.95rem] text-white/90 bg-transparent hover:text-brand-accent hover:-translate-y-[1px] transition-all duration-300 px-4 py-2 border border-white/10 rounded-lg hover:bg-white/5 whitespace-nowrap">
              Giriş Yap
            </button>
          </Link>

          {/* Register Button */}
          <Link href="/kayit">
            <button className="font-semibold text-[0.85rem] md:text-[0.95rem] bg-brand-accent text-brand-primary px-[20px] sm:px-[35px] py-[10px] rounded-lg shadow-lg hover:bg-[#ffe680] hover:-translate-y-[2px] transition-all duration-300 whitespace-nowrap">
              Kayıt Ol
            </button>
          </Link>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-[950px] mx-auto px-4 sm:px-0">
          <h1 className="mb-[15px] sm:mb-[20px] text-[2.75rem] sm:text-[3.2rem] md:text-[4.2rem] font-bold tracking-tight leading-[1.1] sm:leading-[1.05] opacity-0 animate-slideUp text-white drop-shadow-lg">
            {heroTitle}
          </h1>

          <div className="w-[80px] h-[3px] bg-brand-accent mx-auto mb-[25px] opacity-0 animate-slideUp animate-delay-100 rounded-full"></div>

          <p className="text-[1.1rem] sm:text-[1.2rem] md:text-[1.35rem] font-light opacity-0 max-w-2xl mx-auto mb-[35px] md:mb-[45px] leading-relaxed animate-slideUp animate-delay-200 text-white/95 px-2 font-sans">
            {heroDesc}
          </p>

          {heroCtaVisible && heroCtaText && (
            <div className="mb-[10px] opacity-0 animate-slideUp animate-delay-300 w-full flex justify-center mt-2">
              <Link href={heroCtaLink} className="w-full sm:w-auto inline-block">
                <button className="w-full sm:w-auto font-bold text-[1.1rem] sm:text-[1.125rem] bg-brand-accent text-brand-primary px-[28px] py-[13px] sm:py-[14px] sm:px-[32px] rounded-lg shadow-[0_8px_25px_rgba(254,221,89,0.3)] hover:bg-[#ffe680] hover:scale-105 hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-2 mx-auto">
                  {heroCtaText} <i className="fas fa-arrow-right"></i>
                </button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* 2. STATS SECTION */}
      <section className="bg-[#F8F9FA] pt-[35px] pb-[45px] md:py-[50px] relative z-10 overflow-visible">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-y-6 gap-x-6 md:gap-[50px] text-center">
            <StatsCounter
              startValue={600}
              endValue={coursesCount}
              suffix="+"
              label="Eğitim Dersi"
            />
            <StatsCounter
              startValue={60}
              endValue={studentsCount}
              suffix="+"
              label="Eğitim Alan Öğrenci"
            />
            <div className="col-span-2 md:col-span-1 flex flex-col items-center justify-center">
              <StatsCounter
                startValue={0}
                endValue={satisfactionRate}
                suffix="%"
                label="Öğrenci Memnuniyeti"
              >
                <div className="flex items-center justify-center gap-1 mt-1 text-brand-accent text-[0.8rem] bg-brand-accent/10 px-3 py-1 rounded-full whitespace-nowrap">
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star"></i>
                </div>
              </StatsCounter>
            </div>
          </div>
        </div>
      </section>

      {/* 3. HOW IT WORKS SECTION (Moved up for better Cognitive Flow) */}
      <HowItWorks
        steps={howItWorksData || undefined}
        title={howItWorksTitle}
        subtitle={howItWorksSubtitle}
      />

      {/* 4. GRATITUDE SECTION */}
      <section className="bg-[#F8F9FA] py-[80px] md:py-[100px] text-center border-t border-gray-100">
        <div className="max-w-[1200px] mx-auto px-5">
          <h2 className="text-[2.2rem] sm:text-[2.5rem] md:text-[2.8rem] tracking-tight font-bold text-brand-primary mb-[50px] leading-tight">
            {settings?.gratitude_title || "Öğrencilerimiz Neden Bizi Seviyor?"}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-[40px]">
            {(settings?.gratitude_section as any[])?.length > 0 ? (
              (settings?.gratitude_section as any[])?.map((item, idx) => (
                <div key={idx} className="bg-white p-[30px_20px] sm:p-[35px_25px] md:p-[45px_30px] rounded-lg shadow-[0_10px_40px_rgba(0,0,0,0.04)] border-b-[5px] border-brand-accent hover:-translate-y-[8px] transition-all duration-300">
                  <div className="w-[75px] h-[75px] mx-auto mb-[30px] flex items-center justify-center bg-brand-accent/15 rounded-lg transition-transform">
                    <svg className="w-[38px] h-[38px] text-brand-accent" fill="currentColor" viewBox="0 0 24 24">
                      {idx % 3 === 0 && <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />}
                      {idx % 3 === 1 && <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z" />}
                      {idx % 3 === 2 && <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />}
                    </svg>
                  </div>
                  <p className="text-[1.1rem] md:text-[1.15rem] italic text-[#555] leading-[1.7] font-medium">
                    &quot;{item.text}&quot;
                  </p>
                </div>
              ))
            ) : (
              <>
                {/* Fallback Cards */}
                <div className="bg-white p-[30px_20px] sm:p-[35px_25px] md:p-[45px_30px] rounded-lg shadow-[0_10px_40px_rgba(0,0,0,0.04)] border-b-[5px] border-brand-accent hover:-translate-y-[8px] transition-all duration-300">
                  <div className="w-[75px] h-[75px] mx-auto mb-[30px] flex items-center justify-center bg-brand-accent/15 rounded-lg transition-transform">
                    <svg className="w-[38px] h-[38px] text-brand-accent" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                    </svg>
                  </div>
                  <p className="text-[1.125rem] sm:text-[1.15rem] italic text-[#444] leading-[1.7] font-medium">
                    &quot;Arapça öğrenmek hiç bu kadar keyifli ve kolay olmamıştı. Beyan Dil Akademi bana cesaret verdi.&quot;
                  </p>
                </div>
                <div className="bg-white p-[30px_20px] sm:p-[35px_25px] md:p-[45px_30px] rounded-lg shadow-[0_10px_40px_rgba(0,0,0,0.04)] border-b-[5px] border-brand-accent hover:-translate-y-[8px] transition-all duration-300">
                  <div className="w-[75px] h-[75px] mx-auto mb-[30px] flex items-center justify-center bg-brand-accent/15 rounded-lg transition-transform">
                    <svg className="w-[38px] h-[38px] text-brand-accent" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z" />
                    </svg>
                  </div>
                  <p className="text-[1.125rem] sm:text-[1.15rem] italic text-[#444] leading-[1.7] font-medium">
                    &quot;Kariyerim için attığım en doğru adım. Modern yöntemlerle hızlıca ilerledim.&quot;
                  </p>
                </div>
                <div className="bg-white p-[30px_20px] sm:p-[35px_25px] md:p-[45px_30px] rounded-lg shadow-[0_10px_40px_rgba(0,0,0,0.04)] border-b-[5px] border-brand-accent hover:-translate-y-[8px] transition-all duration-300">
                  <div className="w-[75px] h-[75px] mx-auto mb-[30px] flex items-center justify-center bg-brand-accent/15 rounded-lg transition-transform">
                    <svg className="w-[38px] h-[38px] text-brand-accent" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                    </svg>
                  </div>
                  <p className="text-[1.125rem] sm:text-[1.15rem] italic text-[#444] leading-[1.7] font-medium">
                    &quot;Sadece bir dil kursu değil, sıcak bir aile ortamı. Her soruma anında yanıt buldum.&quot;
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* 5. REVIEWS SECTION */}
      <div id="yorumlar" className="bg-white pt-10 scroll-mt-20">
        <ReviewsCarousel reviews={reviews} />
      </div>

      {/* 6. FOUNDER SECTION */}
      <section className="bg-white py-[60px] md:py-[80px] relative overflow-hidden">
        <div className="max-w-[1100px] mx-auto px-6 relative z-10">
          <div className="flex flex-col lg:flex-row items-center justify-center gap-[30px] sm:gap-[40px] lg:gap-[60px]">
            {/* Image Side */}
            <div className="flex-none relative group">
              <div className="absolute -inset-4 bg-gradient-to-tr from-brand-accent to-brand-primary opacity-20 rounded-lg blur-lg group-hover:opacity-30 transition-opacity duration-500"></div>
              <div className="relative w-[260px] sm:w-[280px] md:w-[320px] rounded-lg overflow-hidden shadow-[0_20px_40px_rgba(0,0,0,0.15)] ring-4 ring-white">
                <Image
                  src={founderImage}
                  alt={founderName}
                  width={320}
                  height={320}
                  className="object-cover w-full h-auto block transform group-hover:scale-105 transition-transform duration-700 ease-in-out"
                />
              </div>
            </div>

            {/* Content Side */}
            <div className="flex-1 text-center lg:text-left">
              <h2 className="text-[1.8rem] md:text-[2.5rem] text-brand-primary mb-[25px] font-bold leading-tight tracking-tight relative inline-block">
                {founderTitle}
                <span className="absolute -bottom-2 left-1/2 lg:left-0 -translate-x-1/2 lg:translate-x-0 w-[40%] h-[4px] bg-brand-accent rounded-full"></span>
              </h2>

              <div className="space-y-6 text-base md:text-[1.1rem] leading-[1.8] text-gray-600 font-medium font-sans text-center lg:text-justify mt-4 lg:max-w-[700px]">
                <p className="border-l-4 border-brand-accent pl-5 italic text-gray-800 text-left">
                  &quot;Bir dili öğrenmek, sadece kelimeleri ezberlemek değil; o dilin ruhunu, kültürünü ve dünyayı algılayış biçimini keşfetmektir.&quot;
                </p>
                <p className="text-pretty">
                  {founderBio1}
                </p>
                <p className="text-pretty">
                  {founderBio2}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. FINAL CTA SECTION */}
      <section className="bg-brand-primary py-[80px] md:py-[100px] text-white relative overflow-hidden">
        {/* Decorative Circles background */}
        <div className="absolute top-1/2 left-0 -translate-y-1/2 -translate-x-1/2 w-[300px] h-[300px] bg-brand-accent/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute top-0 right-0 translate-x-1/3 -translate-y-1/3 w-[400px] h-[400px] bg-brand-accent/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-[1000px] mx-auto px-6 relative z-10 text-center">
          <h2 className="text-[2rem] md:text-[3.2rem] font-bold mb-6 tracking-tight leading-tight">
            Arapça Yolculuğunuza <br className="hidden sm:block" /> Bugün Başlayın
          </h2>
          <p className="text-[1.1rem] md:text-[1.3rem] text-white/80 max-w-2xl mx-auto mb-10 font-medium leading-relaxed">
            Türkiye&apos;nin en kapsamlı online platformunda yerinizi alın, <br className="hidden md:block" /> akademik kalitede Arapça öğrenmenin ayrıcalığını yaşayın.
          </p>
          <Link href={heroCtaLink}>
            <button className="bg-brand-accent text-brand-primary font-bold text-[1rem] px-7 py-3.5 md:px-9 md:py-4 rounded-lg shadow-[0_15px_40px_rgba(254,221,89,0.25)] hover:bg-[#ffe680] hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-3 mx-auto active:scale-95">
              {heroCtaText}
            </button>
          </Link>
        </div>
      </section>

    </main >
  );
}
