import apiClient from '../../../lib/apiClient';

// Fetch the full auction snapshot (settings, teams, players, status).
export const getAuction = async () => {
  const { data } = await apiClient.get('/api/auction/data');
  return data;
};
