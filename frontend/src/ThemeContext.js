import React, { createContext, useContext, useEffect, useState } from 'react';

// Single source of truth for the app-wide light/dark (gold) theme.
// Persisted to localStorage; defaults to dark/gold branding.
const ThemeContext = createContext({ theme: 'dark', toggleTheme: () => {} });

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => localStorage.getItem('dashTheme') || 'dark');

  useEffect(() => {
    localStorage.setItem('dashTheme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;
