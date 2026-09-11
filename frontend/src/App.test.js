import { render, screen } from '@testing-library/react';
import App from './App';

// Mock network/socket so lazy children never make real calls during the smoke test.
jest.mock('axios');
jest.mock('socket.io-client', () => ({
  io: () => ({ on: jest.fn(), off: jest.fn(), emit: jest.fn(), disconnect: jest.fn() }),
}));

test('App mounts and shows the branded loading fallback', () => {
  render(<App />);
  expect(screen.getByText(/Loading GoldenBidX/i)).toBeInTheDocument();
});
