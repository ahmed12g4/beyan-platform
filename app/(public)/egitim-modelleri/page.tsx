import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";

export default async function EgitimModelleriPage() {
    const supabase = await createClient();
    const { data: teachers } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, bio')
        .eq('role', 'teacher')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(6);

    return (
        <main className="bg-[#F8F9FA] min-h-screen pt-[120px] pb-24 text-brand-primary">
            {/* Header Section */}
            <div className="text-center mb-16 px-6 animate-slideUp">
                <span className="text-brand-accent text-[0.7rem] font-bold tracking-[0.2em] uppercase mb-4 block">
                    ONLİNE EĞİTİM
                </span>
                <h1 className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight text-brand-primary">
                    Size En Uygun Ders Modeli<span className="text-brand-accent">.</span>
                </h1>
                <p className="text-[1.05rem] text-gray-500 max-w-2xl mx-auto font-light leading-relaxed mt-4">
                    3 farklı seçenek: canlı grup dersleri, birebir özel ders ve kayıtlı video modüller. Hedefinize göre en doğru yoldan ilerleyin.
                </p>
            </div>

            <div className="max-w-[1240px] mx-auto px-6 space-y-24">

                {/* SECTION 1: INTERAKTIF AKADEMI (LIVE) */}
                <section>
                    <div className="flex flex-col items-center lg:flex-row lg:items-center gap-4 mb-10">
                        <div className="h-[2px] w-12 bg-brand-accent"></div>
                        <h2 className="text-2xl font-bold text-brand-primary uppercase tracking-wider text-center lg:text-left">İnteraktif Akademi (Canlı)</h2>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Canlı Grup */}
                        <div className="bg-white rounded-xl border border-brand-primary/10 overflow-hidden group hover:shadow-xl transition-all duration-500 text-center lg:text-left">
                            <div className="p-10 flex flex-col items-center lg:items-start">
                                <div className="flex items-start justify-between w-full mb-8 lg:flex-row flex-col items-center gap-4 lg:gap-0">
                                    <div className="w-16 h-16 bg-brand-primary/5 rounded-xl flex items-center justify-center border border-brand-primary/10 transition-colors group-hover:bg-brand-primary group-hover:text-white">
                                        <i className="fas fa-users text-2xl"></i>
                                    </div>
                                    <span className="px-4 py-1.5 bg-brand-accent/20 text-brand-primary text-xs font-bold rounded-full uppercase">En Popüler</span>
                                </div>
                                <h3 className="text-2xl font-bold text-brand-primary mb-4">Canlı Grup Dersleri</h3>
                                <p className="text-gray-500 mb-8 leading-relaxed max-w-[400px]">
                                    Maksimum 12 kişilik interaktif sınıflarda, ana dili Arapça olan hocalarımızla gerçek zamanlı dersler. Sosyal öğrenme deneyimi ile motivasyonunuzu yüksek tutun.
                                </p>
                                <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10 w-full">
                                    {["Görüntülü & Sesli Katılım", "Haftalık Canlı Oturumlar", "Grup içi Etkileşim", "Ders Kayıtlarına Erişim"].map((f, i) => (
                                        <li key={i} className="flex items-center justify-center lg:justify-start gap-2 text-sm text-gray-600 font-medium">
                                            <i className="fas fa-check text-brand-accent text-[10px]"></i> {f}
                                        </li>
                                    ))}
                                </ul>
                                <Link href="/kayit" className="w-full">
                                    <button className="w-full py-4 bg-brand-primary text-white font-bold rounded-xl hover:bg-brand-primary-dark transition-all duration-300 shadow-lg shadow-brand-primary/10">
                                        Akademiye Katıl
                                    </button>
                                </Link>
                            </div>
                        </div>

                        {/* Birebir Özel */}
                        <div className="bg-white rounded-xl border border-brand-primary/10 overflow-hidden group hover:shadow-xl transition-all duration-500 text-center lg:text-left">
                            <div className="p-10 flex flex-col items-center lg:items-start">
                                <div className="mb-8">
                                    <div className="w-16 h-16 bg-brand-primary/5 rounded-xl flex items-center justify-center border border-brand-primary/10 transition-colors group-hover:bg-brand-primary group-hover:text-white">
                                        <i className="fas fa-user-graduate text-2xl"></i>
                                    </div>
                                </div>
                                <h3 className="text-2xl font-bold text-brand-primary mb-4">Birebir Özel Ders</h3>
                                <p className="text-gray-500 mb-8 leading-relaxed max-w-[400px]">
                                    Tamamen size özel hazırlanan müfredat ile hocanızla baş başa ders alın. Kendi hızınızda ilerleyin, sadece ihtiyaç duyduğunuz konulara odaklanın.
                                </p>
                                <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10 w-full">
                                    {["Esnek Randevu Sistemi", "%100 Kişiye Özel İçerik", "Hızlı İlerleme Garantisi", "Özel Kitap & Materyal"].map((f, i) => (
                                        <li key={i} className="flex items-center justify-center lg:justify-start gap-2 text-sm text-gray-600 font-medium">
                                            <i className="fas fa-check text-brand-accent text-[10px]"></i> {f}
                                        </li>
                                    ))}
                                </ul>
                                <Link href="/iletisim" className="w-full">
                                    <button className="w-full py-4 border-2 border-brand-primary text-brand-primary font-bold rounded-xl hover:bg-brand-primary hover:text-white transition-all duration-300">
                                        Özel Program İstiyorum
                                    </button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>

                {/* SECTION 2: DIJITAL KÜTÜPHANE (RECORDED) */}
                <section>
                    <div className="flex flex-col items-center lg:flex-row lg:items-center gap-4 mb-10">
                        <div className="h-[2px] w-12 bg-brand-accent"></div>
                        <h2 className="text-2xl font-bold text-brand-primary uppercase tracking-wider text-center lg:text-left">Dijital Kütüphane (Kayıtlı)</h2>
                    </div>

                    <div className="bg-brand-primary rounded-xl overflow-hidden relative group">
                        <div className="absolute top-0 right-0 w-1/3 h-full bg-brand-accent/5 skew-x-12 translate-x-12"></div>
                        <div className="p-10 md:p-16 flex flex-col lg:flex-row items-center gap-12 relative z-10">
                            <div className="flex-1 text-center lg:text-left flex flex-col items-center lg:items-start">
                                <div className="inline-block px-4 py-2 bg-brand-accent text-brand-primary text-xs font-black rounded-lg mb-6 uppercase tracking-widest leading-none">Bağımsız Öğrenme</div>
                                <h3 className="text-3xl md:text-4xl font-bold text-white mb-6">Video Eğitim Modülleri</h3>
                                <p className="text-white/70 text-lg mb-10 max-w-xl text-center lg:text-left">
                                    Zaman kısıtlaması olmadan, binlerce dakikalık yüksek kaliteli video içeriğine 7/24 erişin. Her ders sonunda interaktif testler ile bilginizi tazeleyin.
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12 list-none w-full">
                                    {[
                                        { i: "fas fa-infinity", t: "Ömür Boyu Erişim" },
                                        { i: "fas fa-mobile-alt", t: "Her Cihazdan İzle" },
                                        { i: "fas fa-tasks", t: "Bölüm Sonu Testleri" },
                                        { i: "fas fa-certificate", t: "Sertifika İmkanı" }
                                    ].map((item, i) => (
                                        <li key={i} className="flex items-center justify-center lg:justify-start gap-3 text-white/90">
                                            <i className={`${item.i} text-brand-accent w-5 text-center`}></i>
                                            <span className="font-medium">{item.t}</span>
                                        </li>
                                    ))}
                                </div>
                                <Link href="/kayitli-kurslar" className="w-full sm:w-auto">
                                    <button className="w-full sm:px-10 py-5 bg-brand-accent text-brand-primary font-black rounded-xl hover:bg-white transition-all duration-300 shadow-xl shadow-black/20 text-lg">
                                        Kütüphaneyi Keşfet
                                    </button>
                                </Link>
                            </div>
                            <div className="flex-none w-full max-w-[400px] lg:max-w-[450px]">
                                <div className="relative aspect-video rounded-xl overflow-hidden border-4 border-white/10 shadow-2xl group-hover:scale-105 transition-transform duration-700">
                                    <Image
                                        src="/assets/video-player-mock.png"
                                        alt="Video Eğitim"
                                        fill
                                        className="object-cover opacity-80"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                        <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white text-3xl animate-pulse">
                                            <i className="fas fa-play ml-1"></i>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* SECTION 3: TEACHERS */}
                <section>
                    <div className="flex flex-col items-center lg:flex-row lg:items-center gap-4 mb-10">
                        <div className="h-[2px] w-12 bg-brand-accent"></div>
                        <h2 className="text-2xl font-bold text-brand-primary uppercase tracking-wider text-center lg:text-left">Eğitmen Kadromuz</h2>
                    </div>

                    {!teachers || teachers.length === 0 ? (
                        <div className="bg-white rounded-xl border border-brand-primary/10 p-10 text-center">
                            <p className="text-gray-500">Yakında eğitmenlerimizi burada listeleyeceğiz.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {(teachers as any[])?.map((t: any) => (
                                <div key={t.id} className="bg-white rounded-xl border border-brand-primary/10 p-7 hover:shadow-xl transition-all duration-300">
                                    <div className="flex items-center gap-4">
                                        {t.avatar_url ? (
                                            <Image
                                                src={t.avatar_url}
                                                alt={t.full_name}
                                                width={56}
                                                height={56}
                                                className="rounded-full object-cover border border-gray-100"
                                            />
                                        ) : (
                                            <div className="w-14 h-14 rounded-full bg-brand-primary/10 border border-brand-primary/10 flex items-center justify-center text-brand-primary">
                                                <i className="fas fa-user-tie"></i>
                                            </div>
                                        )}
                                        <div className="min-w-0">
                                            <h3 className="text-lg font-extrabold text-gray-900 truncate">{t.full_name}</h3>
                                            <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Eğitmen</p>
                                        </div>
                                    </div>
                                    <p className="text-gray-500 text-sm leading-relaxed mt-4 line-clamp-3">
                                        {t.bio || 'Öğrencilerimizin hedeflerine göre kişiselleştirilmiş bir öğrenme deneyimi sunuyoruz.'}
                                    </p>
                                    <Link href="/kayit" className="inline-flex items-center gap-2 font-bold text-brand-primary hover:text-brand-accent transition-colors mt-4">
                                        Ders Planla <i className="fas fa-arrow-right text-xs"></i>
                                    </Link>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* SECTION 4: PRIVATE PACKAGES (Marketing) */}
                <section>
                    <div className="flex flex-col items-center lg:flex-row lg:items-center gap-4 mb-10">
                        <div className="h-[2px] w-12 bg-brand-accent"></div>
                        <h2 className="text-2xl font-bold text-brand-primary uppercase tracking-wider text-center lg:text-left">Birebir Ders Paketleri</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { title: "4 Ders Paketi", desc: "Kısa hedefler için hızlı başlangıç.", badge: "Başlangıç" },
                            { title: "8 Ders Paketi", desc: "Düzenli pratik ve takipli ilerleme.", badge: "Popüler" },
                            { title: "12 Ders Paketi", desc: "Hızlı seviye atlamak isteyenlere.", badge: "Avantajlı" },
                            { title: "20 Ders Paketi", desc: "Yoğun program ve maksimum verim.", badge: "Pro" },
                        ].map((p) => (
                            <div key={p.title} className="bg-white rounded-xl border border-brand-primary/10 p-7 hover:shadow-xl transition-all duration-300">
                                <div className="flex items-center justify-between mb-5">
                                    <div className="w-12 h-12 rounded-xl bg-brand-primary/5 border border-brand-primary/10 flex items-center justify-center text-brand-primary">
                                        <i className="fas fa-layer-group"></i>
                                    </div>
                                    <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-brand-accent/20 text-brand-primary tracking-wider">
                                        {p.badge}
                                    </span>
                                </div>
                                <h3 className="text-xl font-extrabold text-brand-primary mb-2">{p.title}</h3>
                                <p className="text-gray-500 text-sm leading-relaxed mb-6">{p.desc}</p>
                                <Link href="/iletisim" className="inline-flex items-center gap-2 font-bold text-brand-primary hover:text-brand-accent transition-colors">
                                    Fiyat Bilgisi Al <i className="fas fa-arrow-right text-xs"></i>
                                </Link>
                            </div>
                        ))}
                    </div>
                </section>

                {/* CORPORATE (SMALLER FOOTPRINT) */}
                <section className="bg-white rounded-xl border border-brand-primary/10 p-10 md:p-12 text-center">
                    <div className="w-max mx-auto mb-6 bg-gray-50 p-4 rounded-full">
                        <i className="fas fa-briefcase text-3xl text-gray-400"></i>
                    </div>
                    <h3 className="text-2xl font-bold text-brand-primary mb-4">Kurumsal Arapça Çözümleri</h3>
                    <p className="text-gray-500 max-w-2xl mx-auto mb-8">
                        Şirketiniz veya kurumunuz için sektörel terminoloji odaklı özel eğitim programları. Ekibinizin dil becerilerini profesyonel düzeye taşıyoruz.
                    </p>
                    <Link href="/iletisim" className="text-brand-primary font-bold hover:underline">
                        Detaylı İletişim & Teklif Al <i className="fas fa-arrow-right ml-2 text-sm"></i>
                    </Link>
                </section>

            </div>
        </main>
    );
}
