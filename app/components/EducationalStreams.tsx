"use client";

import Link from "next/link";

export default function EducationalStreams() {
    const streams = [
        {
            title: "Kurslar (Kayitli)",
            desc: "Kendi hızınızda öğrenin. Yüzlerce video ders ve interaktif içerikle Arapçanızı geliştirin.",
            link: "/courses",
            icon: "fa-play-circle",
            color: "from-blue-500 to-indigo-600",
            btnText: "Kursları İncele"
        },
        {
            title: "Özel Dersler",
            desc: "Uzman eğitmenlerle 1-on-1 birebir görüşmeler. Size özel müfredat ve esnek saatler.",
            link: "/private-lessons",
            icon: "fa-user-tie",
            color: "from-amber-400 to-orange-500",
            btnText: "Eğitmen Bul"
        },
        {
            title: "Grup Dersleri",
            desc: "Canlı ve interaktif gruplar. Akranlarınızla birlikte öğrenin ve pratik yapın.",
            link: "/groups",
            icon: "fa-users",
            color: "from-emerald-400 to-teal-600",
            btnText: "Gruplara Katıl"
        }
    ];

    return (
        <section className="py-20 bg-white relative overflow-hidden">
            <div className="max-w-[1200px] mx-auto px-6 relative z-10">
                <div className="text-center mb-16">
                    <h2 className="text-[2.2rem] md:text-[2.8rem] font-bold text-brand-primary mb-4 tracking-tight">Eğitim Yolculuğunuzu Seçin</h2>
                    <p className="text-gray-500 max-w-2xl mx-auto text-lg">Platformumuzda size en uygun öğrenme yöntemini keşfedin. Üç ana dalda profesyonel eğitim sunuyoruz.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {streams.map((stream, idx) => (
                        <div key={idx} className="group relative bg-white p-8 rounded-[32px] shadow-xl shadow-gray-200/50 border border-gray-100 hover:border-brand-primary/20 transition-all duration-500 hover:-translate-y-2 overflow-hidden">
                            {/* Accent Background Gradient */}
                            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${stream.color} opacity-5 rounded-bl-[100px] -z-0 group-hover:opacity-10 transition-opacity`}></div>

                            {/* Icon */}
                            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${stream.color} flex items-center justify-center text-white text-2xl mb-8 shadow-lg shadow-gray-200 transform group-hover:scale-110 transition-transform duration-500`}>
                                <i className={`fas ${stream.icon}`}></i>
                            </div>

                            {/* Content */}
                            <h3 className="text-2xl font-bold text-gray-900 mb-4 tracking-tight">{stream.title}</h3>
                            <p className="text-gray-500 leading-relaxed mb-8">{stream.desc}</p>

                            {/* CTA */}
                            <Link href={stream.link}>
                                <button className={`w-full py-4 rounded-xl font-bold tracking-wide transition-all duration-300 flex items-center justify-center gap-2 ${idx === 1 ? 'bg-brand-accent text-brand-primary hover:bg-[#ffe680]' : 'bg-brand-primary text-white hover:bg-brand-primary-hover shadow-lg shadow-brand-primary/10'}`}>
                                    {stream.btnText} <i className="fas fa-chevron-right text-xs"></i>
                                </button>
                            </Link>
                        </div>
                    ))}
                </div>
            </div>

            {/* Background elements */}
            <div className="absolute -top-24 -left-24 w-64 h-64 bg-brand-primary/5 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-brand-accent/5 rounded-full blur-3xl"></div>
        </section>
    );
}
