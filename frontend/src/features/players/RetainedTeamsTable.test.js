import { render, screen } from '@testing-library/react';
import RetainedTeamsTable from './RetainedTeamsTable';

test('shows the empty state when nothing is retained', () => {
  render(<RetainedTeamsTable retainedPlayers={[]} teams={[]} />);
  expect(screen.getByText(/No Retained Players/i)).toBeInTheDocument();
});

test('renders per-team retained players and the overall summary', () => {
  const teams = [{ id: 't1', name: 'Warriors' }];
  const retainedPlayers = [
    { id: 'p1', team: 't1', role: 'Opener', category: 'batter', retentionAmount: 100 },
  ];
  render(<RetainedTeamsTable retainedPlayers={retainedPlayers} teams={teams} />);
  expect(screen.getByText(/Team-wise Overview/i)).toBeInTheDocument();
  expect(screen.getByText(/Total Retained/i)).toBeInTheDocument();
});
