import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

const levelsData = {
    a1: {
        id: "a1",
        title: "A1 - Başlangıç Seviyesi",
        fullTitle: "Arapça Başlangıç Seviyesi (A1)",
        description: "Temel selamlaşmalar, basit cümleler ve günlük hayatta ihtiyaç duyulan temel Arapça bilgisi.",
        longDescription: "A1 seviyesi, Arapça öğrenme yolculuğunuzun ilk adımıdır. Bu seviyede, Arap alfabesini tanıyacak, temel telaffuz kurallarını öğrenecek ve günlük hayatta kendinizi basitçe ifade edebilecek seviyeye geleceksiniz.",
        objectives: [
            "Arap alfabesini ve hareke sistemini öğrenmek",
            "Temel selamlaşma ve tanışma ifadelerini kullanmak",
            "Sayılar, günler ve temel zaman kavramlarını anlamak",
            "Basit sorular sormak ve cevaplamak",
            "Kısa ve basit metinleri okuyup anlamak"
        ],
        image: "/assets/levels/a1.png",
        color: "from-blue-600 to-blue-800",
        accent: "text-blue-600"
    },
    a2: {
        id: "a2",
        title: "A2 - Temel Seviye",
        fullTitle: "Arapça Temel Seviye (A2)",
        description: "Kendinizi ifade etme, alışveriş, iş ve sosyal çevre ile ilgili temel iletişim becerileri.",
        longDescription: "A2 seviyesinde, temel dil bilginizi geliştirerek daha karmaşık yapılar kurmaya başlarsınız. Günlük rutinler, basit alışveriş diyalogları ve kişisel geçmişiniz hakkında konuşabilir hale gelirsiniz.",
        objectives: [
            "Günlük yaşamla ilgili diyalogları sürdürmek",
            "Geçmiş zaman yapılarını kullanarak hikayeler anlatmak",
            "Alışveriş, banka ve hastane gibi yerlerde iletişim kurmak",
            "Basit mektuplar ve notlar yazmak",
            "Orta uzunluktaki konuşmaları takip edebilmek"
        ],
        image: "/assets/levels/a2.png",
        color: "from-green-600 to-green-800",
        accent: "text-green-600"
    },
    b1: {
        id: "b1",
        title: "B1 - Orta Seviye Öncesi",
        fullTitle: "Arapça Orta Seviye Öncesi (B1)",
        description: "Standart dildeki ana noktaları anlama ve ilginizi çeken konularda kendinizi ifade etme.",
        longDescription: "B1 seviyesi, dili bağımsız bir şekilde kullanmaya başladığınız eşiktir. Seyahatlerde karşılaşabileceğiniz çoğu durumun üstesinden gelebilir, deneyimlerinizi, hayallerinizi ve amaçlarınızı açıklayabilirsiniz.",
        objectives: [
            "İlgi çekici konularda fikir beyan etmek",
            "Gelecek planları ve olasılıklar hakkında konuşmak",
            "Standart Arapça haberlerini ve makalelerini takip etmek",
            "Kısa sunumlar hazırlamak ve sunmak",
            "Dili akıcı bir şekilde, duraksamadan kullanmaya başlamak"
        ],
        image: "/assets/levels/b1.png",
        color: "from-amber-600 to-amber-800",
        accent: "text-amber-600"
    },
    b2: {
        id: "b2",
        title: "B2 - Orta Seviye",
        fullTitle: "Arapça Orta Seviye (B2)",
        description: "Karmaşık metinleri anlama, akıcı bir şekilde iletişim kurma ve teknik tartışmalara katılma.",
        longDescription: "B2 seviyesinde, hem somut hem de soyut konulardaki karmaşık metinlerin ana fikrini anlayabilirsiniz. Ana dili Arapça olan kişilerle belirli bir akıcılık ve doğallıkla iletişim kurabilirsiniz.",
        objectives: [
            "Akademik ve teknik metinleri analiz etmek",
            "Tartışmalı konularda avantaj ve dezavantajları sunmak",
            "Deyimler ve atasözlerini yerinde kullanmak",
            "Karmaşık cümle yapılarını hatasız kurmak",
            "Arap edebiyatından temel eserleri okumak"
        ],
        image: "/assets/levels/b2.png",
        color: "from-orange-600 to-orange-800",
        accent: "text-orange-600"
    },
    c1: {
        id: "c1",
        title: "C1 - İleri Seviye",
        fullTitle: "Arapça İleri Seviye (C1)",
        description: "Geniş bir konu yelpazesinde karmaşık metinleri anlama ve profesyonel düzeyde iletişim.",
        longDescription: "C1 seviyesinde, dili toplumsal, akademik ve mesleki amaçlar için esnek ve etkili bir şekilde kullanabilirsiniz. Sözcükleri aramaya gerek duymadan kendinizi akıcı ve kesin bir şekilde ifade edebilirsiniz.",
        objectives: [
            "Uzun ve zorlu metinleri derinlemesine anlamak",
            "İnce anlam farklarını (nüansları) kavrayabilmek",
            "Resmi ve gayri resmi dilde mükemmel uyum sağlamak",
            "Geniş hitabet yeteneği kazanmak",
            "Karmaşık konularda yapılandırılmış metinler yazmak"
        ],
        image: "/assets/levels/c1.png",
        color: "from-red-600 to-red-800",
        accent: "text-red-600"
    },
    c2: {
        id: "c2",
        title: "C2 - Uzmanlık Seviyesi",
        fullTitle: "Arapça Uzmanlık Seviyesi (C2)",
        description: "Akademik ve profesyonel her türlü metni ve tartışmayı ana dil düzeyinde anlama ve yorumlama.",
        longDescription: "C2 seviyesi, Arapça'da yetkinliğin zirvesidir. Duyduğunuz veya okuduğunuz hemen her şeyi zahmetsizce anlayabilirsiniz. Farklı kaynaklardan gelen bilgileri özetleyebilir, karmaşık durumlarda bile kendinizi ana dilinizmiş gibi ifade edebilirsiniz.",
        objectives: [
            "Her türlü kaynağı zahmetsizce anlamak",
            "Bilgiyi tutarlı bir şekilde sentezlemek",
            "En ince anlam ayrıntılarını ayırt edebilmek",
            "Akademik araştırmalar yapabilmek ve yazabilmek",
            "Kültürel ve edebi tüm göndermeleri kavramak"
        ],
        image: "/assets/levels/c2.png",
        color: "from-purple-600 to-purple-800",
        accent: "text-purple-600"
    }
} as const;

export default async function LevelDetailPage({ params }: { params: Promise<{ level: string }> }) {
    const { level } = await params;
    const lowerLevel = level.toLowerCase();
    const data = levelsData[lowerLevel as keyof typeof levelsData];

    if (!data) {
        notFound();
    }

    const supabase = await createClient();
    const { data: courses } = await supabase
        .from('courses')
        .select(`
            *,
            teacher:profiles!courses_teacher_id_fkey(full_name, avatar_url)
        `)
        .eq('level', level.toUpperCase())
        .eq('is_published', true)
        .limit(6);

    return (
        <main className="min-h-screen bg-gray-50 pt-24 pb-16">
            {/* Hero Section */}
            <div className={`bg-gradient-to-br ${data.color} text-white py-20 px-6`}>
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row items-center gap-12">
                        <div className="flex-1 text-center md:text-left">
                            <Link
                                href="/seviyeler"
                                className="inline-flex items-center text-white/80 hover:text-white mb-6 transition-colors"
                            >
                                <i className="fas fa-arrow-left mr-2"></i> Tüm Seviyeler
                            </Link>
                            <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">
                                {data.fullTitle}
                            </h1>
                            <p className="text-xl opacity-90 leading-relaxed max-w-2xl">
                                {data.longDescription}
                            </p>
                        </div>
                        <div className="w-64 h-64 md:w-80 md:h-80 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/20">
                            <span className="text-7xl md:text-9xl font-black">{data.id.toUpperCase()}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Section */}
            <div className="max-w-7xl mx-auto px-6 py-16">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* Objectives */}
                    <div className="lg:col-span-2 space-y-12">
                        <section>
                            <h2 className="text-3xl font-bold text-gray-900 mb-8 flex items-center">
                                <span className={`w-2 h-8 ${data.color.split(' ')[0]} rounded-full mr-4`}></span>
                                Neler Öğreneceksiniz?
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {data.objectives.map((obj, idx) => (
                                    <div key={idx} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-start">
                                        <div className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center mr-4 bg-gray-50 ${data.accent}`}>
                                            <i className="fas fa-check"></i>
                                        </div>
                                        <p className="text-gray-700 font-medium">{obj}</p>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Relative Courses */}
                        <section>
                            <h2 className="text-3xl font-bold text-gray-900 mb-8 flex items-center">
                                <span className={`w-2 h-8 ${data.color.split(' ')[0]} rounded-full mr-4`}></span>
                                Bu Seviyedeki Kurslar
                            </h2>
                            {courses && courses.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {courses.map((course) => (
                                        <Link
                                            key={course.id}
                                            href={`/kurslar/${course.slug}`}
                                            className="group bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-all"
                                        >
                                            <div className="aspect-video relative overflow-hidden">
                                                {course.thumbnail_url ? (
                                                    <img
                                                        src={course.thumbnail_url}
                                                        alt={course.title}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                                                        <i className="fas fa-book text-gray-300 text-3xl"></i>
                                                    </div>
                                                )}
                                                <div className="absolute top-4 left-4">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold bg-white/90 backdrop-blur shadow-sm ${data.accent}`}>
                                                        {course.level}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="p-6">
                                                <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                                                    {course.title}
                                                </h3>
                                                <div className="flex items-center gap-3 text-sm text-gray-500">
                                                    <i className="fas fa-user-tie"></i>
                                                    <span>{course.teacher?.full_name || 'BEYAN Eğitmeni'}</span>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-gray-100 rounded-xl p-12 text-center">
                                    <p className="text-gray-500 font-medium">Bu seviye için şu an planlanmış aktif bir kurs bulunmamaktadır.</p>
                                    <Link href="/iletisim" className="text-blue-600 font-bold mt-4 inline-block hover:underline">
                                        Bilgi Almak İstiyorum
                                    </Link>
                                </div>
                            )}
                        </section>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-8">
                        <div className="bg-white rounded-xl p-8 border border-gray-100 shadow-sm">
                            <h3 className="text-xl font-bold mb-6 text-gray-900">Seviye Testi</h3>
                            <p className="text-gray-600 mb-8 leading-relaxed">
                                Hangi seviye olduğunuzdan emin değil misiniz? Uzmanlarımız tarafından hazırlanan ücretsiz seviye tespit sınavımıza katılarak yolculuğunuza en doğru noktadan başlayın.
                            </p>
                            <Link href="/seviye-testi">
                                <button className={`w-full py-4 rounded-xl font-bold text-white transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] ${data.color}`}>
                                    Testi Şimdi Çöz
                                </button>
                            </Link>
                        </div>

                        <div className="bg-brand-primary rounded-xl p-8 text-white shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                            <h3 className="text-xl font-bold mb-4 relative z-10">Bize Ulaşın</h3>
                            <p className="text-white/80 mb-6 text-sm relative z-10">
                                Eğitim süreci, müfredat veya kurumsal eğitimler hakkında daha fazla bilgi almak için ekibimizle görüşün.
                            </p>
                            <Link href="/iletisim" className="inline-flex items-center font-bold text-brand-accent hover:underline">
                                Müşteri Hizmetleri <i className="fas fa-chevron-right ml-2 text-xs"></i>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
