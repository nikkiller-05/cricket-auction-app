import { render, screen, fireEvent } from '@testing-library/react';
import PlayerFilterChips from './PlayerFilterChips';

test('hides Captains/Retentions chips when their features are off', () => {
  render(
    <PlayerFilterChips
      totalPlayers={10}
      sold={2}
      available={6}
      unsold={2}
      enableCaptains={false}
      enableRetention={false}
      active="all"
      onSelect={() => {}}
    />
  );
  expect(screen.getByRole('button', { name: /All Players/i })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /Captains/i })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /Retentions/i })).not.toBeInTheDocument();
});

test('shows Captains/Retentions chips and reports selection', () => {
  const onSelect = jest.fn();
  render(
    <PlayerFilterChips
      totalPlayers={10}
      sold={2}
      available={4}
      unsold={2}
      captains={1}
      retained={1}
      enableCaptains
      enableRetention
      active="all"
      onSelect={onSelect}
    />
  );
  fireEvent.click(screen.getByRole('button', { name: /Captains/i }));
  expect(onSelect).toHaveBeenCalledWith('captains');
});
