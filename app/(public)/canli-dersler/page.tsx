import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";

export default async function CanliDerslerPage() {
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
                <span className="text-brand-accent text-[0.75rem] font-bold tracking-[0.25em] uppercase mb-4 block">
                    İNTERAKTİF EĞİTİM
                </span>
                <h1 className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight text-brand-primary">
                    Canlı & Birebir Dersler<span className="text-brand-accent">.</span>
                </h1>
                <p className="text-[1.1rem] text-gray-500 max-w-2xl mx-auto font-light leading-relaxed mt-4">
                    Ana dili Arapça olan uzman hocalarımızla, ister grup halinde ister birebir özel derslerle dil becerilerinizi hızla geliştirin.
                </p>
            </div>

            <div className="max-w-[1240px] mx-auto px-6 space-y-24">

                {/* Main Models Grid */}
                <section>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Canlı Grup */}
                        <div className="bg-white rounded-2xl border border-brand-primary/5 overflow-hidden group hover:shadow-2xl transition-all duration-500 flex flex-col h-full">
                            <div className="p-1 md:p-2 bg-brand-primary/5 h-[300px] relative overflow-hidden shrink-0">
                                <Image
                                    src="/assets/group-class-mock.png"
                                    alt="Group Class"
                                    fill
                                    className="object-cover group-hover:scale-105 transition-transform duration-700 opacity-90"
                                />
                                <div className="absolute top-6 right-6">
                                    <span className="px-4 py-1.5 bg-brand-accent text-brand-primary text-[10px] font-black rounded-full uppercase tracking-wider shadow-lg">Grup Eğitimi</span>
                                </div>
                            </div>
                            <div className="p-10 flex flex-col flex-grow">
                                <h3 className="text-3xl font-bold text-brand-primary mb-4 flex items-center gap-3">
                                    <i className="fas fa-users-class text-brand-accent"></i>
                                    Canlı Grup Dersleri
                                </h3>
                                <p className="text-gray-500 mb-8 leading-relaxed text-lg">
                                    Seviyenize uygun 12 kişilik interaktif sınıflarda, sosyal bir ortamda Arapça öğrenin. Akranlarınızla pratik yaparak motivasyonunuzu zirvede tutun.
                                </p>
                                <ul className="space-y-4 mb-10">
                                    {[
                                        "Haftalık Düzenli Canlı Oturumlar",
                                        "Görüntülü & Sesli İnteraktif Katılım",
                                        "Ders Kayıtlarına Süresiz Erişim",
                                        "Grup içi Mesajlaşma & Yardımlaşma"
                                    ].map((f, i) => (
                                        <li key={i} className="flex items-center gap-3 text-sm text-gray-700 font-semibold">
                                            <div className="w-6 h-6 rounded-full bg-brand-accent/20 flex items-center justify-center shrink-0">
                                                <i className="fas fa-check text-brand-primary text-[10px]"></i>
                                            </div>
                                            {f}
                                        </li>
                                    ))}
                                </ul>
                                <div className="mt-auto">
                                    <Link href="/kayit" className="block w-full">
                                        <button className="w-full py-4.5 bg-brand-primary text-white font-bold rounded-xl hover:bg-brand-primary-dark transition-all duration-300 shadow-xl shadow-brand-primary/20 text-lg">
                                            Hemen Sınıfa Katıl
                                        </button>
                                    </Link>
                                    <p className="text-center mt-4 text-xs text-gray-400 font-medium italic">Kontenjanlar sınırlıdır.</p>
                                </div>
                            </div>
                        </div>

                        {/* Birebir Özel */}
                        <div className="bg-white rounded-2xl border border-brand-primary/5 overflow-hidden group hover:shadow-2xl transition-all duration-500 flex flex-col h-full">
                            <div className="p-1 md:p-2 bg-brand-accent/5 h-[300px] relative overflow-hidden shrink-0">
                                <Image
                                    src="/assets/private-lesson-mock.png"
                                    alt="Private Lesson"
                                    fill
                                    className="object-cover group-hover:scale-105 transition-transform duration-700 opacity-90"
                                />
                                <div className="absolute top-6 right-6">
                                    <span className="px-4 py-1.5 bg-brand-primary text-white text-[10px] font-black rounded-full uppercase tracking-wider shadow-lg">Kişiye Özel</span>
                                </div>
                            </div>
                            <div className="p-10 flex flex-col flex-grow text-center md:text-left">
                                <h3 className="text-3xl font-bold text-brand-primary mb-4 flex items-center justify-center md:justify-start gap-3">
                                    <i className="fas fa-user-check text-brand-accent"></i>
                                    Birebir Özel Ders
                                </h3>
                                <p className="text-gray-500 mb-8 leading-relaxed text-lg">
                                    Tamamen sizin hızınıza ve hedeflerinize odaklanan %100 kişiselleştirilmiş bir program. Hocanızla birebir çalışarak en hızlı gelişimi kaydedin.
                                </p>
                                <ul className="space-y-4 mb-10 list-none inline-block mx-auto md:mx-0">
                                    {[
                                        "Esnek Gün ve Saat Seçimi",
                                        "İhtiyaca Yönelik Özel Müfredat",
                                        "7/24 Eğitmen Desteği",
                                        "Hızlı Seviye Atlama Garantisi"
                                    ].map((f, i) => (
                                        <li key={i} className="flex items-center gap-3 text-sm text-gray-700 font-semibold text-left">
                                            <div className="w-6 h-6 rounded-full bg-brand-accent/20 flex items-center justify-center shrink-0">
                                                <i className="fas fa-check text-brand-primary text-[10px]"></i>
                                            </div>
                                            {f}
                                        </li>
                                    ))}
                                </ul>
                                <div className="mt-auto">
                                    <Link href="/iletisim" className="block w-full">
                                        <button className="w-full py-4.5 border-2 border-brand-primary text-brand-primary font-bold rounded-xl hover:bg-brand-primary hover:text-white transition-all duration-300 text-lg">
                                            Özel Program İstiyorum
                                        </button>
                                    </Link>
                                    <p className="text-center mt-4 text-xs text-gray-400 font-medium italic">Size özel teklifimizi kaçırmayın.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Teachers Section */}
                <section>
                    <div className="flex flex-col items-center gap-2 mb-12">
                        <span className="text-brand-accent font-black text-[0.7rem] uppercase tracking-widest">KADROMUZ</span>
                        <h2 className="text-3xl font-extrabold text-brand-primary">Uzman Eğitmenlerimiz</h2>
                        <div className="w-12 h-1 bg-brand-accent rounded-full mt-2"></div>
                    </div>

                    {!teachers || teachers.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-brand-primary/5 p-12 text-center shadow-sm">
                            <i className="fas fa-users-cog text-4xl text-gray-200 mb-4 block"></i>
                            <p className="text-gray-400 font-medium">Eğitmen kadromuz güncelleniyor.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                            {(teachers as any[])?.map((t: any) => (
                                <div key={t.id} className="bg-white rounded-2xl border border-brand-primary/5 p-8 hover:shadow-2xl transition-all duration-500 group relative">
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-brand-accent/5 rounded-bl-[100px] pointer-events-none group-hover:w-full group-hover:h-full group-hover:rounded-2xl transition-all duration-500"></div>
                                    <div className="relative z-10">
                                        <div className="flex items-center gap-5 mb-6">
                                            <div className="relative w-20 h-20 shrink-0">
                                                {t.avatar_url ? (
                                                    <Image
                                                        src={t.avatar_url}
                                                        alt={t.full_name}
                                                        fill
                                                        className="rounded-2xl object-cover ring-4 ring-gray-100 group-hover:ring-brand-accent/30 transition-all shadow-md"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full rounded-2xl bg-brand-primary/10 flex items-center justify-center text-brand-primary text-2xl ring-4 ring-gray-100">
                                                        <i className="fas fa-user-tie"></i>
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-black text-gray-900 leading-tight mb-1">{t.full_name}</h3>
                                                <div className="flex items-center gap-2">
                                                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Aktif Eğitmen</p>
                                                </div>
                                            </div>
                                        </div>
                                        <p className="text-gray-500 text-[0.95rem] leading-relaxed line-clamp-4 font-medium italic">
                                            &quot;{t.bio || 'Modern teknikleri geleneksel yöntemlerle harmanlayarak Arapçayı sevdirerek öğretiyorum. Hedefimiz sadece konuşmak değil, dili yaşamak.'}&quot;
                                        </p>
                                        <div className="mt-8 flex items-center justify-between">
                                            <div className="flex gap-1">
                                                {[1, 2, 3, 4, 5].map(i => <i key={i} className="fas fa-star text-brand-accent text-[10px]"></i>)}
                                            </div>
                                            <Link href="/kayit" className="px-5 py-2.5 bg-brand-primary/10 text-brand-primary font-bold rounded-lg text-xs hover:bg-brand-primary hover:text-white transition-all flex items-center gap-2">
                                                Ders Planla <i className="fas fa-calendar-alt"></i>
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* Custom Packages */}
                <section className="pt-12">
                    <div className="bg-brand-primary rounded-[2.5rem] p-12 md:p-20 relative overflow-hidden text-center shadow-2xl">
                        <div className="absolute -top-24 -left-24 w-64 h-64 bg-brand-accent opacity-10 rounded-full blur-3xl"></div>
                        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-brand-accent opacity-10 rounded-full blur-3xl"></div>

                        <div className="relative z-10 max-w-3xl mx-auto">
                            <h2 className="text-3xl md:text-5xl font-black text-white mb-8 leading-tight">Esnek Birebir Ders Paketleri</h2>
                            <p className="text-white/70 text-lg mb-12">
                                İhtiyacınıza göre ders adetini belirleyin, ödemenizi yapın ve anında derslerinizi planlamaya başlayın. Toplu alımlarda özel indirimler sizi bekliyor.
                            </p>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
                                {[
                                    { qty: 4, label: "Ders" },
                                    { qty: 8, label: "Ders" },
                                    { qty: 12, label: "Ders" },
                                    { qty: 24, label: "Ders" },
                                ].map(p => (
                                    <div key={p.qty} className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl border border-white/10 group hover:bg-brand-accent transition-all duration-300">
                                        <div className="text-3xl font-black text-white group-hover:text-brand-primary mb-1">{p.qty}</div>
                                        <div className="text-xs font-bold text-white/50 group-hover:text-brand-primary/70 uppercase tracking-widest">{p.label}</div>
                                    </div>
                                ))}
                            </div>

                            <Link href="/iletisim">
                                <button className="bg-brand-accent text-brand-primary font-black px-12 py-5 rounded-2xl text-[1.1rem] hover:bg-white hover:scale-105 transition-all duration-300 shadow-xl shadow-black/30">
                                    Fiyat Bilgisi Al & Başla
                                </button>
                            </Link>
                        </div>
                    </div>
                </section>

            </div>
        </main>
    );
}
