import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuction } from './useAuction';
import { getAuction } from '../api/auctionApi';

// Factory mock so the real api module (and its axios import) is never loaded.
jest.mock('../api/auctionApi', () => ({ getAuction: jest.fn() }));

const makeWrapper = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
};

test('useAuction returns the fetched auction snapshot', async () => {
  getAuction.mockResolvedValue({ players: [{ id: 1 }], teams: [] });
  const { result } = renderHook(() => useAuction(), { wrapper: makeWrapper() });

  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  expect(result.current.data).toEqual({ players: [{ id: 1 }], teams: [] });
});
