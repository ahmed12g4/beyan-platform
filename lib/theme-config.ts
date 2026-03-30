/**
 * THEME_CONFIG — Admin panel design tokens.
 *
 * Brand colors reference the CSS variables defined in app/globals.css :root.
 * To change the brand palette, edit globals.css only — changes propagate everywhere.
 *
 * For inline `style={{ color: ... }}` props we use `var(--brand-*)` strings;
 * CSS resolves them at runtime.
 */
export const THEME_CONFIG = {
  brandName: 'Beyan Dil Akademi',
  adminTitle: 'Yönetim Paneli',
  logoPath: '/assets/images/logo.png',

  colors: {
    // ── Primary brand (resolves from globals.css :root) ──────────────────
    primary: 'var(--brand-primary)',
    primaryHover: 'var(--brand-primary-dark)',
    primaryLight: 'var(--brand-primary-light)',
    secondary: 'var(--brand-accent)',

    // ── Top navigation ────────────────────────────────────────────────────
    topNavBg: 'var(--brand-primary)',
    topNavText: '#ffffff',
    topNavActiveText: 'var(--brand-accent)',
    topNavActiveBg: 'rgba(254, 221, 89, 0.1)',
    topNavHover: 'var(--brand-primary-dark)',
    topNavBorder: 'var(--brand-primary-dark)',

    // ── Page & card ───────────────────────────────────────────────────────
    pageBg: '#f9fafa',
    cardBg: '#ffffff',
    cardBorder: '#e5e7eb',

    // ── Status badges ─────────────────────────────────────────────────────
    status: {
      pending: { bg: '#fff3cd', text: '#856404' },
      approved: { bg: '#d4edda', text: '#155724' },
      rejected: { bg: '#f8d7da', text: '#721c24' },
      active: { bg: '#d1fae5', text: '#065f46' },
      inactive: { bg: '#f3f4f6', text: '#6b7280' },
    },

    // ── Feedback ──────────────────────────────────────────────────────────
    success: '#10b981',
    error: '#ef4444',
    errorHover: '#dc2626',
    warning: '#f59e0b',
    info: '#3b82f6',

    // ── Text ──────────────────────────────────────────────────────────────
    textPrimary: '#1f2937',
    textSecondary: '#6b7280',
    textMuted: '#9ca3af',

    // ── Inputs ────────────────────────────────────────────────────────────
    inputBorder: '#d1d5db',
    inputFocus: 'var(--brand-primary)',

    // ── Button variants ───────────────────────────────────────────────────
    danger: '#ef4444',
    dangerHover: '#dc2626',
    ghost: 'transparent',
    ghostHover: '#f3f4f6',
    ghostText: '#6b7280',
  },

  layout: {
    topNavHeight: '64px',
    topNavHeightMobile: '56px',
    maxContentWidth: '1400px',
    cardRadius: '8px',
    buttonRadius: '6px',
    cardPadding: '24px',
    cardGap: '20px',
    contentPadding: '24px',
  },

  fonts: {
    heading: 'Playfair Display',
    body: 'Montserrat',
  },
} as const;

export type ThemeConfig = typeof THEME_CONFIG;
