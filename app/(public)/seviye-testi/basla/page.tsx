"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Question {
    id: number;
    level: string;
    question: string;
    options: string[];
    answer: number; // Index of the correct option
}

// 20 High-Quality carefully chosen Arabic placement test questions
const questions: Question[] = [
    {
        id: 1,
        level: "A1",
        question: "أنا من دمشق، و _____ من القاهرة.",
        options: ["أنتَ", "هم", "نحن", "هو"],
        answer: 0
    },
    {
        id: 2,
        level: "A1",
        question: "_____ تدرس اللغة العربية؟ - لأنني أحبها.",
        options: ["أين", "كيف", "لماذا", "متى"],
        answer: 2
    },
    {
        id: 3,
        level: "A1",
        question: "هذا قلمي، وهذه _____ .",
        options: ["كتابي", "دفتري", "حقيبي", "سيارتي"],
        answer: 3
    },
    {
        id: 4,
        level: "A1",
        question: "كم أخاً _____ ؟ - لي ثلاثة إخوة.",
        options: ["بك", "لك", "منك", "عنك"],
        answer: 1
    },
    {
        id: 5,
        level: "A2",
        question: "في العطلة الماضية، _____ إلى مدينة المنامة.",
        options: ["أسافر", "سأسافر", "سافرتُ", "سافر"],
        answer: 2
    },
    {
        id: 6,
        level: "A2",
        question: "أرجو منك أن _____ مبكراً غداً.",
        options: ["تستيقظُ", "تستيقظَ", "تستيقظْ", "استيقظ"],
        answer: 1
    },
    {
        id: 7,
        level: "A2",
        question: "لم _____ صديقي منذ أسبوعين بسبب سفره.",
        options: ["أقابلْ", "أقابلُ", "أقابلَ", "قابلتُ"],
        answer: 0
    },
    {
        id: 8,
        level: "B1",
        question: "إنّ _____ مخلصون في عملهم.",
        options: ["المعلمون", "المعلمين", "المعلمان", "المعلمات"],
        answer: 1
    },
    {
        id: 9,
        level: "B1",
        question: "الطالبان _____ الدرس بجدٍ واهتمام.",
        options: ["كتبوا", "كتبا", "كتبن", "كتبت"],
        answer: 1
    },
    {
        id: 10,
        level: "B1",
        question: "كانت الرحلة متعبة، _____ استمتعنا بالمناظر الجميلة.",
        options: ["لذلك", "لكننا", "بسبب", "حتى"],
        answer: 1
    },
    {
        id: 11,
        level: "B1",
        question: "يجب على المتدربين الانتباه لتعليمات المدرب _____ يقعوا في الأخطاء.",
        options: ["كي لا", "من أجل", "حتى", "بسبب"],
        answer: 0
    },
    {
        id: 12,
        level: "B2",
        question: "لا _____ وقتك فيما لا ينفعك.",
        options: ["تضيّعُ", "تضيّعَ", "تضيّعْ", "مضيّع"],
        answer: 2
    },
    {
        id: 13,
        level: "B2",
        question: "عاد العمال من المصنع _____ .",
        options: ["متعبون", "متعبين", "متعبان", "متعبٌ"],
        answer: 1
    },
    {
        id: 14,
        level: "B2",
        question: "تُعدّ السياحة من أهم مصادر الدخل القومي، فبها _____ الاقتصاد.",
        options: ["ينهار", "يتدهور", "ينتعش", "يتراجع"],
        answer: 2
    },
    {
        id: 15,
        level: "B2",
        question: "ما أجملَ _____ الطيور في الصباح الباكر!",
        options: ["تغريدُ", "تغريدَ", "تغريدِ", "تغريدٍ"],
        answer: 1
    },
    {
        id: 16,
        level: "C1",
        question: "لولا _____ لغرق الطفل في النهر.",
        options: ["المنقذُ", "المنقذَ", "المنقذِ", "المنقذا"],
        answer: 0
    },
    {
        id: 17,
        level: "C1",
        question: "تفشى الوباء بين الناس حتى استحال _____ .",
        options: ["نشره", "تداركه", "إخفاؤه", "تجاهله"],
        answer: 1
    },
    {
        id: 18,
        level: "C1",
        question: "حضر المدعوون جميعاً ما عدا _____ .",
        options: ["خالدٌ", "خالداً", "خالدٍ", "خالدان"],
        answer: 1
    },
    {
        id: 19,
        level: "C1",
        question: "\"وكم من عائبٍ قولاً صحيحاً... وآفته من الفهم السقيمِ\". ما المعنى المقصود بكلمة \"آفته\"؟",
        options: ["دواؤه", "سببه الحقيقي / علته", "نتيجته", "علاجه"],
        answer: 1
    },
    {
        id: 20,
        level: "C1",
        question: "إياك و_____ ، فإنه يُفسد العلاقات ويُوغل الصدور.",
        options: ["التسامح", "الكذب", "الصدق", "التعاون"],
        answer: 1
    }
];

export default function LevelTestClient() {
    const [started, setStarted] = useState(false);
    const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
    const [answers, setAnswers] = useState<Record<number, number>>({});
    const [finished, setFinished] = useState(false);
    const [score, setScore] = useState(0);

    const handleStart = () => {
        setStarted(true);
    };

    const handleAnswer = (questionId: number, optionIdx: number) => {
        const newAnswers = { ...answers, [questionId]: optionIdx };
        setAnswers(newAnswers);

        // Auto move to next after a small delay
        setTimeout(() => {
            if (currentQuestionIdx < questions.length - 1) {
                setCurrentQuestionIdx(curr => curr + 1);
            } else {
                finishTest(newAnswers);
            }
        }, 400);
    };

    const finishTest = (finalAnswers: Record<number, number>) => {
        // Calculate score
        let totalScore = 0;
        questions.forEach(q => {
            if (finalAnswers[q.id] === q.answer) {
                totalScore++;
            }
        });
        setScore(totalScore);
        setFinished(true);
    };

    const getRecommendedLevel = (s: number) => {
        if (s <= 4) return { code: "A1", name: "Başlangıç Seviyesi", desc: "Arapça temellerini atmanız için harika bir fırsat! A1 seviyesinden başlayarak sağlam bir temel kurabilirsiniz." };
        if (s <= 8) return { code: "A2", name: "Temel Seviye", desc: "Temel bilgilere sahipsiniz ancak pratik ve gramer eksikleriniz var. A2 seviyesinden devam etmeniz uygun olacaktır." };
        if (s <= 13) return { code: "B1", name: "Orta Seviye", desc: "Günlük hayatta rahatça iletişim kurabiliyor, temel gramer kurallarına hakimsiniz. B1 sınıflarımızda akıcılığınızı artırabilirsiniz." };
        if (s <= 17) return { code: "B2", name: "İyi Seviye", desc: "Arapça seviyeniz oldukça iyi! Karmaşık metinleri anlayabilir ve kendinizi rahat ifade edebilirsiniz. B2 ile detaylara iniyoruz." };
        return { code: "C1", name: "İleri Seviye", desc: "Mükemmel! Arapçaya ana diliniz gibi hakimsiniz. Akademik metinler ve ileri düzey tartışmalar için C1 seviyesine hazırsınız." };
    };

    const nextQuestion = () => {
        if (currentQuestionIdx < questions.length - 1) {
            setCurrentQuestionIdx(curr => curr + 1);
        }
    };

    const prevQuestion = () => {
        if (currentQuestionIdx > 0) {
            setCurrentQuestionIdx(curr => curr - 1);
        }
    };

    if (!started) {
        return (
            <main className="bg-[#F8F9FA] min-h-screen pt-[85px] pb-20 flex items-center justify-center px-4">
                <div className="max-w-[700px] w-full bg-white p-8 md:p-12 rounded-lg shadow-xl text-center animate-slideUp border border-gray-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-brand-accent/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

                    <div className="w-20 h-20 bg-brand-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-8 relative z-10">
                        <i className="fas fa-clipboard-list text-4xl text-brand-primary"></i>
                    </div>

                    <h1 className="text-3xl md:text-4xl font-bold text-brand-primary mb-6 relative z-10">
                        Arapça Seviye Tespit Sınavı
                    </h1>

                    <p className="text-gray-600 mb-8 leading-relaxed text-lg relative z-10">
                        Test 20 çoktan seçmeli sorudan oluşmaktadır. Okuduğunu anlama, kelime bilgisi ve gramer bilginizi ölçecektir. Lütfen yardım almadan cevaplayınız.
                    </p>

                    <button
                        onClick={handleStart}
                        className="bg-brand-primary text-white font-bold px-12 py-5 rounded-xl shadow-lg hover:bg-brand-primary-dark hover:-translate-y-1 transition-all duration-300 relative z-10 text-lg w-full md:w-auto"
                    >
                        Sınava Başla
                    </button>

                    <div className="mt-8 text-sm text-gray-400 font-medium">
                        Tahmini Süre: 10-15 Dakika
                    </div>
                </div>
            </main>
        );
    }

    if (finished) {
        const result = getRecommendedLevel(score);
        return (
            <main className="bg-[#F8F9FA] min-h-screen pt-[85px] pb-20 flex items-center justify-center px-4">
                <div className="max-w-[800px] w-full bg-white p-8 md:p-16 rounded-lg shadow-2xl text-center animate-slideUp border-t-[8px] border-brand-accent relative overflow-hidden">
                    <h2 className="text-2xl font-bold text-gray-500 mb-2 uppercase tracking-widest text-sm">Test Sonucu</h2>

                    <div className="text-[6rem] font-black text-brand-primary leading-none mb-4 animate-scaleIn">
                        {result.code}
                    </div>
                    <div className="inline-block bg-brand-accent/20 text-brand-primary font-bold px-6 py-2 rounded-full mb-8 text-lg">
                        {result.name}
                    </div>

                    <p className="text-xl text-gray-700 mb-10 leading-relaxed max-w-xl mx-auto">
                        {result.desc}
                    </p>

                    <div className="bg-[#F8F9FA] p-6 rounded-2xl mb-12 border border-gray-100 flex flex-col md:flex-row items-center justify-around gap-6">
                        <div className="text-center">
                            <div className="text-4xl font-black text-brand-primary">{score}<span className="text-xl text-gray-400 font-medium">/20</span></div>
                            <div className="text-sm font-bold text-gray-500 uppercase tracking-widest mt-1">Doğru Cevap</div>
                        </div>
                        <div className="h-12 w-px bg-gray-200 hidden md:block"></div>
                        <div className="text-center">
                            <div className="text-4xl font-black text-gray-400">{20 - score}</div>
                            <div className="text-sm font-bold text-gray-500 uppercase tracking-widest mt-1">Yanlış / Boş</div>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link href="/kayit" className="w-full sm:w-auto">
                            <button className="w-full bg-brand-accent text-brand-primary font-bold px-10 py-4 rounded-xl shadow-lg hover:bg-[#ffe680] hover:-translate-y-1 transition-all duration-300">
                                {result.code} Seviyesinden Kayıt Ol
                            </button>
                        </Link>
                        <Link href="/iletisim" className="w-full sm:w-auto">
                            <button className="w-full border-2 border-brand-primary text-brand-primary font-bold px-10 py-4 rounded-xl hover:bg-brand-primary hover:text-white transition-all duration-300">
                                Danışmanla Görüş
                            </button>
                        </Link>
                    </div>
                </div>
            </main>
        );
    }

    const currentQ = questions[currentQuestionIdx];
    const progressPerc = ((currentQuestionIdx) / questions.length) * 100;

    return (
        <main className="bg-[#F8F9FA] min-h-screen pt-[85px] pb-20 px-4">
            <div className="max-w-[800px] mx-auto">
                {/* Progress Bar */}
                <div className="mb-8">
                    <div className="flex justify-between text-sm font-bold text-gray-500 mb-3 px-2">
                        <span>Soru {currentQuestionIdx + 1} / {questions.length}</span>
                        <span>% {Math.round(progressPerc)}</span>
                    </div>
                    <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-brand-accent rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${progressPerc}%` }}
                        ></div>
                    </div>
                </div>

                {/* Question Card */}
                <div className="bg-white p-8 md:p-12 rounded-lg shadow-lg border border-gray-100 min-h-[400px] flex flex-col relative animate-fadeIn" key={currentQ.id}>
                    {/* Level indicator for testing/teaching purpose, we can hide it for students if needed, but keeping it adds professionalism */}
                    <div className="absolute top-6 left-6 md:top-8 md:left-8 bg-brand-primary/5 text-brand-primary text-xs font-bold px-3 py-1 rounded-md">
                        Mevcut Seviye: {currentQ.level}
                    </div>

                    <div className="flex-1 mt-8 md:mt-4">
                        <h2 className="text-2xl md:text-3xl font-bold text-brand-primary text-right mb-12 leading-relaxed" dir="rtl">
                            {currentQ.question}
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4" dir="rtl">
                            {currentQ.options.map((opt, idx) => {
                                const isSelected = answers[currentQ.id] === idx;
                                return (
                                    <button
                                        key={idx}
                                        onClick={() => handleAnswer(currentQ.id, idx)}
                                        className={`p-5 text-xl font-medium rounded-xl border-2 text-right transition-all duration-200 flex items-center gap-4 group ${isSelected
                                            ? 'border-brand-accent bg-brand-accent/10 text-brand-primary'
                                            : 'border-gray-100 bg-white hover:border-brand-primary/30 hover:bg-brand-primary/5 text-gray-700'
                                            }`}
                                    >
                                        <div className={`w-6 h-6 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors ${isSelected ? 'border-brand-accent bg-brand-accent' : 'border-gray-300 group-hover:border-brand-primary/50'
                                            }`}>
                                            {isSelected && <div className="w-2.5 h-2.5 bg-brand-primary rounded-full"></div>}
                                        </div>
                                        {opt}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="mt-12 flex justify-between items-center pt-6 border-t border-gray-100">
                        <button
                            onClick={prevQuestion}
                            disabled={currentQuestionIdx === 0}
                            className="text-gray-400 hover:text-brand-primary disabled:opacity-30 disabled:hover:text-gray-400 font-bold flex items-center gap-2 transition-colors"
                        >
                            <i className="fas fa-arrow-left"></i> Önceki
                        </button>

                        <button
                            onClick={nextQuestion}
                            disabled={answers[currentQ.id] === undefined && currentQuestionIdx !== questions.length - 1} // Can't skip unless answered (handled by auto-forward usually)
                            className={`${currentQuestionIdx === questions.length - 1 ? 'bg-brand-accent text-brand-primary px-6 py-2 rounded-lg' : 'text-brand-primary hover:text-brand-accent'} font-bold flex items-center gap-2 transition-colors disabled:opacity-30`}
                        >
                            {currentQuestionIdx === questions.length - 1 ? 'Testi Bitir' : 'Sonraki'} <i className="fas fa-arrow-right"></i>
                        </button>
                    </div>
                </div>
            </div>
        </main>
    );
}
