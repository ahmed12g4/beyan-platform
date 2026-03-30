"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import ReCAPTCHA from "react-google-recaptcha";
import { loginAction } from "@/lib/actions/auth";
import { createClient } from "@/lib/supabase/client";

const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || '';
const SHOW_CAPTCHA_AFTER = 3 // Show reCAPTCHA after this many consecutive failures

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo');
  const authError = searchParams.get('error');

  // Map auth error codes to user-friendly Turkish messages
  const getAuthErrorMessage = (code: string | null) => {
    if (!code) return null;
    const messages: Record<string, string> = {
      link_expired: 'Doğrulama bağlantısının süresi dolmuş. Lütfen tekrar kayıt olun.',
      invalid_token: 'Geçersiz doğrulama bağlantısı. Lütfen tekrar deneyin.',
      auth_error: 'Bir kimlik doğrulama hatası oluştu.',
      auth_callback_error: 'Doğrulama sırasında bir hata oluştu.',
      account_disabled: 'Hesabınız yönetici tarafından askıya alınmıştır. Lütfen iletişime geçin.',
    };
    return messages[code] || 'Bir hata oluştu. Lütfen tekrar deneyin.';
  };

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(getAuthErrorMessage(authError));
  const [showPassword, setShowPassword] = useState(false);

  // ── Rate limit countdown ──
  const [rateLimitSeconds, setRateLimitSeconds] = useState(0)

  // ── reCAPTCHA ──
  const [failCount, setFailCount] = useState(0)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const recaptchaRef = useRef<ReCAPTCHA>(null)
  const showCaptcha = failCount >= SHOW_CAPTCHA_AFTER && !!RECAPTCHA_SITE_KEY

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Extract wait seconds from server error like "Lütfen 45 saniye sonra tekrar deneyin."
  const extractSeconds = (msg: string): number => {
    const match = msg.match(/(\d+)\s*saniye/);
    return match ? parseInt(match[1], 10) : 0;
  };

  // Countdown effect — decrements every 1s, clears error when done
  useEffect(() => {
    if (rateLimitSeconds <= 0) return
    const timer = setInterval(() => {
      setRateLimitSeconds(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          setError(null)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [rateLimitSeconds])

  const isRateLimited = rateLimitSeconds > 0

  useEffect(() => {
    if (authError === 'account_disabled') {
      const supabase = createClient()
      supabase.auth.signOut()
    }
  }, [authError])

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Don't clear error while rate limited
    if (error && !isRateLimited) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isRateLimited) return
    // If CAPTCHA is shown but not yet completed, block submission
    if (showCaptcha && !captchaToken) {
      setError('Lütfen robot olmadığınızı doğrulayın.')
      return
    }
    setLoading(true);
    setError(null);

    try {
      const result = await loginAction(
        { email: formData.email, password: formData.password },
        captchaToken || undefined
      );

      if (!result.success) {
        const msg = result.error || 'Bir hata oluştu'
        setError(msg)
        // Track consecutive failures for reCAPTCHA trigger
        setFailCount(prev => prev + 1)
        // Reset CAPTCHA widget after each failed attempt
        recaptchaRef.current?.reset()
        setCaptchaToken(null)
        // Start countdown if rate-limited
        const secs = extractSeconds(msg)
        if (secs > 0) setRateLimitSeconds(secs)
        setLoading(false);
        return;
      }

      // Reset on success
      setFailCount(0)
      setCaptchaToken(null)

      // Redirect to the intended page or role-based dashboard
      if (redirectTo) {
        router.push(redirectTo);
      } else {
        router.push('/auth/redirect');
      }
      router.refresh();
    } catch {
      setError('Bir hata oluştu. Lütfen tekrar deneyin.');
      setFailCount(prev => prev + 1)
      recaptchaRef.current?.reset()
      setCaptchaToken(null)
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
          <h1 className="text-2xl md:text-3xl font-bold text-brand-primary mb-2">Hoş Geldiniz</h1>

          <p className="text-sm text-gray-600">Eğitim yolculuğunuza devam etmek için giriş yapın.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* ── Error / Rate Limit block ── */}
          {error && (
            <div className={`p-4 rounded-lg border animate-in fade-in duration-300 shadow-sm ${isRateLimited
              ? 'bg-white border-gray-200'
              : 'bg-red-50 border-red-200'
              }`}>
              <div className="flex items-start gap-3">
                {isRateLimited ? (
                  <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center shrink-0 mt-0.5">
                    <i className="fas fa-clock text-sm"></i>
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-red-100 text-red-500 flex items-center justify-center shrink-0 mt-0.5">
                    <i className="fas fa-exclamation-triangle text-sm"></i>
                  </div>
                )}
                <div className="flex-1">
                  <p className={`text-[13px] font-bold mt-1.5 ${isRateLimited ? 'text-gray-700' : 'text-red-600'}`}>
                    {isRateLimited
                      ? 'Çok fazla deneme yaptınız.'
                      : error
                    }
                  </p>
                  {isRateLimited && (
                    <div className="mt-3 flex items-center gap-3">
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-brand-primary rounded-full transition-all duration-1000 ease-linear"
                          style={{ width: `${(rateLimitSeconds / (extractSeconds(error) || rateLimitSeconds)) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs font-black text-[#204544] tabular-nums">
                        {formatTime(rateLimitSeconds)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
              E-Posta Adresi
            </label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => updateField("email", e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(e as any); }}
              disabled={loading || isRateLimited}
              className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-gray-300 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all disabled:bg-gray-50 disabled:cursor-not-allowed"
              placeholder="ornek@email.com"
              autoComplete="email"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
              Şifre
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={formData.password}
                onChange={(e) => updateField("password", e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(e as any); }}
                disabled={loading || isRateLimited}
                className="w-full px-3.5 py-2.5 pr-11 text-sm rounded-lg border border-gray-300 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all disabled:bg-gray-50 disabled:cursor-not-allowed"
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand-primary transition-colors p-1"
                aria-label={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
                tabIndex={-1}
              >
                {showPassword ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end text-sm pt-1">
            <Link href="/sifremi-unuttum" className="text-brand-primary font-semibold hover:underline">
              Şifremi unuttum
            </Link>
          </div>

          {/* ── reCAPTCHA — appears after 3 failed attempts ── */}
          {showCaptcha && (
            <div className="flex flex-col items-center gap-2 pt-1 animate-in fade-in slide-in-from-top-2 duration-300">
              <p className="text-xs text-gray-500 text-center">
                Güvenlik doğrulaması gerekiyor — lütfen aşağıdaki kutuyu işaretleyin
              </p>
              <ReCAPTCHA
                ref={recaptchaRef}
                sitekey={RECAPTCHA_SITE_KEY}
                onChange={(token) => setCaptchaToken(token)}
                onExpired={() => setCaptchaToken(null)}
                onError={() => setCaptchaToken(null)}
                hl="tr"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading || isRateLimited || (showCaptcha && !captchaToken)}
            className={`w-full py-3.5 rounded-lg font-bold transition-all text-[15px] mt-6 flex items-center justify-center gap-2 ${isRateLimited
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200 shadow-none'
              : (showCaptcha && !captchaToken)
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200 shadow-none'
                : 'bg-brand-primary text-white hover:shadow-lg hover:shadow-brand-primary/20 hover:-translate-y-0.5 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed'
              }`}
          >
            {isRateLimited ? (
              <>
                <i className="fas fa-lock"></i>
                {formatTime(rateLimitSeconds)} Bekleyin
              </>
            ) : loading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i>
                Giriş yapılıyor...
              </>
            ) : "Giriş Yap"}
          </button>

        </form>

        <div className="mt-5 text-center text-sm">
          <span className="text-gray-600">Hesabınız yok mu? </span>
          <Link href="/kayit" className="text-brand-primary font-semibold hover:underline">
            Kayıt olun
          </Link>
        </div>
      </div>
    </main>
  );
}
