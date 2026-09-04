import React from 'react';

// Tactile modern button (shadcn / Linear / Vercel inspired):
// - top inner highlight (inset white) for a lit, 3D feel
// - crisp 1px border + layered depth shadow that compresses on press
// - hover lifts + brightens, sheen sweep; active pushes down (tactile)
// Variants: primary | success | danger | secondary | ghost | glass
// Sizes: sm | md | lg | xl   (bigger = more important)
const VARIANTS = {
  primary:
    'text-white bg-gradient-to-b from-indigo-500 to-violet-600 border border-indigo-700/40 ' +
    'shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_6px_16px_-4px_rgba(99,102,241,0.55)] ' +
    'hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_10px_24px_-6px_rgba(99,102,241,0.65)] ' +
    'focus-visible:ring-violet-400',
  success:
    'text-white bg-gradient-to-b from-emerald-500 to-teal-600 border border-emerald-700/40 ' +
    'shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_6px_16px_-4px_rgba(16,185,129,0.55)] ' +
    'hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_10px_24px_-6px_rgba(16,185,129,0.65)] ' +
    'focus-visible:ring-emerald-400',
  danger:
    'text-white bg-gradient-to-b from-rose-500 to-red-600 border border-rose-700/40 ' +
    'shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_6px_16px_-4px_rgba(244,63,94,0.55)] ' +
    'hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_10px_24px_-6px_rgba(244,63,94,0.65)] ' +
    'focus-visible:ring-rose-400',
  secondary:
    'text-slate-700 bg-gradient-to-b from-white to-slate-50 border border-slate-200 ' +
    'shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_2px_6px_-1px_rgba(15,23,42,0.12)] ' +
    'hover:from-white hover:to-slate-100 hover:border-slate-300 ' +
    'hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_6px_16px_-4px_rgba(15,23,42,0.18)] ' +
    'focus-visible:ring-slate-300',
  ghost:
    'text-slate-600 bg-transparent border border-transparent hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-slate-300',
  glass:
    'text-white bg-white/10 border border-white/25 backdrop-blur ' +
    'shadow-[inset_0_1px_0_rgba(255,255,255,0.3)] hover:bg-white/20 focus-visible:ring-white/50',
};

// Pill shape (rounded-full) at every size; scale grows with importance.
const SIZES = {
  sm: 'text-xs font-semibold px-4 py-2',
  md: 'text-sm font-semibold px-5 py-2.5',
  lg: 'text-sm sm:text-base font-bold px-6 sm:px-7 py-3 sm:py-3.5',
  xl: 'text-base sm:text-lg font-bold px-7 sm:px-9 py-3.5 sm:py-4',
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
    className={
      'group relative inline-flex select-none items-center justify-center overflow-hidden rounded-full tracking-tight ' +
      'transition-[transform,box-shadow,filter,background-color,border-color] duration-200 ease-out ' +
      'hover:-translate-y-0.5 hover:brightness-[1.04] active:translate-y-0 active:scale-[0.97] active:brightness-95 ' +
      'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ' +
      'disabled:opacity-50 disabled:pointer-events-none disabled:shadow-none disabled:translate-y-0 ' +
      `${VARIANTS[variant] || VARIANTS.primary} ${SIZES[size] || SIZES.md} ${className}`
    }
    {...props}
  >
    {/* Sheen sweep on hover */}
    <span
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full"
    />
    {loading && (
      <span className="relative mr-2 animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
    )}
    <span className="relative inline-flex items-center gap-2">{children}</span>
  </button>
);

export default Button;
