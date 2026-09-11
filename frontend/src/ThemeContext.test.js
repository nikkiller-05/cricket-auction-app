import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, useTheme } from './ThemeContext';

const Probe = () => {
  const { theme, toggleTheme } = useTheme();
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <button onClick={toggleTheme}>toggle</button>
    </div>
  );
};

beforeEach(() => localStorage.clear());

test('defaults to the dark (gold) theme', () => {
  render(
    <ThemeProvider>
      <Probe />
    </ThemeProvider>
  );
  expect(screen.getByTestId('theme')).toHaveTextContent('dark');
});

test('toggles between dark and light and persists to localStorage', () => {
  render(
    <ThemeProvider>
      <Probe />
    </ThemeProvider>
  );
  fireEvent.click(screen.getByText('toggle'));
  expect(screen.getByTestId('theme')).toHaveTextContent('light');
  expect(localStorage.getItem('dashTheme')).toBe('light');
});
