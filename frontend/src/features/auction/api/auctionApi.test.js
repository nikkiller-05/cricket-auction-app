import apiClient from '../../../lib/apiClient';
import { getAuction } from './auctionApi';

jest.mock('../../../lib/apiClient', () => ({
  __esModule: true,
  default: { get: jest.fn() },
}));

test('getAuction requests the snapshot endpoint and returns its payload', async () => {
  apiClient.get.mockResolvedValue({ data: { players: [], teams: [], settings: {} } });
  await expect(getAuction()).resolves.toEqual({ players: [], teams: [], settings: {} });
  expect(apiClient.get).toHaveBeenCalledWith('/api/auction/data');
});
