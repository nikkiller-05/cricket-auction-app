import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../../lib/queryKeys';
import { getAuction } from '../api/auctionApi';

// Read-only auction snapshot via React Query. Socket events will invalidate/patch
// this cache in a later slice; for now it is an isolated, cached fetch.
export const useAuction = (options = {}) =>
  useQuery({ queryKey: queryKeys.auction, queryFn: getAuction, ...options });
