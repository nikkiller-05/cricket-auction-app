import { render, screen } from '@testing-library/react';
import SpectatorPlayerGroups from './SpectatorPlayerGroups';

const player = { id: 'p1', team: 't1', role: 'Opener', category: 'batter', finalBid: 100 };
const teams = [{ id: 't1', name: 'Warriors' }];

test('renders the sold group for the sold filter', () => {
  render(
    <SpectatorPlayerGroups
      spectatorPlayerFilter="sold"
      teams={teams}
      soldPlayers={[player]}
    />
  );
  expect(screen.getByText(/Players Sold Through Bidding/i)).toBeInTheDocument();
});

test('shows the no-results message for an empty non-all filter', () => {
  render(<SpectatorPlayerGroups spectatorPlayerFilter="unsold" teams={teams} unsoldPlayers={[]} />);
  expect(screen.getByText(/No Players Found/i)).toBeInTheDocument();
});
