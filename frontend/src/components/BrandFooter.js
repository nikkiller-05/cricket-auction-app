import React from 'react';

// Shared brand/credit footer. Use theme="dark" on dark backgrounds (landing),
// "light" on the dashboard's lighter surface.
const BrandFooter = ({ theme = 'light' }) => {
  const isDark = theme === 'dark';
  return (
    <footer className="py-8 text-center">
      <div className="max-w-6xl mx-auto px-4">
        <div
          className={`mx-auto mb-4 h-px w-44 bg-gradient-to-r from-transparent to-transparent ${
            isDark ? 'via-white/25' : 'via-slate-300'
          }`}
        />
        <p
          className={`text-[11px] uppercase tracking-[0.3em] font-semibold mb-1.5 ${
            isDark ? 'text-indigo-300/70' : 'text-slate-400'
          }`}
        >
          Crafted by
        </p>
        <p
          className={`text-base sm:text-lg font-bold bg-clip-text text-transparent ${
            isDark
              ? 'bg-gradient-to-r from-white via-indigo-100 to-fuchsia-200'
              : 'bg-gradient-to-r from-indigo-600 to-fuchsia-600'
          }`}
        >
          The Vernekar Brothers
        </p>
        <p className={`text-sm mt-0.5 tracking-wide ${isDark ? 'text-indigo-200/80' : 'text-slate-500'}`}>
          Nikhil &amp; Shripad
        </p>
        <p className={`text-xs mt-3 ${isDark ? 'text-blue-300/50' : 'text-slate-400'}`}>
          © 2025 Auction · Bid · Discover · Own
        </p>
      </div>
    </footer>
  );
};

export default BrandFooter;
