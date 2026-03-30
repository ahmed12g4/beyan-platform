"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { resetPasswordAction } from "@/lib/actions/auth";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [verifying, setVerifying] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setError("Geçersiz veya süresi dolmuş sıfırlama bağlantısı. Lütfen tekrar şifre sıfırlama talebinde bulunun.");
      }
      setVerifying(false);
    };

    checkSession();
  }, []);

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError("Şifreler eşleşmiyor.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await resetPasswordAction(formData);

      if (!result.success) {
        setError(result.error || "Şifre güncellenirken bir hata oluştu.");
        setLoading(false);
        return;
      }

      setSuccess(true);
      setLoading(false);

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/giris');
      }, 3000);
    } catch {
      setError("Bir hata oluştu. Lütfen tekrar deneyin.");
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <main className="min-h-screen flex items-center justify-center py-12 px-4 bg-brand-primary-light">
        <div className="w-full max-w-[500px] bg-white rounded-lg border border-gray-200 shadow-xl p-8 text-center">
          <div className="animate-spin h-10 w-10 border-4 border-brand-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Oturum doğrulanıyor...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center py-12 px-4 bg-brand-primary-light">
      <div className="w-full max-w-[500px] bg-white rounded-lg border border-gray-200 shadow-xl p-6 md:p-8">
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 relative mb-4">
            <Image src="/assets/logo-new.png" alt="Logo" fill sizes="160px" className="object-contain" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-brand-primary mb-2">Şifre Sıfırla</h1>
          <p className="text-sm text-gray-600 text-center">
            Lütfen yeni şifrenizi belirleyin.
          </p>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg mb-6 text-sm animate-in fade-in duration-300">
            {error}
            {error.includes("Geçersiz") && (
              <Link href="/sifremi-unuttum" className="block mt-2 font-bold underline">
                Yeniden bağlantı iste →
              </Link>
            )}
          </div>
        )}

        {success ? (
          <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg text-center animate-in zoom-in duration-300">
            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="font-bold text-lg mb-1">Şifreniz Güncellendi!</p>
            <p className="text-sm mb-4">Yeni şifrenizle giriş yapabilirsiniz. Giriş sayfasına yönlendiriliyorsunuz...</p>
            <Link href="/giris" className="text-brand-primary font-bold hover:underline">
              Hemen giriş yap →
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                Yeni Şifre
              </label>
              <input
                type="password"
                id="password"
                value={formData.password}
                onChange={(e) => updateField("password", e.target.value)}
                disabled={loading}
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-gray-300 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all disabled:bg-gray-50 disabled:cursor-not-allowed"
                placeholder="••••••••"
                autoComplete="new-password"
                required
                minLength={6}
              />
            </div>

            <div>
              <label htmlFor="confirm-password" className="block text-sm font-semibold text-gray-700 mb-2">
                Yeni Şifre Tekrar
              </label>
              <input
                type="password"
                id="confirm-password"
                value={formData.confirmPassword}
                onChange={(e) => updateField("confirmPassword", e.target.value)}
                disabled={loading}
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-gray-300 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all disabled:bg-gray-50 disabled:cursor-not-allowed"
                placeholder="••••••••"
                autoComplete="new-password"
                required
                minLength={6}
              />
            </div>

            {/* Password match indicator */}
            {formData.confirmPassword && (
              <div className={`flex items-center gap-1.5 text-xs ${formData.password === formData.confirmPassword ? 'text-green-600' : 'text-red-600'
                }`}>
                {formData.password === formData.confirmPassword ? (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Şifreler eşleşiyor
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Şifreler eşleşmiyor
                  </>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !formData.password || formData.password !== formData.confirmPassword}
              className="w-full bg-brand-primary text-white py-3 rounded-lg font-semibold transition-all text-base mt-5 shadow-md hover:shadow-lg hover:bg-brand-primary-hover disabled:bg-gray-400 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Güncelleniyor...
                </>
              ) : "Şifreyi Güncelle"}
            </button>
          </form>
        )}

        <div className="mt-5 text-center text-sm">
          <Link href="/giris" className="text-brand-primary font-semibold hover:underline">
            ← Giriş sayfasına dön
          </Link>
        </div>
      </div>
    </main>
  );
}
