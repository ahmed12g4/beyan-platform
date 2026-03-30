"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import CountrySelector from "../kayit/components/CountrySelector";
import TermsModal from "../kayit/components/TermsModal";
import { registerAction, checkEmailExists } from "@/lib/actions/auth";

interface TeacherApplyClientProps {
    termsContent?: string;
}

export default function TeacherApplyClient({ termsContent }: TeacherApplyClientProps) {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        countryCode: '+90',
        password: '',
        confirmPassword: '',
        termsAccepted: false,
        expertise: '',
        bio: '',
        role: 'teacher' as const
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [showTermsModal, setShowTermsModal] = useState(false);
    const [emailChecking, setEmailChecking] = useState(false);

    const handleEmailBlur = async () => {
        if (!formData.email || !formData.email.includes('@')) return;
        setEmailChecking(true);
        const exists = await checkEmailExists(formData.email);
        if (exists) {
            setErrors(prev => ({ ...prev, email: 'Bu e-posta adresi zaten kullanımda' }));
        }
        setEmailChecking(false);
    };

    const handlePhoneKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if ([46, 8, 9, 27, 13].indexOf(e.keyCode) !== -1 ||
            (e.keyCode === 65 && e.ctrlKey === true) ||
            (e.keyCode >= 35 && e.keyCode <= 40)) {
            return;
        }
        if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
            e.preventDefault();
        }
    };

    const updateField = (field: string, value: string | boolean) => {
        setFormData(prev => {
            const next = { ...prev, [field]: value };

            if (field === 'confirmPassword') {
                if (value && value !== next.password) {
                    setErrors(e => ({ ...e, confirmPassword: 'Şifreler eşleşmiyor' }));
                } else {
                    setErrors(e => { const n = { ...e }; delete n.confirmPassword; return n; });
                }
                return next;
            }

            if (field === 'password') {
                if (next.confirmPassword && value !== next.confirmPassword) {
                    setErrors(e => ({ ...e, confirmPassword: 'Şifreler eşleşmiyor' }));
                } else if (next.confirmPassword && value === next.confirmPassword) {
                    setErrors(e => { const n = { ...e }; delete n.confirmPassword; return n; });
                }
                setErrors(e => { const n = { ...e }; delete n.password; return n; });
                return next;
            }

            if (errors[field]) {
                setErrors(e => { const n = { ...e }; delete n[field]; return n; });
            }
            return next;
        });
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};
        if (!formData.firstName.trim()) newErrors.firstName = 'Ad gerekli';
        if (!formData.lastName.trim()) newErrors.lastName = 'Soyad gerekli';
        if (!formData.email.trim()) newErrors.email = 'E-posta gerekli';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Geçerli bir e-posta girin';

        const fullPhone = formData.phone.trim();
        if (!fullPhone) {
            newErrors.phone = 'Telefon numarası gerekli';
        } else if (!/^[0-9]{7,15}$/.test(fullPhone)) {
            newErrors.phone = 'Geçerli bir telefon numarası girin (sadece rakam)';
        }

        if (!formData.expertise.trim()) newErrors.expertise = 'Uzmanlık alanı gerekli';
        if (!formData.bio.trim()) newErrors.bio = 'Kısa özgeçmiş gerekli';
        if (formData.password.length < 6) newErrors.password = 'Şifre en az 6 karakter olmalı';
        if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Şifreler eşleşmiyor';
        if (!formData.termsAccepted) newErrors.terms = 'Kullanım şartlarını kabul etmelisiniz';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const isFormValid = () => {
        return formData.firstName.trim() &&
            formData.lastName.trim() &&
            formData.email.trim() &&
            formData.phone.trim() &&
            formData.expertise.trim() &&
            formData.bio.trim() &&
            formData.password.length >= 6 &&
            formData.password === formData.confirmPassword &&
            formData.termsAccepted;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        setLoading(true);
        setErrors({});

        try {
            const result = await registerAction({
                full_name: `${formData.firstName.trim()} ${formData.lastName.trim()}`,
                email: formData.email.trim(),
                password: formData.password,
                confirmPassword: formData.confirmPassword,
                phone: `${formData.countryCode}${formData.phone.trim()}`,
                role: 'teacher',
                expertise: formData.expertise.trim(),
                bio: formData.bio.trim(),
            });

            if (!result.success) {
                setErrors({ general: result.error || 'Bir hata oluştu' });
                setLoading(false);
                return;
            }

            setSuccess(true);
            setLoading(false);
        } catch {
            setErrors({ general: 'Bir hata oluştu. Lütfen tekrar deneyin.' });
            setLoading(false);
        }
    };

    const handleAcceptTerms = () => {
        updateField("termsAccepted", true);
        setShowTermsModal(false);
    };

    return (
        <>
            <main className="min-h-screen flex items-center justify-center py-12 px-4 bg-brand-primary-light">
                <div className="w-full max-w-[500px] bg-white rounded-lg border border-gray-200 shadow-xl p-6 md:p-8">
                    {/* Header Section */}
                    <div className="flex flex-col items-center mb-6">
                        <div className="w-16 h-16 relative mb-4">
                            <Image src="/assets/logo-new.png" alt="Logo" fill sizes="160px" className="object-contain" />
                        </div>
                        <h1 className="text-2xl md:text-3xl font-bold text-brand-primary mb-2 text-center">Eğitmen Başvurusu</h1>
                        <p className="text-sm text-gray-600 text-center">Ekibimize katılın ve Arapça eğitimine değer katın.</p>
                    </div>

                    {success && (
                        <div className="p-4 bg-green-50 border border-green-200 rounded-lg animate-in fade-in duration-300">
                            <div className="flex items-start gap-2">
                                <svg className="w-5 h-5 text-green-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <div>
                                    <p className="text-sm text-green-700 font-semibold mb-1">Başvurunuz Alındı!</p>
                                    <p className="text-sm text-green-600">
                                        Eğitmen hesabınız başarıyla oluşturuldu ve şu an <strong>yönetici onayı bekliyor</strong>. Profiliniz incelendikten sonra sizinle iletişime geçeceğiz.
                                    </p>
                                    <Link href="/" className="inline-block mt-3 text-sm text-green-700 font-semibold hover:underline">
                                        → Ana sayfaya git
                                    </Link>
                                </div>
                            </div>
                        </div>
                    )}

                    {errors.general && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-4 animate-in fade-in duration-300">
                            <div className="flex items-start gap-2">
                                <svg className="w-5 h-5 text-red-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p className="text-sm text-red-600">{errors.general}</p>
                            </div>
                        </div>
                    )}

                    {!success && (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Name Fields */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="firstName" className="block text-sm font-semibold text-gray-700 mb-2">
                                        Ad <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="firstName"
                                        value={formData.firstName}
                                        onChange={(e) => updateField("firstName", e.target.value)}
                                        disabled={loading}
                                        className={`w-full px-3.5 py-2.5 text-sm rounded-lg border ${errors.firstName ? 'border-red-400 bg-red-50' : 'border-gray-300'} focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all disabled:bg-gray-50`}
                                        placeholder="Adınız"
                                    />
                                    {errors.firstName && <p className="text-red-600 text-xs mt-1.5 flex items-center gap-1"><span className="inline-block w-1 h-1 bg-red-600 rounded-full"></span>{errors.firstName}</p>}
                                </div>

                                <div>
                                    <label htmlFor="lastName" className="block text-sm font-semibold text-gray-700 mb-2">
                                        Soyad <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="lastName"
                                        value={formData.lastName}
                                        onChange={(e) => updateField("lastName", e.target.value)}
                                        disabled={loading}
                                        className={`w-full px-3.5 py-2.5 text-sm rounded-lg border ${errors.lastName ? 'border-red-400 bg-red-50' : 'border-gray-300'} focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all disabled:bg-gray-50`}
                                        placeholder="Soyadınız"
                                    />
                                    {errors.lastName && <p className="text-red-600 text-xs mt-1.5 flex items-center gap-1"><span className="inline-block w-1 h-1 bg-red-600 rounded-full"></span>{errors.lastName}</p>}
                                </div>
                            </div>

                            {/* Email Field */}
                            <div>
                                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                                    E-Posta Adresi <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    value={formData.email}
                                    onChange={(e) => updateField("email", e.target.value)}
                                    onBlur={handleEmailBlur}
                                    disabled={loading || emailChecking}
                                    className={`w-full px-3.5 py-2.5 text-sm rounded-lg border ${errors.email ? 'border-red-400 bg-red-50' : 'border-gray-300'} focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all disabled:bg-gray-50`}
                                    placeholder="eğitmen@beyandil.com"
                                />
                                {emailChecking && <p className="text-gray-400 text-xs mt-1 animate-pulse">Kontrol ediliyor...</p>}
                                {errors.email && <p className="text-red-600 text-xs mt-1.5 flex items-center gap-1"><span className="inline-block w-1 h-1 bg-red-600 rounded-full"></span>{errors.email}</p>}
                            </div>

                            {/* Phone Field */}
                            <div>
                                <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">
                                    Telefon Numarası <span className="text-red-500">*</span>
                                </label>
                                <div className="flex gap-2">
                                    <CountrySelector
                                        selectedCode={formData.countryCode}
                                        onSelect={(code) => updateField("countryCode", code)}
                                    />
                                    <input
                                        type="tel"
                                        id="phone"
                                        value={formData.phone}
                                        onChange={(e) => updateField("phone", e.target.value)}
                                        onKeyDown={handlePhoneKeyDown}
                                        disabled={loading}
                                        className={`flex-1 px-3.5 py-2.5 text-sm rounded-lg border ${errors.phone ? 'border-red-400 bg-red-50' : 'border-gray-300'} focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all disabled:bg-gray-50`}
                                        placeholder="5551234567"
                                    />
                                </div>
                                {errors.phone && <p className="text-red-600 text-xs mt-1.5 flex items-center gap-1"><span className="inline-block w-1 h-1 bg-red-600 rounded-full"></span>{errors.phone}</p>}
                            </div>

                            {/* Expertise Field */}
                            <div>
                                <label htmlFor="expertise" className="block text-sm font-semibold text-gray-700 mb-2">
                                    Uzmanlık Alanınız <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="expertise"
                                    value={formData.expertise}
                                    onChange={(e) => updateField("expertise", e.target.value)}
                                    disabled={loading}
                                    className={`w-full px-3.5 py-2.5 text-sm rounded-lg border ${errors.expertise ? 'border-red-400 bg-red-50' : 'border-gray-100'} focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all disabled:bg-gray-50`}
                                    placeholder="Örn: Gramer, Konuşma Pratiği"
                                />
                                {errors.expertise && <p className="text-red-600 text-xs mt-1.5 flex items-center gap-1"><span className="inline-block w-1 h-1 bg-red-600 rounded-full"></span>{errors.expertise}</p>}
                            </div>

                            {/* Bio Field */}
                            <div>
                                <label htmlFor="bio" className="block text-sm font-semibold text-gray-700 mb-2">
                                    Kısa Özgeçmiş <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    id="bio"
                                    rows={3}
                                    value={formData.bio}
                                    onChange={(e) => updateField("bio", e.target.value)}
                                    disabled={loading}
                                    className={`w-full px-3.5 py-2.5 text-sm rounded-lg border ${errors.bio ? 'border-red-400 bg-red-50' : 'border-gray-100'} focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all disabled:bg-gray-50 resize-none`}
                                    placeholder="Tecrübelerinizden bahsedin..."
                                />
                                {errors.bio && <p className="text-red-600 text-xs mt-1.5 flex items-center gap-1"><span className="inline-block w-1 h-1 bg-red-600 rounded-full"></span>{errors.bio}</p>}
                            </div>

                            {/* Password Fields */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                                        Şifre <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="password"
                                        id="password"
                                        value={formData.password}
                                        onChange={(e) => updateField("password", e.target.value)}
                                        disabled={loading}
                                        className={`w-full px-3.5 py-2.5 text-sm rounded-lg border ${errors.password ? 'border-red-400 bg-red-50' : 'border-gray-300'} focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all disabled:bg-gray-50`}
                                        placeholder="••••••••"
                                    />
                                    {errors.password && <p className="text-red-600 text-xs mt-1.5 flex items-center gap-1"><span className="inline-block w-1 h-1 bg-red-600 rounded-full"></span>{errors.password}</p>}
                                </div>

                                <div>
                                    <label htmlFor="confirm-password" className="block text-sm font-semibold text-gray-700 mb-2">
                                        Şifre Tekrar <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="password"
                                        id="confirm-password"
                                        value={formData.confirmPassword}
                                        onChange={(e) => updateField("confirmPassword", e.target.value)}
                                        disabled={loading}
                                        className={`w-full px-3.5 py-2.5 text-sm rounded-lg border ${errors.confirmPassword ? 'border-red-400 bg-red-50' : 'border-gray-300'} focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all disabled:bg-gray-50`}
                                        placeholder="••••••••"
                                    />
                                    {errors.confirmPassword && <p className="text-red-600 text-xs mt-1.5 flex items-center gap-1"><span className="inline-block w-1 h-1 bg-red-600 rounded-full"></span>{errors.confirmPassword}</p>}
                                </div>
                            </div>

                            {/* Terms Checkbox */}
                            <div className="pt-2">
                                <div className="flex items-start gap-2.5">
                                    <input
                                        type="checkbox"
                                        id="terms"
                                        checked={formData.termsAccepted}
                                        onChange={(e) => updateField("termsAccepted", e.target.checked)}
                                        disabled={loading}
                                        className="mt-0.5 w-4 h-4 rounded border-gray-300 text-brand-primary focus:ring-brand-primary cursor-pointer"
                                    />
                                    <label htmlFor="terms" className="text-sm text-gray-600 leading-relaxed font-medium">
                                        <button
                                            type="button"
                                            onClick={() => setShowTermsModal(true)}
                                            className="text-brand-primary hover:underline font-semibold"
                                        >
                                            Kullanım Şartları
                                        </button>&apos;nı kabul ediyorum. <span className="text-red-500">*</span>
                                    </label>
                                </div>
                                {errors.terms && <p className="text-red-600 text-xs mt-1.5 flex items-center gap-1 ml-6"><span className="inline-block w-1 h-1 bg-red-600 rounded-full"></span>{errors.terms}</p>}
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={!isFormValid() || loading}
                                className={`w-full py-3 rounded-lg font-semibold transition-all text-base mt-5 flex items-center justify-center gap-2 ${isFormValid() && !loading
                                    ? 'bg-brand-primary text-white hover:bg-brand-primary-hover shadow-md hover:shadow-lg'
                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    }`}
                            >
                                {loading ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        Kayıt yapılıyor...
                                    </>
                                ) : "Başvuruyu Tamamla"}
                            </button>
                        </form>
                    )}

                    {/* Login Link */}
                    <div className="mt-5 text-center text-sm border-t border-gray-100 pt-5">
                        <span className="text-gray-600">Zaten hesabınız var mı? </span>
                        <Link href="/giris" className="text-brand-primary font-semibold hover:underline">
                            Giriş Yapın
                        </Link>
                    </div>
                </div>
            </main>

            {/* Terms Modal */}
            <TermsModal
                isOpen={showTermsModal}
                onClose={() => setShowTermsModal(false)}
                onAccept={handleAcceptTerms}
                content={termsContent}
            />
        </>
    );
}
