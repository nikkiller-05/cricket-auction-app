import { render, screen } from '@testing-library/react';
import LiveStatusPanel from './LiveStatusPanel';

const auctionData = { auctionStatus: 'running', currentBid: null, teams: [], players: [] };

test('shows the empty activity message when there is nothing yet', () => {
  render(
    <LiveStatusPanel
      auctionData={auctionData}
      transactionHistory={[]}
      soldPlayers={[]}
      unsoldPlayers={[]}
      onShare={() => {}}
    />
  );
  expect(screen.getByText(/No auction activity yet/i)).toBeInTheDocument();
});

test('renders a sold transaction from history', () => {
  const transactionHistory = [
    {
      id: 'tx1',
      type: 'sold',
      playerName: 'Rohit',
      playerRole: 'Batter',
      playerCategory: 'batter',
      finalBid: 500,
      team: { id: 't1' },
      player: { team: 't1' },
      timestamp: new Date(),
    },
  ];
  render(
    <LiveStatusPanel
      auctionData={{ ...auctionData, teams: [{ id: 't1', name: 'Warriors' }] }}
      transactionHistory={transactionHistory}
      soldPlayers={[]}
      unsoldPlayers={[]}
      onShare={() => {}}
    />
  );
  expect(screen.getByText('Rohit')).toBeInTheDocument();
});
