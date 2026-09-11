import { render, screen } from '@testing-library/react';
import StatCards from './StatCards';

test('shows core cards and hides Captains/Retained when disabled', () => {
  render(
    <StatCards
      totalPlayers={20}
      sold={5}
      available={12}
      unsold={3}
      enableCaptains={false}
      enableRetention={false}
    />
  );
  expect(screen.getByText('Total Players')).toBeInTheDocument();
  expect(screen.getByText('Players Sold')).toBeInTheDocument();
  expect(screen.queryByText('Captains')).not.toBeInTheDocument();
  expect(screen.queryByText('Retained')).not.toBeInTheDocument();
});

test('shows Captains and Retained cards when enabled', () => {
  render(
    <StatCards
      totalPlayers={20}
      sold={5}
      retained={4}
      captains={2}
      available={9}
      unsold={0}
      enableCaptains
      enableRetention
    />
  );
  expect(screen.getByText('Captains')).toBeInTheDocument();
  expect(screen.getByText('Retained')).toBeInTheDocument();
});
