import { render, screen, fireEvent } from '@testing-library/react';
import TabNav from './TabNav';

const tabs = [
  { id: 'live', name: 'Live Status', icon: '🔴' },
  { id: 'players', name: 'Players', icon: '👥', count: 12 },
  { id: 'reset', name: 'Auction Tools', icon: '🔄', badge: 3 },
];

test('renders every tab with its name', () => {
  render(<TabNav tabs={tabs} activeTab="live" onSelect={() => {}} />);
  expect(screen.getByRole('button', { name: /Live Status/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Players/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Auction Tools/i })).toBeInTheDocument();
});

test('shows count and badge pills when > 0', () => {
  render(<TabNav tabs={tabs} activeTab="live" onSelect={() => {}} />);
  expect(screen.getByText('12')).toBeInTheDocument();
  expect(screen.getByText('3')).toBeInTheDocument();
});

test('calls onSelect with the tab id when clicked', () => {
  const onSelect = jest.fn();
  render(<TabNav tabs={tabs} activeTab="live" onSelect={onSelect} />);
  fireEvent.click(screen.getByRole('button', { name: /Players/i }));
  expect(onSelect).toHaveBeenCalledWith('players');
});
