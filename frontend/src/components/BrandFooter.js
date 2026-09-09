import React from 'react';

// Shared brand/credit footer. Use theme="dark" on dark backgrounds (landing),
// "light" on the dashboard's lighter surface.
const BrandFooter = ({ theme = 'light' }) => {
  const isDark = theme === 'dark';
  return (
    <footer className="py-3 text-center">
      <p className={`text-[11px] ${isDark ? 'text-indigo-200/40' : 'text-slate-400'}`}>
        © 2025 GoldenBidX · Crafted by The Vernekar Brothers
      </p>
    </footer>
  );
};

export default BrandFooter;
