# Supabase Email Templates — Beyan Dil Akademi

Copy each template into **Supabase Dashboard → Authentication → Email Templates**

---

## 1. Confirm Sign Up
**Subject:** `Beyan Dil Akademi — E-posta Doğrulama`

```html
<div style="max-width:520px;margin:0 auto;font-family:'Segoe UI',Arial,sans-serif;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">
  <div style="background:linear-gradient(135deg,#204544 0%,#2a6b6a 100%);padding:32px 24px;text-align:center;">
    <h1 style="color:#FEDD59;font-size:24px;margin:0;">Beyan Dil Akademi</h1>
    <p style="color:rgba(255,255,255,0.8);font-size:14px;margin:8px 0 0;">Modern Arapça Eğitimi</p>
  </div>
  <div style="padding:32px 24px;">
    <h2 style="color:#1f2937;font-size:20px;margin:0 0 8px;">E-posta Doğrulama ✉️</h2>
    <p style="color:#6b7280;font-size:15px;line-height:1.6;">Merhaba,</p>
    <p style="color:#6b7280;font-size:15px;line-height:1.6;">Beyan Dil Akademi'ye kaydolduğunuz için teşekkürler! Hesabınızı aktifleştirmek için aşağıdaki butona tıklayın:</p>
    <div style="text-align:center;margin:28px 0;">
      <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup" style="display:inline-block;background:linear-gradient(135deg,#204544,#2a6b6a);color:#ffffff;font-size:16px;font-weight:600;padding:14px 36px;border-radius:12px;text-decoration:none;">E-postamı Doğrula</a>
    </div>
    <p style="color:#9ca3af;font-size:13px;line-height:1.5;">Bu bağlantı 1 saat geçerlidir. Eğer siz kayıt olmadıysanız, bu e-postayı görmezden gelebilirsiniz.</p>
  </div>
  <div style="background:#f9fafb;padding:16px 24px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="color:#9ca3af;font-size:12px;margin:0;">© 2026 Beyan Dil Akademi. Tüm hakları saklıdır.</p>
  </div>
</div>
```

---

## 2. Invite User
**Subject:** `Beyan Dil Akademi'ye Davetlisiniz!`

```html
<div style="max-width:520px;margin:0 auto;font-family:'Segoe UI',Arial,sans-serif;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">
  <div style="background:linear-gradient(135deg,#204544 0%,#2a6b6a 100%);padding:32px 24px;text-align:center;">
    <h1 style="color:#FEDD59;font-size:24px;margin:0;">Beyan Dil Akademi</h1>
    <p style="color:rgba(255,255,255,0.8);font-size:14px;margin:8px 0 0;">Modern Arapça Eğitimi</p>
  </div>
  <div style="padding:32px 24px;">
    <h2 style="color:#1f2937;font-size:20px;margin:0 0 8px;">Davetlisiniz! 🎉</h2>
    <p style="color:#6b7280;font-size:15px;line-height:1.6;">Merhaba,</p>
    <p style="color:#6b7280;font-size:15px;line-height:1.6;">Beyan Dil Akademi platformuna davet edildiniz. Hesabınızı oluşturmak için aşağıdaki butona tıklayın:</p>
    <div style="text-align:center;margin:28px 0;">
      <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=invite" style="display:inline-block;background:linear-gradient(135deg,#204544,#2a6b6a);color:#ffffff;font-size:16px;font-weight:600;padding:14px 36px;border-radius:12px;text-decoration:none;">Daveti Kabul Et</a>
    </div>
    <p style="color:#9ca3af;font-size:13px;line-height:1.5;">Bu bağlantı 24 saat geçerlidir.</p>
  </div>
  <div style="background:#f9fafb;padding:16px 24px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="color:#9ca3af;font-size:12px;margin:0;">© 2026 Beyan Dil Akademi. Tüm hakları saklıdır.</p>
  </div>
</div>
```

---

## 3. Magic Link
**Subject:** `Beyan Dil Akademi — Giriş Bağlantısı`

```html
<div style="max-width:520px;margin:0 auto;font-family:'Segoe UI',Arial,sans-serif;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">
  <div style="background:linear-gradient(135deg,#204544 0%,#2a6b6a 100%);padding:32px 24px;text-align:center;">
    <h1 style="color:#FEDD59;font-size:24px;margin:0;">Beyan Dil Akademi</h1>
    <p style="color:rgba(255,255,255,0.8);font-size:14px;margin:8px 0 0;">Modern Arapça Eğitimi</p>
  </div>
  <div style="padding:32px 24px;">
    <h2 style="color:#1f2937;font-size:20px;margin:0 0 8px;">Giriş Bağlantısı 🔗</h2>
    <p style="color:#6b7280;font-size:15px;line-height:1.6;">Merhaba,</p>
    <p style="color:#6b7280;font-size:15px;line-height:1.6;">Hesabınıza giriş yapmak için aşağıdaki butona tıklayın:</p>
    <div style="text-align:center;margin:28px 0;">
      <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=magiclink" style="display:inline-block;background:linear-gradient(135deg,#204544,#2a6b6a);color:#ffffff;font-size:16px;font-weight:600;padding:14px 36px;border-radius:12px;text-decoration:none;">Giriş Yap</a>
    </div>
    <p style="color:#9ca3af;font-size:13px;line-height:1.5;">Bu bağlantı 1 saat geçerlidir. Eğer giriş yapmak istemediyseniz, bu e-postayı görmezden gelebilirsiniz.</p>
  </div>
  <div style="background:#f9fafb;padding:16px 24px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="color:#9ca3af;font-size:12px;margin:0;">© 2026 Beyan Dil Akademi. Tüm hakları saklıdır.</p>
  </div>
</div>
```

---

## 4. Change Email Address
**Subject:** `Beyan Dil Akademi — E-posta Değişikliği`

```html
<div style="max-width:520px;margin:0 auto;font-family:'Segoe UI',Arial,sans-serif;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">
  <div style="background:linear-gradient(135deg,#204544 0%,#2a6b6a 100%);padding:32px 24px;text-align:center;">
    <h1 style="color:#FEDD59;font-size:24px;margin:0;">Beyan Dil Akademi</h1>
    <p style="color:rgba(255,255,255,0.8);font-size:14px;margin:8px 0 0;">Modern Arapça Eğitimi</p>
  </div>
  <div style="padding:32px 24px;">
    <h2 style="color:#1f2937;font-size:20px;margin:0 0 8px;">E-posta Değişikliği 📧</h2>
    <p style="color:#6b7280;font-size:15px;line-height:1.6;">Merhaba,</p>
    <p style="color:#6b7280;font-size:15px;line-height:1.6;">E-posta adresinizi değiştirme talebiniz alındı. Yeni e-posta adresinizi onaylamak için aşağıdaki butona tıklayın:</p>
    <div style="text-align:center;margin:28px 0;">
      <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email_change" style="display:inline-block;background:linear-gradient(135deg,#204544,#2a6b6a);color:#ffffff;font-size:16px;font-weight:600;padding:14px 36px;border-radius:12px;text-decoration:none;">E-postayı Onayla</a>
    </div>
    <p style="color:#9ca3af;font-size:13px;line-height:1.5;">Eğer bu talebi siz yapmadıysanız, lütfen bu e-postayı görmezden gelin.</p>
  </div>
  <div style="background:#f9fafb;padding:16px 24px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="color:#9ca3af;font-size:12px;margin:0;">© 2026 Beyan Dil Akademi. Tüm hakları saklıdır.</p>
  </div>
</div>
```

---

## 5. Reset Password
**Subject:** `Beyan Dil Akademi — Şifre Sıfırlama`

```html
<div style="max-width:520px;margin:0 auto;font-family:'Segoe UI',Arial,sans-serif;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">
  <div style="background:linear-gradient(135deg,#204544 0%,#2a6b6a 100%);padding:32px 24px;text-align:center;">
    <h1 style="color:#FEDD59;font-size:24px;margin:0;">Beyan Dil Akademi</h1>
    <p style="color:rgba(255,255,255,0.8);font-size:14px;margin:8px 0 0;">Modern Arapça Eğitimi</p>
  </div>
  <div style="padding:32px 24px;">
    <h2 style="color:#1f2937;font-size:20px;margin:0 0 8px;">Şifre Sıfırlama 🔒</h2>
    <p style="color:#6b7280;font-size:15px;line-height:1.6;">Merhaba,</p>
    <p style="color:#6b7280;font-size:15px;line-height:1.6;">Şifrenizi sıfırlama talebinde bulundunuz. Yeni şifrenizi belirlemek için aşağıdaki butona tıklayın:</p>
    <div style="text-align:center;margin:28px 0;">
      <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery" style="display:inline-block;background:linear-gradient(135deg,#204544,#2a6b6a);color:#ffffff;font-size:16px;font-weight:600;padding:14px 36px;border-radius:12px;text-decoration:none;">Şifremi Sıfırla</a>
    </div>
    <p style="color:#9ca3af;font-size:13px;line-height:1.5;">Bu bağlantı 1 saat geçerlidir. Eğer şifre sıfırlama talebinde bulunmadıysanız, bu e-postayı görmezden gelebilirsiniz.</p>
  </div>
  <div style="background:#f9fafb;padding:16px 24px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="color:#9ca3af;font-size:12px;margin:0;">© 2026 Beyan Dil Akademi. Tüm hakları saklıdır.</p>
  </div>
</div>
```

---

## 6. Reauthentication
**Subject:** `Beyan Dil Akademi — Güvenlik Doğrulaması`

```html
<div style="max-width:520px;margin:0 auto;font-family:'Segoe UI',Arial,sans-serif;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">
  <div style="background:linear-gradient(135deg,#204544 0%,#2a6b6a 100%);padding:32px 24px;text-align:center;">
    <h1 style="color:#FEDD59;font-size:24px;margin:0;">Beyan Dil Akademi</h1>
    <p style="color:rgba(255,255,255,0.8);font-size:14px;margin:8px 0 0;">Modern Arapça Eğitimi</p>
  </div>
  <div style="padding:32px 24px;">
    <h2 style="color:#1f2937;font-size:20px;margin:0 0 8px;">Güvenlik Doğrulaması 🔐</h2>
    <p style="color:#6b7280;font-size:15px;line-height:1.6;">Merhaba,</p>
    <p style="color:#6b7280;font-size:15px;line-height:1.6;">Hassas bir işlem gerçekleştirmek için kimliğinizi doğrulamanız gerekiyor. Doğrulama kodunuz:</p>
    <div style="text-align:center;margin:28px 0;">
      <div style="display:inline-block;background:#f3f4f6;padding:16px 32px;border-radius:12px;border:2px dashed #d1d5db;">
        <span style="font-size:32px;font-weight:700;color:#204544;letter-spacing:8px;">{{ .Token }}</span>
      </div>
    </div>
    <p style="color:#9ca3af;font-size:13px;line-height:1.5;">Bu kod 10 dakika geçerlidir. Eğer bu talebi siz yapmadıysanız, lütfen şifrenizi hemen değiştirin.</p>
  </div>
  <div style="background:#f9fafb;padding:16px 24px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="color:#9ca3af;font-size:12px;margin:0;">© 2026 Beyan Dil Akademi. Tüm hakları saklıdır.</p>
  </div>
</div>
```
