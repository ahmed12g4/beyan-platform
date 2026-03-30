"use client";

import Image from "next/image";

// Inline SVG icons for each step — educational & on-brand
const STEP_ICONS = [
    // Step 1: Choose Teacher — user/person with star
    (
        <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <circle cx="40" cy="40" r="40" fill="#FEDD59" fillOpacity="0.15" />
            <circle cx="40" cy="30" r="13" fill="#204544" />
            <ellipse cx="40" cy="62" rx="20" ry="12" fill="#204544" />
            {/* Star badge */}
            <circle cx="60" cy="20" r="10" fill="#FEDD59" />
            <text x="60" y="25" textAnchor="middle" fontSize="12" fill="#204544" fontWeight="bold">★</text>
        </svg>
    ),
    // Step 2: Live lesson — play button + Arabic letter
    (
        <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <circle cx="40" cy="40" r="40" fill="#204544" fillOpacity="0.1" />
            {/* Screen */}
            <rect x="10" y="20" width="60" height="38" rx="6" fill="#204544" />
            <rect x="14" y="24" width="52" height="30" rx="4" fill="#f0faf9" />
            {/* Arabic letter ع */}
            <text x="40" y="45" textAnchor="middle" fontSize="20" fill="#204544" fontFamily="serif" fontWeight="bold">ع</text>
            {/* Play button */}
            <circle cx="60" cy="62" r="10" fill="#FEDD59" />
            <polygon points="57,58 57,66 65,62" fill="#204544" />
        </svg>
    ),
    // Step 3: Certificate / progress
    (
        <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <circle cx="40" cy="40" r="40" fill="#FEDD59" fillOpacity="0.12" />
            {/* Certificate */}
            <rect x="12" y="18" width="56" height="42" rx="6" fill="#204544" />
            <rect x="16" y="22" width="48" height="34" rx="4" fill="white" />
            {/* Lines */}
            <rect x="22" y="32" width="36" height="3" rx="1.5" fill="#e0e0e0" />
            <rect x="22" y="39" width="28" height="3" rx="1.5" fill="#e0e0e0" />
            {/* Star seal */}
            <circle cx="40" cy="52" r="8" fill="#FEDD59" />
            <text x="40" y="57" textAnchor="middle" fontSize="10" fill="#204544" fontWeight="bold">★</text>
            {/* Progress arc */}
            <circle cx="62" cy="22" r="9" fill="none" stroke="#FEDD59" strokeWidth="3" strokeDasharray="35 20" />
        </svg>
    ),
];

interface AdminStep {
    title?: string;
    description?: string;
    image?: string;
}

const DEFAULT_STEPS = [
    {
        id: 1,
        title: "Akademik Kadromuzu İnceleyin",
        description: "Dil hedeflerinize ve öğrenme hızınıza en uygun, alanında uzman eğitmeni geniş akademik kadromuz arasından kolayca seçin.",
    },
    {
        id: 2,
        title: "Canlı Derslerle Dile Hakim Olun",
        description: "Modern dijital sınıflarımızda, sadece size özel hazırlanan müfredat ile birebir canlı derslere katılarak dile derinlik kazandırın.",
    },
    {
        id: 3,
        title: "Başarınızı Somutlaştırın",
        description: "Düzenli gelişim raporları ve başarı sertifikaları ile eğitim yolculuğunuzu taçlandırın, akademik hedeflerinize güvenle ulaşın.",
    },
];

interface HowItWorksProps {
    steps?: AdminStep[] | null;
    title?: string;
    subtitle?: string;
}

export default function HowItWorks({
    steps,
    title = "Eğitim süreciniz nasıl ilerler:",
    subtitle,
}: HowItWorksProps) {
    const mergedSteps = DEFAULT_STEPS.map((def, i) => ({
        ...def,
        title: steps?.[i]?.title || def.title,
        description: steps?.[i]?.description || def.description,
        image: steps?.[i]?.image || null,
    }));

    return (
        <section className="bg-white py-[80px] md:py-[100px] overflow-hidden border-t border-gray-100 font-sans">
            <div className="max-w-[1200px] mx-auto px-5">

                {/* Header Section - Academic & Bold */}
                <div className="mb-[50px] text-center">
                    <h2 className="text-[2.2rem] sm:text-[2.5rem] md:text-[2.8rem] tracking-tight font-bold text-brand-primary leading-tight">
                        {title}
                    </h2>
                </div>

                {/* Steps Grid - Professional institutional look */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-[40px]">
                    {mergedSteps.map((step, index) => (
                        <div key={step.id} className="flex flex-col text-center items-center group border border-gray-100 rounded-lg p-[30px_20px] sm:p-[35px_25px] md:p-[45px_30px] shadow-[0_10px_40px_rgba(0,0,0,0.04)] hover:border-brand-primary/20 hover:-translate-y-[8px] transition-all duration-300">

                            {/* Step Badge - Primary Brand Color */}
                            <div className="w-[60px] h-[60px] bg-brand-primary text-white flex items-center justify-center font-bold text-xl rounded-lg mb-[25px] shadow-lg shadow-[#204544]/20 scale-100 group-hover:scale-110 transition-transform">
                                {step.id}
                            </div>

                            {/* Text Content */}
                            <h3 className="text-[1.3rem] md:text-[1.4rem] font-bold text-[#111827] mb-4 leading-[1.3]">
                                {step.title}
                            </h3>

                            <p className="text-[1.05rem] md:text-[1.1rem] text-[#555] leading-[1.6] font-medium opacity-90">
                                {step.description}
                            </p>

                            {/* Visual Asset - Clean & Minimal */}
                            <div className="mt-8 aspect-[4/3] w-full bg-gray-50 rounded-lg overflow-hidden relative flex items-center justify-center border border-black/[0.12] pb-2">
                                {step.image ? (
                                    <Image
                                        src={step.image}
                                        alt={step.title}
                                        fill
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="w-24 h-24 opacity-[0.08] grayscale">
                                        {STEP_ICONS[index]}
                                    </div>
                                )}
                                {/* Subtle overlay glow */}
                                <div className="absolute inset-0 bg-gradient-to-tr from-brand-primary/5 to-transparent pointer-events-none"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
