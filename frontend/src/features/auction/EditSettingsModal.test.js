import { render, screen, fireEvent } from '@testing-library/react';
import EditSettingsModal from './EditSettingsModal';

const config = {
  teamCount: 4,
  startingBudget: 1000,
  maxPlayersPerTeam: 15,
  basePrice: 10,
  currency: 'INR',
  biddingIncrements: [{ threshold: 50, increment: 5 }],
};

test('renders nothing when closed', () => {
  const { container } = render(<EditSettingsModal open={false} config={config} />);
  expect(container).toBeEmptyDOMElement();
});

test('renders settings fields when open and fires save', () => {
  const onSave = jest.fn();
  render(<EditSettingsModal open config={config} onSave={onSave} onChange={() => {}} />);
  expect(screen.getByText(/Edit Auction Settings/i)).toBeInTheDocument();
  expect(screen.getByText(/Bidding Increments/i)).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /Save Settings/i }));
  expect(onSave).toHaveBeenCalled();
});
