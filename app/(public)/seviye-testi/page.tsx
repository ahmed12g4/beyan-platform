import Link from "next/link";

export default function SeviyeTestiPage() {
    return (
        <main className="bg-[#F8F9FA] min-h-screen pt-[65px]">
            {/* Intro Section */}
            <section className="max-w-[1200px] mx-auto py-16 px-6">
                <div className="flex flex-col md:flex-row items-center gap-16">
                    <div className="flex-1">
                        <span className="text-brand-accent font-bold tracking-widest uppercase text-sm bg-brand-primary px-4 py-2 rounded-full mb-6 inline-block">Ücretsiz Değerlendirme</span>
                        <h1 className="text-4xl md:text-5xl font-bold text-brand-primary mb-6 leading-tight">
                            Arapça Seviyenizi <br /> 15 Dakikada Belirleyin
                        </h1>
                        <p className="text-lg text-gray-600 mb-10 leading-relaxed">
                            Uzman eğitmenlerimiz tarafından hazırlanan kapsamlı seviye tespit sınavımız ile gramer, kelime bilgisi ve okuma becerilerinizi ölçüyoruz. Sonuçlarınıza göre size en uygun sınıfı öneriyoruz.
                        </p>

                        <div className="space-y-6 mb-12">
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 bg-brand-accent/20 rounded-lg flex items-center justify-center shrink-0 mt-1">
                                    <i className="fas fa-clock text-brand-primary"></i>
                                </div>
                                <div>
                                    <h4 className="font-bold text-brand-primary">Hızlı ve Etkili</h4>
                                    <p className="text-gray-500 text-sm">Sadece 30 sorudan oluşan test yaklaşık 15-20 dakikanızı alır.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 bg-brand-accent/20 rounded-lg flex items-center justify-center shrink-0 mt-1">
                                    <i className="fas fa-chart-line text-brand-primary"></i>
                                </div>
                                <div>
                                    <h4 className="font-bold text-brand-primary">Detaylı Analiz</h4>
                                    <p className="text-gray-500 text-sm">Zayıf ve güçlü yanlarınızın analiz edildiği bir rapor sunulur.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 bg-brand-accent/20 rounded-lg flex items-center justify-center shrink-0 mt-1">
                                    <i className="fas fa-certificate text-brand-primary"></i>
                                </div>
                                <div>
                                    <h4 className="font-bold text-brand-primary">Resmi Sınıf Atama</h4>
                                    <p className="text-gray-500 text-sm">Test sonucunuz kayıt esnasında seviyenizi kanıtlamak için kullanılır.</p>
                                </div>
                            </div>
                        </div>

                        <Link href="/seviye-testi/basla">
                            <button className="bg-brand-primary text-white font-bold px-10 py-5 rounded-lg shadow-xl hover:bg-brand-primary-dark hover:-translate-y-1 transition-all duration-300">
                                Testi Hemen Başlat
                            </button>
                        </Link>
                    </div>

                    <div className="flex-1 w-full max-w-[500px]">
                        <div className="bg-white p-8 rounded-lg shadow-[0_20px_60px_rgba(0,0,0,0.05)] border border-gray-100">
                            <h3 className="text-xl font-bold text-brand-primary mb-6">Test Hakkında Önemli Notlar</h3>
                            <div className="space-y-4">
                                <p className="text-gray-600 text-sm border-l-4 border-brand-accent pl-4">Lütfen soruları yardım almadan, kendi bilginizle cevaplayın.</p>
                                <p className="text-gray-600 text-sm border-l-4 border-brand-accent pl-4">Emin olmadığınız sorulara &quot;Bilmiyorum&quot; şıkkını işaretleyin.</p>
                                <p className="text-gray-600 text-sm border-l-4 border-brand-accent pl-4">Test esnasında başka kaynak kullanmak sonucun doğruluğunu etkiler.</p>
                                <p className="text-gray-600 text-sm border-l-4 border-brand-accent pl-4">Sonuçlar anında ekranınızda belirecektir.</p>
                            </div>

                            <div className="mt-10 p-6 bg-brand-primary/5 rounded-lg border border-dashed border-brand-primary/20">
                                <p className="text-center text-brand-primary font-medium text-sm">
                                    Emin değil misiniz? <br />
                                    <Link href="/iletisim" className="underline font-bold">Bizimle iletişime geçin</Link> bir eğitmenle görüşün.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Scale Section */}
            <section className="bg-white py-20 px-6">
                <div className="max-w-[1200px] mx-auto text-center mb-16">
                    <h2 className="text-3xl font-bold text-brand-primary mb-4">Değerlendirme Skalamız</h2>
                    <p className="text-gray-600">CEFR (Avrupa Ortak Dil Çerçevesi) standartlarına uygun değerlendirme</p>
                </div>

                <div className="max-w-[1200px] mx-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {["A1", "A2", "B1", "B2", "C1", "C2"].map((level) => (
                        <div key={level} className="p-6 border rounded-xl flex flex-col items-center justify-center hover:border-brand-accent hover:bg-brand-accent/5 transition-all">
                            <span className="text-2xl font-black text-brand-primary">{level}</span>
                            <span className="text-xs text-gray-500 mt-2 uppercase tracking-tighter">Seviye</span>
                        </div>
                    ))}
                </div>
            </section>
        </main>
    );
}
