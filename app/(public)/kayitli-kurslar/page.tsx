import Link from "next/link";
import Image from "next/image";

export default function KayitliKurslarPage() {
    return (
        <main className="bg-[#F8F9FA] min-h-screen pt-[120px] pb-24 text-brand-primary">
            {/* Header Section */}
            <div className="text-center mb-20 px-6 animate-slideUp">
                <span className="text-brand-accent text-[0.75rem] font-black tracking-[0.3em] uppercase mb-4 block leading-none">
                    DİJİTAL KÜTÜPHANE
                </span>
                <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tight text-brand-primary">
                    Kayıtlı Video Kurslar<span className="text-brand-accent">.</span>
                </h1>
                <p className="text-[1.15rem] text-gray-400 max-w-2xl mx-auto font-medium leading-relaxed mt-6">
                    Zaman ve mekan sınırı olmadan, binlerce dakikalık yüksek kaliteli video içeriğine 7/24 erişin. Kendi hızınızda uzmanlaşın.
                </p>
            </div>

            <div className="max-w-[1240px] mx-auto px-6">

                {/* Main Hero Card */}
                <section className="mb-24">
                    <div className="bg-brand-primary rounded-[3rem] overflow-hidden relative group shadow-2xl">
                        <div className="absolute top-0 right-0 w-1/2 h-full bg-brand-accent/5 skew-x-12 translate-x-24 -z-10 bg-gradient-to-l from-brand-accent/10 to-transparent"></div>
                        <div className="p-10 md:p-20 flex flex-col lg:flex-row items-center gap-16 relative z-10">
                            <div className="flex-1 text-center lg:text-left flex flex-col items-center lg:items-start">
                                <div className="inline-block px-5 py-2.5 bg-brand-accent text-brand-primary text-[10px] font-black rounded-full mb-8 uppercase tracking-widest leading-none shadow-lg shadow-black/20">Sınırsız Öğrenme</div>
                                <h3 className="text-4xl md:text-5xl font-black text-white mb-8 leading-tight">Video Eğitim <br className="hidden md:block" /> Modülleri Dünyası</h3>
                                <p className="text-white/60 text-lg mb-12 max-w-xl text-center lg:text-left leading-relaxed">
                                    Başlangıçtan ileri seviyeye kadar tüm konuları kapsayan, profesyonelce çekilmiş binlerce ders videosu. Takıldığınız her an geri sarın, tekrar izleyin ve pekiştirin.
                                </p>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-14 list-none w-full">
                                    {[
                                        { i: "fas fa-infinity", t: "Ömür Boyu Erişim", d: "Kursu bir kez alın, sınırsız erişin." },
                                        { i: "fas fa-sync", t: "Sürekli Güncel İçerik", d: "Yeni dersler periyodik olarak eklenir." },
                                        { i: "fas fa-tasks", t: "Bölüm Sonu Testleri", d: "Her video sonu bilginizi ölçün." },
                                        { i: "fas fa-certificate", t: "Sertifika İmkanı", d: "Eğitimi tamamlayın, belgenizi alın." }
                                    ].map((item, i) => (
                                        <li key={i} className="flex gap-4 text-white/90">
                                            <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center shrink-0 text-brand-accent text-xl transition-all group-hover:bg-brand-accent group-hover:text-brand-primary">
                                                <i className={item.i}></i>
                                            </div>
                                            <div className="text-left">
                                                <div className="font-black text-[15px] mb-1">{item.t}</div>
                                                <div className="text-[11px] text-white/40 leading-tight font-medium uppercase tracking-wide">{item.d}</div>
                                            </div>
                                        </li>
                                    ))}
                                </div>

                                <Link href="/kayit" className="w-full sm:w-auto">
                                    <button className="w-full sm:px-14 py-5 bg-brand-accent text-brand-primary font-black rounded-2xl hover:bg-white hover:scale-105 transition-all duration-300 shadow-2xl shadow-black/30 text-xl">
                                        Kütüphaneyi Keşfet
                                    </button>
                                </Link>
                            </div>

                            <div className="flex-none w-full max-w-[450px] lg:max-w-[500px]">
                                <div className="relative aspect-video rounded-3xl overflow-hidden border-[12px] border-white/5 shadow-[0_50px_100px_rgba(0,0,0,0.5)] group-hover:scale-105 transition-transform duration-1000">
                                    <Image
                                        src="/assets/video-player-mock.png"
                                        alt="Video Eğitim"
                                        fill
                                        className="object-cover opacity-90 transition-opacity duration-700 group-hover:opacity-100"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/10 transition-colors">
                                        <div className="w-24 h-24 bg-white/20 backdrop-blur-xl rounded-full flex items-center justify-center text-white text-4xl shadow-2xl ring-2 ring-white/30 transform group-hover:scale-110 transition-transform duration-700">
                                            <i className="fas fa-play ml-1.5 drop-shadow-lg"></i>
                                        </div>
                                    </div>
                                    <div className="absolute bottom-6 left-6 right-6 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                        <div className="h-full w-2/3 bg-brand-accent rounded-full animate-pulse"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Categories / Levels Grid */}
                <section>
                    <div className="flex flex-col items-center gap-1.5 mb-14 text-center">
                        <span className="text-brand-accent font-black text-[0.7rem] uppercase tracking-[0.4em] mb-2 leading-none">MÜFREDAT</span>
                        <h2 className="text-4xl font-black text-brand-primary">Kategorilere Göre Keşfedin</h2>
                        <div className="w-16 h-1.5 bg-brand-accent rounded-full mt-4"></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
                        {[
                            { id: "a1", name: "A1 - Başlangıç", desc: "Arapça temeli ve günlük basit iletişim.", color: "blue" },
                            { id: "a2", name: "A2 - Temel", desc: "Kendini ifade etme و sosyal iletişim.", color: "green" },
                            { id: "b1", name: "B1 - Orta Öncesi", desc: "Standart dilde akıcı anlama.", color: "amber" },
                            { id: "b2", name: "B2 - Orta", desc: "Karmaşık metinler و akıcı konuşma.", color: "orange" },
                            { id: "c1", name: "C1 - İleri", desc: "Geniش akademik و profesyonel dil.", color: "red" },
                            { id: "all", name: "Tüm Seviyeler Paketi", desc: "Sıfırdan uzmanlığa tam yolculuk.", color: "purple" }
                        ].map((level, i) => (
                            <Link key={level.id} href={`/kayitli-kurslar/${level.id}`} className="block group">
                                <div className="bg-white rounded-3xl p-10 border border-brand-primary/5 hover:border-brand-accent/30 transition-all duration-500 shadow-sm hover:shadow-2xl hover:-translate-y-2 relative overflow-hidden h-full flex flex-col">
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-brand-primary/5 rounded-bl-[80px] group-hover:w-full group-hover:h-full group-hover:rounded-3xl transition-all duration-700 pointer-events-none"></div>
                                    <div className="relative z-10 flex flex-col h-full">
                                        <div className="w-16 h-16 bg-brand-primary/5 rounded-2xl flex items-center justify-center text-2xl font-black text-brand-primary mb-8 group-hover:bg-brand-accent transition-colors">
                                            {level.id.toUpperCase()}
                                        </div>
                                        <h3 className="text-2xl font-black text-brand-primary mb-4 leading-tight">{level.name}</h3>
                                        <p className="text-gray-500 font-medium leading-relaxed mb-10 flex-grow">{level.desc}</p>
                                        <div className="flex items-center justify-between mt-auto">
                                            <span className="text-sm font-black text-brand-primary uppercase tracking-widest group-hover:text-brand-accent transition-colors">İzle <i className="fas fa-play ml-2 text-xs"></i></span>
                                            <div className="flex -space-x-3 opacity-50 group-hover:opacity-100 transition-opacity">
                                                <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-200"></div>
                                                <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-300"></div>
                                                <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-400"></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>

                    {/* Final Note Card */}
                    <div className="bg-white rounded-[2.5rem] border border-brand-primary/10 p-12 md:p-16 text-center shadow-xl mb-12">
                        <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center text-4xl text-gray-200 mb-8 mx-auto ring-8 ring-gray-100 ring-offset-4">
                            <i className="fas fa-magic"></i>
                        </div>
                        <h3 className="text-3xl font-black text-brand-primary mb-6">Kurumsal Arapça Çözümleri</h3>
                        <p className="text-gray-400 max-w-2xl mx-auto mb-12 text-lg font-medium leading-relaxed">
                            Şirketiniz veya kurumunuz için sektörel terminoloji odaklı özel video eğitim programları. Ekibinizin dil becerilerini profesyonel düzeye taşıyoruz.
                        </p>
                        <Link href="/iletisim" className="text-brand-primary font-black hover:text-brand-accent transition-colors text-xl flex items-center justify-center gap-4">
                            Hemen İletişime Geçin <i className="fas fa-arrow-right"></i>
                        </Link>
                    </div>
                </section>

            </div>
        </main>
    );
}
