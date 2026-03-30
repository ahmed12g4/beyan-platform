import Link from "next/link";
import Image from "next/image";
const levels = [
    {
        id: "a1",
        title: "A1 - Başlangıç Seviyesi",
        description: "Temel selamlaşmalar, basit cümleler ve günlük hayatta ihtiyaç duyulan temel Arapça bilgisi.",
        image: "/assets/levels/a1.png",
        color: "bg-[#1d4ed8]" // strong blue
    },
    {
        id: "a2",
        title: "A2 - Temel Seviye",
        description: "Kendinizi ifade etme, alışveriş, iş ve sosyal çevre ile ilgili temel iletişim becerileri.",
        image: "/assets/levels/a2.png",
        color: "bg-[#16a34a]" // strong green
    },
    {
        id: "b1",
        title: "B1 - Orta Seviye Öncesi",
        description: "Standart dildeki ana noktaları anlama ve ilginizi çeken konularda kendinizi ifade etme.",
        image: "/assets/levels/b1.png",
        color: "bg-[#d97706]" // deep yellow/amber
    },
    {
        id: "b2",
        title: "B2 - Orta Seviye",
        description: "Karmaşık metinleri anlama, akıcı bir şekilde iletişim kurma ve teknik tartışmalara katılma.",
        image: "/assets/levels/b2.png",
        color: "bg-[#ea580c]" // orange
    },
    {
        id: "c1",
        title: "C1 - İleri Seviye",
        description: "Geniş bir konu yelpazesinde karmaşık metinleri anlama ve profesyonel düzeyde iletişim.",
        image: "/assets/levels/c1.png",
        color: "bg-[#dc2626]" // red
    },
    {
        id: "c2",
        title: "C2 - Uzmanlık Seviyesi",
        description: "Akademik ve profesyonel her türlü metni ve tartışmayı ana dil düzeyinde anlama ve yorumlama.",
        image: "/assets/levels/c2.png",
        color: "bg-[#9333ea]" // purple
    }
];

export default function SeviyelerPage() {
    return (
        <main className="bg-[#F8F9FA] min-h-screen pt-[120px] pb-24 text-brand-primary">
            {/* Header Section (Clean Platform Style) */}
            <div className="text-center mb-16 px-6 animate-slideUp">
                <span className="text-brand-accent text-[0.7rem] font-bold tracking-[0.2em] uppercase mb-4 block">
                    SEVİYELER
                </span>
                <h1 className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight text-[#1e3a38]">
                    Arapça Eğitim Seviyeleri<span className="text-brand-accent">.</span>
                </h1>
                <p className="text-[1.05rem] text-gray-500 max-w-2xl mx-auto font-light leading-relaxed mt-4">
                    Sıfırdan uzmanlığa kadar her seviye için özel olarak hazırlanmış müfredatımızla Arapçayı doğru bir şekilde öğrenin.
                </p>
            </div>

            {/* Levels Grid */}
            <section className="max-w-[1200px] mx-auto py-16 px-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {levels.map((level) => (
                        <div key={level.id} className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col items-start border border-black/[0.12]">
                            {/* Top Colorful Bar */}
                            <div className={`h-3 w-full bg-gradient-to-r ${level.color}`}></div>

                            <div className="p-8 w-full flex-1 flex flex-col">
                                <span className="text-gray-400 font-bold text-xs uppercase tracking-[0.15em] mb-2">{level.id} LEVEL</span>
                                <h3 className="text-[1.35rem] font-bold text-[#1e3a38] mb-4">{level.title}</h3>
                                <p className="text-gray-500 text-[0.95rem] leading-[1.6] mb-8 flex-1">
                                    {level.description}
                                </p>

                                <Link
                                    href={`/seviyeler/${level.id}`}
                                    className="inline-flex items-center text-[#1e3a38] font-bold hover:text-brand-accent transition-colors gap-2 text-[0.95rem] mt-auto"
                                >
                                    Detayları Görüntüle <i className="fas fa-arrow-right text-sm"></i>
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Test CTA */}
            <section className="bg-[#F8F9FA] py-20 px-6 border-t border-gray-100">
                <div className="max-w-[900px] mx-auto bg-brand-primary rounded-xl p-10 md:p-16 text-center text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-brand-accent opacity-10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                    <h2 className="text-3xl md:text-4xl font-bold mb-6 relative z-10 text-white">Seviyenizi Bilmiyor musunuz?</h2>
                    <p className="text-lg opacity-90 mb-10 relative z-10 max-w-xl mx-auto">
                        Ücretsiz seviye tespit sınavımıza katılarak sizin için en uygun sınıfa yerleşmenize yardımcı olalım.
                    </p>
                    <Link href="/seviye-testi">
                        <button className="bg-brand-accent text-brand-primary font-bold px-10 py-4 rounded-xl shadow-lg hover:bg-[#ffe680] hover:scale-105 transition-all duration-300 relative z-10">
                            Hemen Teste Başla
                        </button>
                    </Link>
                </div>
            </section>
        </main>
    );
}
