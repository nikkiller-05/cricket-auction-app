import React from 'react';

// Modern pill button: vibrant gradient fills with soft glow for primary actions,
// quieter styles for secondary. One place controls all button styling.
// Variants: primary | success | danger | secondary | ghost | glass
// Sizes: sm | md | lg | xl   (bigger = more important)
const VARIANTS = {
  primary:
    'text-white font-bold bg-gradient-to-br from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 shadow-lg shadow-violet-600/40 hover:shadow-violet-500/50 focus-visible:ring-violet-400',
  success:
    'text-white font-bold bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 shadow-lg shadow-emerald-600/40 hover:shadow-emerald-500/50 focus-visible:ring-emerald-400',
  danger:
    'text-white font-bold bg-gradient-to-br from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 shadow-lg shadow-rose-600/40 hover:shadow-rose-500/50 focus-visible:ring-rose-400',
  secondary:
    'text-slate-700 font-semibold bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-sm focus-visible:ring-slate-300',
  ghost:
    'text-slate-600 font-semibold bg-transparent hover:bg-slate-100 focus-visible:ring-slate-300',
  glass:
    'text-white font-semibold bg-white/10 border border-white/25 hover:bg-white/20 backdrop-blur focus-visible:ring-white/50',
};

// Pill shape (rounded-full) at every size; scale grows with importance.
const SIZES = {
  sm: 'text-xs px-4 py-2 gap-1.5',
  md: 'text-sm px-5 py-2.5 gap-2',
  lg: 'text-sm sm:text-base px-6 sm:px-7 py-3 sm:py-3.5 gap-2',
  xl: 'text-base sm:text-lg px-7 sm:px-9 py-3.5 sm:py-4 gap-2.5',
};

const Button = ({
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  loading = false,
  type = 'button',
  children,
  ...props
}) => (
  <button
    type={type}
    disabled={disabled || loading}
    className={`inline-flex items-center justify-center rounded-full tracking-tight transition-[background-color,transform,box-shadow] duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none disabled:shadow-none ${VARIANTS[variant] || VARIANTS.primary} ${SIZES[size] || SIZES.md} ${className}`}
    {...props}
  >
    {loading && <span className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />}
    {children}
  </button>
);

export default Button;
