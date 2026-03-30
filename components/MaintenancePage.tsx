import Image from 'next/image'
import Link from 'next/link'

export default function MaintenancePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#1a3a39] to-brand-primary text-white p-4 relative overflow-hidden">
      {/* Background patterns */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
        <div className="absolute top-10 left-10 w-64 h-64 rounded-full bg-white blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-amber-400 blur-3xl"></div>
      </div>

      <div className="bg-white/10 backdrop-blur-lg border border-white/20 p-8 md:p-12 rounded-lg shadow-2xl max-w-2xl w-full text-center relative z-10">
        <div className="mb-8 relative w-24 h-24 mx-auto animate-bounce-slow">
          <i className="fas fa-tools text-6xl text-amber-400 drop-shadow-lg"></i>
        </div>

        <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
          Bakım Modundayız
        </h1>

        <div className="w-16 h-1 bg-amber-400 mx-auto mb-6 rounded-full"></div>

        <p className="text-lg md:text-xl text-gray-200 mb-8 leading-relaxed">
          Sizlere daha iyi hizmet verebilmek için altyapımızı güçlendiriyoruz.
          <br className="hidden md:block" />
          Şu anda platform üzerinde <span className="text-amber-300 font-semibold">planlı bakım çalışması</span> yapılmaktadır.
        </p>

        <div className="bg-black/20 rounded-lg p-4 mb-8 border border-white/10">
          <p className="text-sm text-gray-300">
            <i className="fas fa-clock mr-2 text-amber-400"></i>
            Çok yakında, yenilenen yüzümüzle tekrar yayında olacağız.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {/* Admin Login Bypass Link (Hidden styling or clear button) */}
          <Link
            href="/giris"
            className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-all backdrop-blur-sm border border-white/10 hover:border-white/30"
          >
            Yönetici Girişi
          </Link>

          <a
            href="mailto:info@beyandil.com"
            className="px-6 py-3 bg-[#C5A365] hover:bg-[#b08e55] text-white rounded-lg font-bold shadow-lg shadow-amber-900/20 transition-all transform hover:-translate-y-0.5"
          >
            Bize Ulaşın
          </a>
        </div>
      </div>

      <footer className="absolute bottom-6 text-center text-white/40 text-sm">
        &copy; {new Date().getFullYear()} Beyan Dil Akademi. Tüm hakları saklıdır.
      </footer>
    </div>
  )
}
