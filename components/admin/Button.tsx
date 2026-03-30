'use client';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  icon?: string;
  size?: 'sm' | 'md';
  loading?: boolean;
}

export default function Button({
  variant = 'primary',
  icon,
  size = 'md',
  loading = false,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const baseClasses = 'font-black uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-center rounded-lg shadow-sm active:scale-95';
  const sizeClass = size === 'sm' ? 'px-4 py-2 text-[11px]' : 'px-8 py-3.5 text-[13px] gap-3';

  const variantClassMap: Record<ButtonVariant, string> = {
    primary: 'bg-brand-primary text-white hover:bg-brand-primary-dark shadow-md shadow-brand-primary/20 hover:-translate-y-0.5',
    secondary: 'bg-white text-gray-700 border border-gray-100 hover:border-gray-200 hover:bg-gray-50',
    danger: 'bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 hover:text-red-700',
    ghost: 'bg-transparent text-gray-400 hover:text-brand-primary hover:bg-gray-50',
  };

  return (
    <button
      className={`${baseClasses} ${sizeClass} ${variantClassMap[variant]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <i className="fas fa-spinner fa-spin"></i>
      ) : icon ? (
        <i className={`fas ${icon} ${children ? '' : ''}`}></i>
      ) : null}
      {children}
    </button>
  );
}
