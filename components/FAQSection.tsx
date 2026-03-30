"use client";

import { useState } from "react";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { useSettings } from "@/app/contexts/SettingsContext";


interface FAQItem {
    category: string;
    question: string;
    answer: string;
}

const faqs: FAQItem[] = [
    {
        category: "Çevrim içi Konuşma Grupları",
        question: "Açık sınıf ve kapalı sınıf nedir?",
        answer: "Açık sınıflarda farklı üyelerle dilediğiniz zaman konuşma pratiği yapabilirsiniz. Kapalı sınıflarda ise sabit bir katılımcı grubuyla planlı dersler ilerler, daha sistemli ve düzenli bir eğitim alırsınız."
    },
    {
        category: "Çevrim içi Konuşma Grupları",
        question: "Ücretsiz deneme dersi var mı?",
        answer: "Evet, platformumuzu yakından tanımanız ve eğitim sistemimizi deneyimlemeniz için ilk dersinizi ücretsiz olarak sunuyoruz."
    },
    {
        category: "Eğitim & Müfredat",
        question: "Dersleri kaçırırsam tekrar izleyebilir miyim?",
        answer: "Kesinlikle. Tüm derslerimiz kaydedilir ve öğrenci paneline yüklenir. Kaçırdığınız konuları dilediğiniz zaman tekrar edebilirsiniz."
    },
    {
        category: "Teknik",
        question: "Mobil cihazlardan erişim mümkün mü?",
        answer: "Evet! Beyan Dil Akademi platformu tüm cihazlarla tam uyumludur. Cep telefonunuzdan, tabletinizden veya bilgisayarınızdan nerede olursanız olun derslerinize kesintisiz katılabilirsiniz."
    },
    {
        category: "Hesap",
        question: "Hesabımı nasıl silebilirim?",
        answer: "Hesap ayarlarınız üzerinden doğrudan silebilir veya işlem için destek ekibimizle iletişime geçebilirsiniz. Tüm verileriniz güvenli bir şekilde kalıcı olarak kaldırılır."
    }
];

export default function FAQSection() {
    const { settings } = useSettings();
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    const [activeCategory, setActiveCategory] = useState<string>("Tümü");

    const categories = ["Tümü", ...Array.from(new Set(faqs.map(faq => faq.category)))];

    const filteredFaqs = activeCategory === "Tümü"
        ? faqs
        : faqs.filter(faq => faq.category === activeCategory);

    const toggleFAQ = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <section className="bg-[#F8F9FA] py-[80px] md:py-[100px] border-t border-[#f0f0f0]">
            <div className="max-w-[1000px] mx-auto px-5">
                {/* Header */}
                <div className="text-center mb-[50px]">
                    <h2 className="text-[2.2rem] sm:text-[2.5rem] md:text-[2.8rem] text-brand-primary mb-[15px] leading-tight">
                        Sıkça Sorulan Sorular
                    </h2>

                    <p className="text-[#555] text-[1.1rem] max-w-[600px] mx-auto leading-relaxed">
                        Merak ettiğiniz soruların cevaplarını burada bulabilirsiniz. Başka bir sorunuz varsa bizimle iletişime geçmekten çekinmeyin.
                    </p>
                </div>

                {/* Category Tabs */}
                <div className="flex flex-wrap justify-center gap-3 mb-[40px]">
                    {categories.map((category, idx) => (
                        <button
                            key={idx}
                            onClick={() => {
                                setActiveCategory(category);
                                setOpenIndex(null); // Reset open FAQ when changing category
                            }}
                            className={`px-[20px] py-[8px] rounded-lg text-[0.95rem] font-medium transition-all duration-300 shadow-sm ${activeCategory === category
                                ? "bg-brand-primary text-white shadow-md scale-105"
                                : "bg-white text-[#555] border border-gray-200 hover:border-brand-accent hover:bg-brand-accent/10 hover:text-brand-primary"
                                }`}
                        >
                            {category}
                        </button>
                    ))}
                </div>

                {/* FAQ Accordion */}
                <div className="space-y-[15px]">
                    {filteredFaqs.map((faq, idx) => {
                        const isOpen = openIndex === idx;
                        return (
                            <div
                                key={idx}
                                className={`border rounded-lg overflow-hidden transition-all duration-500 ${isOpen
                                    ? "border-brand-primary/30 shadow-lg bg-white"
                                    : "border-gray-200 bg-white hover:border-brand-accent hover:shadow-md"
                                    }`}
                            >
                                <button
                                    onClick={() => toggleFAQ(idx)}
                                    className="w-full flex items-center justify-between p-[20px] md:p-[25px] text-left focus:outline-none group"
                                >
                                    <h3 className={`text-[1.1rem] md:text-[1.15rem] font-medium pr-4 transition-colors duration-300 ${isOpen ? "text-brand-primary" : "text-[#333] group-hover:text-brand-primary"
                                        }`}>
                                        {faq.question}
                                    </h3>
                                    <div className={`flex-shrink-0 w-[40px] h-[40px] rounded-full flex items-center justify-center transition-all duration-500 ${isOpen ? "bg-brand-accent rotate-180" : "bg-[#F8F9FA] group-hover:bg-brand-accent/20"
                                        }`}>
                                        <ChevronDownIcon className={`w-5 h-5 transition-colors duration-300 ${isOpen ? "text-brand-primary" : "text-[#555] group-hover:text-brand-primary"
                                            }`} />
                                    </div>
                                </button>

                                <div
                                    className={`transition-all duration-500 ease-in-out ${isOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
                                        }`}
                                >
                                    <div className="p-[20px] md:p-[25px] pt-0 text-[#555] leading-relaxed text-[1.05rem] md:text-[1.1rem] font-light">
                                        {faq.answer}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Contact CTA */}
                <div className="mt-[60px] text-center p-[40px] rounded-lg bg-gradient-to-br from-brand-primary to-[#163332] text-white relative overflow-hidden group shadow-xl">
                    <div
                        className="absolute inset-0 opacity-10 bg-cover bg-center mix-blend-overlay group-hover:scale-105 transition-transform duration-1000"
                        style={{ backgroundImage: `url('${settings?.hero_image_url || '/assets/hero_bg.png'}')` }}
                    ></div>
                    <div className="relative z-10 flex flex-col items-center">

                        <h4 className="text-[1.6rem] md:text-[2rem] mb-[15px]">Aradığınızı bulamadınız mı?</h4>

                        <p className="text-white/80 mb-[30px] text-[1.05rem] max-w-[500px]">
                            Eğitim danışmanlarımız aklınıza takılan tüm soruları yanıtlamak için burada. Size en uygun çözümü bulalım.
                        </p>
                        <a href="/iletisim" className="inline-flex items-center gap-2 bg-brand-accent text-brand-primary font-semibold px-[35px] py-[14px] rounded-lg hover:bg-[#ffe680] hover:scale-105 transition-all duration-300 shadow-[0_10px_25px_rgba(254,221,89,0.3)]">
                            <span>Bize Ulaşın</span>
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                        </a>
                    </div>
                </div>
            </div>
        </section>
    );
}
