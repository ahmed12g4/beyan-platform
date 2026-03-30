"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { forgotPasswordAction } from "@/lib/actions/auth";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const result = await forgotPasswordAction({ email });
      if (result.success) {
        setMessage({
          type: 'success',
          text: 'Şifre sıfırlama bağlantısı e-posta adresinize gönderildi. Lütfen gelen kutunuzu kontrol edin.'
        });
      } else {
        setMessage({
          type: 'error',
          text: result.error || 'Bir hata oluştu. Lütfen tekrar deneyin.'
        });
      }
    } catch {
      setMessage({
        type: 'error',
        text: 'Bir hata oluştu. Lütfen tekrar deneyin.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center py-12 px-4 bg-brand-primary-light">
      <div className="w-full max-w-[500px] bg-white rounded-lg border border-gray-200 shadow-xl p-6 md:p-8">
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 relative mb-4">
            <Image src="/assets/logo-new.png" alt="Logo" fill sizes="160px" className="object-contain" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-brand-primary mb-2 text-center">Şifremi Unuttum</h1>
          <p className="text-sm text-gray-600 text-center">
            E-posta adresinizi girin, size şifre sıfırlama bağlantısı gönderelim.
          </p>
        </div>

        {message && (
          <div className={`p-4 rounded-lg mb-6 text-sm animate-in fade-in duration-300 ${message.type === 'success'
            ? 'bg-green-50 border border-green-200 text-green-700'
            : 'bg-red-50 border border-red-200 text-red-700'
            }`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
              E-Posta Adresi
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-gray-300 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all disabled:bg-gray-50 disabled:cursor-not-allowed"
              placeholder="ornek@email.com"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading || !email}
            className="w-full bg-brand-primary text-white py-3 rounded-lg font-semibold transition-all text-base mt-5 shadow-md hover:shadow-lg hover:bg-brand-primary-hover disabled:bg-gray-400 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Gönderiliyor...
              </>
            ) : "Bağlantı Gönder"}
          </button>
        </form>

        <div className="mt-5 text-center text-sm">
          <Link href="/giris" className="text-brand-primary font-semibold hover:underline">
            ← Giriş sayfasına dön
          </Link>
        </div>
      </div>
    </main>
  );
}
